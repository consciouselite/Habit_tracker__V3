import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { GoalForm, GoalFormData } from './components/GoalForm';
import { GoalList } from './components/GoalList';
import { BottomNav } from '../../components/BottomNav';

interface Goal {
  id: string;
  name: string;
  importance: string;
  image_url: string;
  expiry_date: string;
  created_at: string;
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setGoals(data);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  const handleAddGoal = () => {
    setEditGoal(null);
    setShowForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditGoal(null);
  };

  const handleSaveGoal = async (goalData: GoalFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (editGoal) {
        // Update existing goal
        const { data, error } = await supabase
          .from('goals')
          .update({
            name: goalData.name,
            importance: goalData.importance,
            expiry_date: goalData.expiry_date,
            image_url: goalData.image_url,
          })
          .eq('id', editGoal.id)
          .select()
          .single();

        if (error) throw error;

        setGoals(goals.map(goal => 
          goal.id === editGoal.id ? data : goal
        ));
      } else {
        // Create new goal
        const { data, error } = await supabase
          .from('goals')
          .insert([{
            user_id: user.id,
            name: goalData.name,
            importance: goalData.importance,
            expiry_date: goalData.expiry_date,
            image_url: goalData.image_url,
          }])
          .select()
          .single();

        if (error) throw error;

        setGoals([data, ...goals]);
      }

      setShowForm(false);
      setEditGoal(null);
    } catch (err) {
      console.error('Error saving goal:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter(goal => goal.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
          <Button onClick={handleAddGoal} disabled={isLoading}>
            Add Goal
          </Button>
        </div>

        {showForm && (
          <GoalForm
            onCancel={handleCancelForm}
            onSave={handleSaveGoal}
            initialGoal={editGoal}
          />
        )}

        <GoalList
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
        />
      </div>
      <BottomNav />
    </div>
  );
}