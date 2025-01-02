import { useState, useEffect } from 'react';
import { Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { differenceInDays, format } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  importance: string;
  image_url: string;
  expiry_date: string;
  created_at: string;
}

interface GoalListProps {
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const formatDisplayDate = (date: Date) => format(date, 'MMM d, yyyy');

export function GoalList({ onEdit, onDelete }: GoalListProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    return differenceInDays(new Date(), new Date(expiryDate));
  };

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No goals found. Start by adding a new goal!
        </div>
      ) : (
        goals.map((goal) => {
          const daysRemaining = getDaysRemaining(goal.expiry_date);
          const statusColor = getStatusColor(daysRemaining);
          
          return (
            <div
              key={goal.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative">
                {goal.image_url && (
                  <img
                    src={goal.image_url}
                    alt={goal.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => onEdit(goal)}
                    className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                    aria-label="Edit goal"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onDelete(goal.id)}
                    className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${statusColor}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>
                      {daysRemaining === 0
                        ? 'Due today'
                        : daysRemaining > 0
                        ? `${daysRemaining} days left`
                        : `${Math.abs(daysRemaining)} days overdue`}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600">{goal.importance}</p>
                
                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>Due: {formatDisplayDate(new Date(goal.expiry_date))}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
