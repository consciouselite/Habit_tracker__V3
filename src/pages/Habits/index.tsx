import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { HabitForm, HabitFormData } from './components/HabitForm';
import { HabitList } from './components/HabitList';
import { BottomNav } from '../../components/BottomNav';

interface Habit {
  id: string;
  name: string;
  category: 'Health' | 'Productivity' | 'Finance' | 'Relationships' | 'Learning' | 'Spiritual/Mental';
  description: string;
}

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        setHabits(data);
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
    }
  };

  const handleAddHabit = () => {
    setEditHabit(null);
    setShowForm(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditHabit(habit);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditHabit(null);
  };

  const handleSaveHabit = async (habitData: HabitFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (editHabit) {
        // Update existing habit
        const { data, error } = await supabase
          .from('habits')
          .update({
            name: habitData.name,
            category: habitData.category,
            description: habitData.description,
          })
          .eq('id', editHabit.id)
          .select()
          .single();

        if (error) throw error;

        setHabits(habits.map(habit => 
          habit.id === editHabit.id ? data : habit
        ));
      } else {
        // Create new habit
        const { data, error } = await supabase
          .from('habits')
          .insert([{
            user_id: user.id,
            name: habitData.name,
            category: habitData.category,
            description: habitData.description,
          }])
          .select()
          .single();

        if (error) throw error;

        setHabits([...habits, data]);
      }

      setShowForm(false);
      setEditHabit(null);
    } catch (err) {
      console.error('Error saving habit:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this habit?')) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;

      setHabits(habits.filter(habit => habit.id !== habitId));
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Habits</h2>
          <Button onClick={handleAddHabit} disabled={isLoading}>
            Add Habit
          </Button>
        </div>

        {showForm && (
          <HabitForm
            onCancel={handleCancelForm}
            onSave={handleSaveHabit}
            initialHabit={editHabit}
          />
        )}

        <HabitList
          habits={habits}
          onEdit={handleEditHabit}
          onDelete={handleDeleteHabit}
        />
      </div>
      <BottomNav />
    </div>
  );
}