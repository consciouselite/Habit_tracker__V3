import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BottomNav } from '../../components/BottomNav';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface HabitStats {
  habit_id: string;
  name: string;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
}

export function Stats() {
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchHabitStats = async () => {
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', user.id);

      if (habitsError) {
        console.error('Error fetching habits:', habitsError);
        return;
      }

      const statsPromises = habits.map(async (habit) => {
        const stats = await calculateHabitStats(habit.id);
        return {
          habit_id: habit.id,
          name: habit.name,
          ...stats
        };
      });

      const stats = await Promise.all(statsPromises);
      setHabitStats(stats);
    };

    fetchHabitStats();

    const subscription = supabase
      .channel('habit_stats_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, () => {
        fetchHabitStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const calculateHabitStats = async (habitId: string) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(now.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('habit_id', habitId)
      .eq('user_id', user!.id)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: true });

    if (error) {
      console.error('Error fetching habit logs:', error);
      return { current_streak: 0, longest_streak: 0, completion_rate: 0 };
    }

    // Convert logs to dates and sort them
    const completedDates = (logs || []).map(log => 
      new Date(log.completed_at).toISOString().split('T')[0]
    );

    // Calculate completion rate
    const uniqueDays = new Set(completedDates);
    const completionRate = Math.round((uniqueDays.size / 30) * 100);

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    // Sort dates in reverse chronological order for current streak
    const sortedDates = [...uniqueDays].sort().reverse();
    
    // Calculate current streak
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() + 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      if (i === 0 && date !== today && previousDateStr !== today) {
        break;
      }

      if (i === 0 || previousDateStr === sortedDates[i - 1]) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let prevDate: Date | null = null;
    sortedDates.sort().forEach(dateStr => {
      const currentDate = new Date(dateStr);
      
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = currentDate;
    });

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      completion_rate: completionRate
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Statistics</h2>
        {habitStats.map((stats) => (
          <HabitStatistics key={stats.habit_id} stats={stats} />
        ))}
      </div>
      <BottomNav />
    </div>
  );
}

interface HabitStatisticsProps {
  stats: HabitStats;
}

const HabitStatistics: React.FC<HabitStatisticsProps> = ({ stats }) => {
  const [selectedView, setSelectedView] = useState('Daily');
  const [weeklyProgress, setWeeklyProgress] = useState<{ day: string; completed: boolean }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ name: string; completions: number }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchWeeklyProgress = async () => {
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const startOfWeek = new Date(now);
      startOfWeek.setUTCDate(now.getUTCDate() - dayOfWeek + 1);
      startOfWeek.setUTCHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      endOfWeek.setUTCHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', stats.habit_id)
        .eq('user_id', user.id)
        .gte('completed_at', startOfWeek.toISOString())
        .lte('completed_at', endOfWeek.toISOString());

      if (error) {
        console.error('Error fetching weekly progress:', error);
        return;
      }

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const progress = days.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setUTCDate(startOfWeek.getUTCDate() + index);
        const dateString = date.toISOString().split('T')[0];

        return {
          day,
          completed: (data || []).some(log => 
            new Date(log.completed_at).toISOString().split('T')[0] === dateString
          ),
        };
      });

      setWeeklyProgress(progress);
    };

    const fetchMonthlyData = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', stats.habit_id)
        .eq('user_id', user.id)
        .gte('completed_at', startOfMonth.toISOString())
        .lte('completed_at', endOfMonth.toISOString());

      if (error) {
        console.error('Error fetching monthly data:', error);
        return;
      }

      const weekData = Array(4).fill(0).map((_, i) => ({
        name: `Week ${i + 1}`,
        completions: 0
      }));

      (data || []).forEach(log => {
        const date = new Date(log.completed_at);
        const weekIndex = Math.floor((date.getDate() - 1) / 7);
        if (weekIndex < 4) {
          weekData[weekIndex].completions++;
        }
      });

      setMonthlyData(weekData);
    };

    fetchWeeklyProgress();
    fetchMonthlyData();
  }, [stats.habit_id, user]);

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-semibold">{stats.name}</h2>
        <div className="flex gap-2">
          {['Daily', 'Weekly', 'Monthly'].map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                selectedView === view
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <div className="text-3xl mb-3">🔥</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Current Streak</div>
              <div className="text-xl font-semibold">{stats.current_streak} days</div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <div className="text-3xl mb-3">🎯</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Completion Rate</div>
              <div className="text-xl font-semibold">{stats.completion_rate}%</div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <div className="text-3xl mb-3">🏆</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Best Streak</div>
              <div className="text-xl font-semibold">{stats.longest_streak} days</div>
            </div>
          </div>
        </div>

        {selectedView === 'Weekly' && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-medium">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    day.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {day.completed ? '✓' : ''}
                  </div>
                  <span className="text-sm text-gray-500 mt-2">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'Monthly' && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-medium">Monthly Overview</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="completions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;