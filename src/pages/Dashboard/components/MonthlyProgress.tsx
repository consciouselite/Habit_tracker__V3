import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Check } from 'lucide-react';

interface HabitLog {
  completed_at: string;
}

export function MonthlyProgress() {
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [monthName, setMonthName] = useState('');
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [daysCompletedCount, setDaysCompletedCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysInCurrentMonth = lastDayOfMonth.getDate();

      setDaysInMonth(daysInCurrentMonth);
      setMonthName(now.toLocaleDateString('en-US', { month: 'long' }));

      const { data } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', firstDayOfMonth.toISOString())
        .lte('completed_at', lastDayOfMonth.toISOString());

      if (data) {
        const days = new Set(
          data.map((log: HabitLog) =>
            new Date(log.completed_at).toISOString().split('T')[0]
          )
        );
        setCompletedDays(days);
        setDaysCompletedCount(days.size);
        setCompletionRate(Math.round((days.size / daysInCurrentMonth) * 100));
      } else {
        setCompletedDays(new Set());
        setDaysCompletedCount(0);
        setCompletionRate(0);
      }
    };

    fetchLogs();
  }, [user]);

  const getDayOfWeekInitial = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (date.getDate() - 1) + i);
    return date.toISOString().split('T')[0];
  });

  const firstDayOfMonth = new Date(dates[0]).getDay();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{monthName} Progress</h2>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs text-gray-500">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {dates.map((date) => (
          <div
            key={date}
            className="flex flex-col items-center justify-center"
          >
            <div
              className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-gray-100 ${
                completedDays.has(date) ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              {completedDays.has(date) && (
                <Check className="w-4 h-4 text-white absolute" />
              )}
              <span className="text-sm text-gray-700">{new Date(date).getDate()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm text-gray-700">
        <span>Completion Rate: <span className="font-medium">{completionRate}%</span></span>
        <span>Days Completed: <span className="font-medium">{daysCompletedCount}/{daysInMonth}</span></span>
      </div>
    </div>
  );
}
