import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface NewMeVisionProps {
  onNext: () => void;
}

const visionSchema = z.object({
  newBeliefs: z.string().min(1, 'This field is required'),
  empoweringHabits: z.string().min(1, 'This field is required'),
  timeInvestment: z.string().min(1, 'This field is required'),
  energyGains: z.string().min(1, 'This field is required'),
  growthAreas: z.string().min(1, 'This field is required'),
});

type VisionFormData = z.infer<typeof visionSchema>;

export function NewMeVision({ onNext }: NewMeVisionProps) {
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<VisionFormData>({
    resolver: zodResolver(visionSchema),
  });

  const onSubmit = async (data: VisionFormData) => {
    if (!user) return;

    try {
      const { error: visionError } = await supabase
        .from('assessments')
        .insert([{
          user_id: user.id,
          assessment_type: 'new_me',
          new_beliefs: data.newBeliefs,
          empowering_habits: data.empoweringHabits,
          time_investment: data.timeInvestment,
          energy_gains: data.energyGains,
          growth_areas: data.growthAreas,
        }]);

      if (visionError) throw visionError;
      onNext();
    } catch (err) {
      setError('Failed to save vision. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✨</span>
          <h2 className="text-2xl font-bold text-gray-900">Your Future Vision</h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>🌟</span> New Empowering Beliefs
          </label>
          <textarea
            {...register('newBeliefs')}
            rows={3}
            placeholder="What new beliefs will serve you better?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.newBeliefs && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.newBeliefs.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>⚡️</span> Empowering Habits
          </label>
          <textarea
            {...register('empoweringHabits')}
            rows={3}
            placeholder="What new habits will you develop?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.empoweringHabits && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.empoweringHabits.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>⏰</span> Time Investment
          </label>
          <textarea
            {...register('timeInvestment')}
            rows={3}
            placeholder="How will you invest your time differently?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.timeInvestment && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.timeInvestment.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>🔋</span> Energy Gains
          </label>
          <textarea
            {...register('energyGains')}
            rows={3}
            placeholder="What will give you more energy?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.energyGains && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.energyGains.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>📈</span> Growth Areas
          </label>
          <textarea
            {...register('growthAreas')}
            rows={3}
            placeholder="What areas will you focus on for growth?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.growthAreas && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.growthAreas.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Continue <span>⚡️</span>
        </button>
      </form>
    </div>
  );
}