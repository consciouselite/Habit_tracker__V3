import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BottomNav } from '../../components/BottomNav';
import { Trophy, Target, Calendar } from 'lucide-react';
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
      const { data, error } = await supabase
        .rpc('get_user_habit_stats', {
          p_user_id: user.id
        });

      if (error) {
        console.error('Error fetching habit stats:', error);
        return;
      }

      setHabitStats(data || []);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Statistics</h2>
        {habitStats.map((stats) => (
          <HabitStatistics key={stats.habit_id} habitId={stats.habit_id} habitName={stats.name} />
        ))}
      </div>
      <BottomNav />
    </div>
  );
}

interface HabitStatisticsProps {
  habitId: string;
  habitName: string;
}

const HabitStatistics: React.FC<HabitStatisticsProps> = ({ habitId, habitName }) => {
  const [stats, setStats] = useState({
    currentStreak: 0,
    completionRate: 0,
    bestStreak: 0
  });
  const [selectedView, setSelectedView] = useState('Daily');
  const [weeklyProgress, setWeeklyProgress] = useState<{ day: string; completed: boolean }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ name: string; completions: number }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const calculateCompletionRate = async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setUTCDate(now.getUTCDate() - 30);
      thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .lte('completed_at', now.toISOString());

      if (logsError) {
        console.error('Error fetching completion logs:', logsError);
        return 0;
      }

      const uniqueDays = new Set(
        (logs || []).map(log => new Date(log.completed_at).toISOString().split('T')[0])
      );

      return Math.round((uniqueDays.size / 30) * 100);
    };

    const fetchStats = async () => {
      const [{ data: statsData, error: statsError }, completionRate] = await Promise.all([
        supabase
          .from('habit_stats')
          .select('current_streak, longest_streak')
          .eq('habit_id', habitId)
          .single(),
        calculateCompletionRate()
      ]);

      if (statsError) {
        console.error('Error fetching habit stats:', statsError);
        return;
      }

      setStats({
        currentStreak: statsData?.current_streak || 0,
        completionRate,
        bestStreak: statsData?.longest_streak || 0,
      });
    };

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
        .eq('habit_id', habitId)
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
      const firstDayOfMonth = new Date(now);
      firstDayOfMonth.setUTCDate(1);
      firstDayOfMonth.setUTCHours(0, 0, 0, 0);

      const lastDayOfMonth = new Date(now);
      lastDayOfMonth.setUTCDate(new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate());
      lastDayOfMonth.setUTCHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .gte('completed_at', firstDayOfMonth.toISOString())
        .lte('completed_at', lastDayOfMonth.toISOString());

      if (error) {
        console.error('Error fetching monthly data:', error);
        return;
      }

      const completionsByWeek = new Array(4).fill(0);
      (data || []).forEach(log => {
        const logDate = new Date(log.completed_at);
        const weekIndex = Math.floor((logDate.getUTCDate() - 1) / 7);
        if (weekIndex < 4) {
          completionsByWeek[weekIndex]++;
        }
      });

      setMonthlyData(
        completionsByWeek.map((completions, index) => ({
          name: `Week ${index + 1}`,
          completions
        }))
      );
    };

    fetchStats();
    fetchWeeklyProgress();
    fetchMonthlyData();
  }, [habitId, user]);

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{habitName}</h2>
        <div className="flex gap-2">
          {['Daily', 'Weekly', 'Monthly'].map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-3 py-1 rounded-full text-sm ${
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
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Trophy className="w-6 h-6 text-gray-400" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Current Streak</div>
              <div className="text-lg font-semibold">{stats.currentStreak} days</div>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Target className="w-6 h-6 text-gray-400" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Completion Rate</div>
              <div className="text-lg font-semibold">{stats.completionRate}%</div>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-6 h-6 text-gray-400" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Best Streak</div>
              <div className="text-lg font-semibold">{stats.bestStreak} days</div>
            </div>
          </div>
        </div>

        {selectedView === 'Weekly' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">This Week</h3>
            <div className="flex justify-between">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    day.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {day.completed ? '✓' : ''}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'Monthly' && (
          <div className="space-y-4">
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