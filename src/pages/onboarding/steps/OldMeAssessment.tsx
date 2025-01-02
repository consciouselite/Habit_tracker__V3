import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface OldMeAssessmentProps {
  onNext: () => void;
}

const assessmentSchema = z.object({
  limitingBeliefs: z.string().min(1, 'This field is required'),
  badHabits: z.string().min(1, 'This field is required'),
  timeWasters: z.string().min(1, 'This field is required'),
  energyDrainers: z.string().min(1, 'This field is required'),
  growthBlockers: z.string().min(1, 'This field is required'),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export function OldMeAssessment({ onNext }: OldMeAssessmentProps) {
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
  });

  const onSubmit = async (data: AssessmentFormData) => {
    if (!user) return;

    try {
      const { error: assessmentError } = await supabase
        .from('assessments')
        .insert([{
          user_id: user.id,
          assessment_type: 'old_me',
          limiting_beliefs: data.limitingBeliefs,
          bad_habits: data.badHabits,
          time_wasters: data.timeWasters,
          energy_drainers: data.energyDrainers,
          growth_blockers: data.growthBlockers,
        }]);

      if (assessmentError) throw assessmentError;
      onNext();
    } catch (err) {
      setError('Failed to save assessment. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-2xl font-bold text-gray-900">Current Reality Check</h2>
        </div>
        <p className="mt-4 text-gray-600">
          Let's identify what's holding you back. Be honest with yourself.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>💭</span> Limiting Beliefs
          </label>
          <textarea
            {...register('limitingBeliefs')}
            rows={3}
            placeholder="What beliefs are holding you back?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.limitingBeliefs && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.limitingBeliefs.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>🔄</span> Bad Habits
          </label>
          <textarea
            {...register('badHabits')}
            rows={3}
            placeholder="What habits are not serving you well?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.badHabits && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.badHabits.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>⏳</span> Time Wasters
          </label>
          <textarea
            {...register('timeWasters')}
            rows={3}
            placeholder="What activities waste your time?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.timeWasters && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.timeWasters.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>🔋</span> Energy Drainers
          </label>
          <textarea
            {...register('energyDrainers')}
            rows={3}
            placeholder="What drains your energy?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.energyDrainers && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.energyDrainers.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-2">
            <span>🚧</span> Growth Blockers
          </label>
          <textarea
            {...register('growthBlockers')}
            rows={3}
            placeholder="What's preventing your growth?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          {errors.growthBlockers && (
            <p className="mt-2 text-sm text-red-600">⚠️ {errors.growthBlockers.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Continue <span>→</span>
        </button>
      </form>
    </div>
  );
}