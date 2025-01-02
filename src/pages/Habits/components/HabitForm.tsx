import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface HabitFormProps {
  onCancel: () => void;
  onSave: (habit: HabitFormData) => void;
  initialHabit?: HabitFormData | null;
}

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

export function HabitForm({ onCancel, onSave, initialHabit }: HabitFormProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md transform transition-all">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                {initialHabit ? '✏️ Edit Habit' : '✨ New Habit'}
              </h3>
              <button 
                onClick={onCancel}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Habit Name Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ✍️ Habit Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Enter your habit name..."
                  className="w-full px-4 py-3 bg-white bg-opacity-20 rounded-lg text-white placeholder-gray-300 border border-white border-opacity-30 focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:outline-none transition-all"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-200">{errors.name.message}</p>
                )}
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  🎯 Category
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 bg-white bg-opacity-20 rounded-lg text-white border border-white border-opacity-30 focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:outline-none appearance-none transition-all"
                >
                  {Object.entries(CATEGORY_EMOJIS).map(([category, emoji]) => (
                    <option 
                      key={category} 
                      value={category}
                      className="bg-blue-600 text-white"
                    >
                      {emoji} {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-200">{errors.category.message}</p>
                )}
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  📝 Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Describe your habit..."
                  className="w-full px-4 py-3 bg-white bg-opacity-20 rounded-lg text-white placeholder-gray-300 border border-white border-opacity-30 focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:outline-none transition-all resize-none"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-200">{errors.description.message}</p>
                )}
              </div>

              {/* Selected Category Preview */}
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-white text-sm">Selected Category:</p>
                <p className="text-2xl mt-1">
                  {CATEGORY_EMOJIS[selectedCategory as keyof typeof CATEGORY_EMOJIS]} {selectedCategory}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-white hover:bg-opacity-90 rounded-lg text-blue-600 font-medium transition-all duration-200"
                >
                  {initialHabit ? 'Save Changes' : 'Create Habit'} ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}