import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CATEGORY_EMOJIS = {
  'Health': '🏃‍♂️',
  'Productivity': '⚡',
  'Finance': '💰',
  'Relationships': '❤️',
  'Learning': '📚',
  'Spiritual/Mental': '🧘‍♀️'
} as const;

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  category: z.enum(['Health', 'Productivity', 'Finance', 'Relationships', 'Learning', 'Spiritual/Mental']),
  description: z.string().min(1, 'Habit description is required'),
});

export type HabitFormData = z.infer<typeof habitSchema>;

export function HabitForm({ onCancel, onSave, initialHabit }: {
  onCancel: () => void;
  onSave: (habit: HabitFormData) => void;
  initialHabit?: HabitFormData | null;
}) {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: initialHabit || {
      name: '',
      category: 'Health',
      description: '',
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: HabitFormData) => {
    try {
      await onSave(data);
      reset();
    } catch (err) {
      setError('Failed to save habit. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md transform transition-all">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-800">
                {initialHabit ? 'Edit Habit' : 'New Habit'}
              </h3>
              <button 
                onClick={onCancel} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habit Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Enter your habit name..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none bg-white"
                >
                  {Object.entries(CATEGORY_EMOJIS).map(([category, emoji]) => (
                    <option key={category} value={category}>
                      {emoji} {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Describe your habit..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-600">Selected Category</p>
                <p className="text-2xl mt-1">
                  {CATEGORY_EMOJIS[selectedCategory as keyof typeof CATEGORY_EMOJIS]} {selectedCategory}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  {initialHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}