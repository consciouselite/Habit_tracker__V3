import { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';

interface Habit {
  id: string;
  name: string;
  category: 'Health' | 'Productivity' | 'Finance' | 'Relationships' | 'Learning' | 'Spiritual/Mental';
  description: string;
  color: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
}

interface HabitListProps {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

const categoryColors = {
  'Health': { base: 'bg-white', completed: 'bg-green-100' },
  'Productivity': { base: 'bg-white', completed: 'bg-blue-100' },
  'Finance': { base: 'bg-white', completed: 'bg-yellow-100' },
  'Relationships': { base: 'bg-white', completed: 'bg-pink-100' },
  'Learning': { base: 'bg-white', completed: 'bg-purple-100' },
  'Spiritual/Mental': { base: 'bg-white', completed: 'bg-teal-100' },
};

export function HabitList({ habits, onEdit, onDelete }: HabitListProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <div 
          key={habit.id} 
          className="rounded-lg shadow p-4 bg-white"
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">{habit.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[habit.category].completed}`}>
                  {habit.category}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(habit)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Edit habit"
                >
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => onDelete(habit.id)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Delete habit"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{habit.description}</p>
            <WeeklyProgress habitId={habit.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface WeeklyProgressProps {
  habitId: string;
}

function WeeklyProgress({ habitId }: WeeklyProgressProps) {
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [pendingDays, setPendingDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const startOfWeek = new Date(today);
    startOfWeek.setUTCDate(today.getUTCDate() - dayOfWeek + 1);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setUTCDate(startOfWeek.getUTCDate() + i);
      return date.toISOString().split('T')[0];
    });
  };

  const fetchLogs = async () => {
    if (!user) return;

    const dates = getWeekDates();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const { data, error } = await supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .gte('completed_at', `${startDate}T00:00:00Z`)
      .lte('completed_at', `${endDate}T23:59:59Z`);

    if (error) {
      console.error('Error fetching habit logs:', error);
      return;
    }

    if (data) {
      const days = new Set(
        data.map((log: { completed_at: string }) =>
          new Date(log.completed_at).toISOString().split('T')[0]
        )
      );
      setCompletedDays(days);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchLogs();

    const subscription = supabase
      .channel(`habit_logs_${habitId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_logs',
          filter: `habit_id=eq.${habitId}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [habitId, user]);

  const toggleDayCompletion = async (date: string) => {
    if (!user || isLoading) return;

    const dateStr = `${date}T00:00:00Z`;
    const isCurrentlyCompleted = completedDays.has(date);

    setPendingDays(prev => new Set(prev).add(date));
    setCompletedDays(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyCompleted) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });

    try {
      setIsLoading(true);

      const { data: existingLogs, error: fetchError } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('completed_at', dateStr);

      if (fetchError) throw fetchError;

      if (existingLogs?.length > 0) {
        const { error: deleteError } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLogs[0].id);

        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('habit_logs')
          .insert([
            {
              habit_id: habitId,
              user_id: user.id,
              completed_at: dateStr,
            }
          ]);

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error toggling day completion:', err);
      setCompletedDays(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyCompleted) {
          newSet.add(date);
        } else {
          newSet.delete(date);
        }
        return newSet;
      });
    } finally {
      setIsLoading(false);
      setPendingDays(prev => {
        const newSet = new Set(prev);
        newSet.delete(date);
        return newSet;
      });
    }
  };

  const dates = getWeekDates();

  return (
    <div>
      <div className="flex justify-between items-center space-x-3">
        {dates.map((date) => {
          const isPending = pendingDays.has(date);
          const isCompleted = completedDays.has(date);
          
          return (
            <div key={date} className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-500 mb-2">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
              <button
                onClick={() => toggleDayCompletion(date)}
                disabled={isLoading && !isPending}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                  isPending ? 'animate-pulse' : ''
                } ${
                  isCompleted 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {new Date(date).getUTCDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}