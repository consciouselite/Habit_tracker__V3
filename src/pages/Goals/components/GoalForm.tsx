import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { WhatsAppNotification } from '../../../components/ui/WhatsAppNotification';

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  importance: z.string().min(1, 'Goal importance is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  image_url: z.string().optional(),
});

export type GoalFormData = z.infer<typeof goalSchema>;

type NotificationState = {
  isVisible: boolean;
  type: 'uploading' | 'success' | 'error';
  message?: string;
};

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
const add30Days = (date: Date) => addDays(date, 30);

export function GoalForm({ onCancel, onSave, initialGoal, onSuccess }: {
  onCancel: () => void;
  onSave: (goal: GoalFormData) => void;
  initialGoal?: GoalFormData | null;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialGoal?.image_url || null);
  const [notificationState, setNotificationState] = useState<NotificationState>({
    isVisible: false,
    type: 'uploading',
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: initialGoal || {
      name: '',
      importance: '',
      expiry_date: formatDate(add30Days(new Date())),
      image_url: '',
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setNotificationState({
        isVisible: true,
        type: 'uploading',
        message: 'Creating your goal...',
      });

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `goal-images/${fileName}`;

      if (initialGoal?.image_url) {
        const oldPath = initialGoal.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('images').remove([`goal-images/${oldPath}`]);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      setValue('image_url', publicUrl);

      setNotificationState(prev => ({ ...prev, isVisible: false }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setImagePreview(null);
      setNotificationState({
        isVisible: true,
        type: 'error',
        message: 'Failed to upload image. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (initialGoal?.image_url) {
      try {
        const oldPath = initialGoal.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('images').remove([`goal-images/${oldPath}`]);
        }
      } catch (err) {
        console.error('Error removing old image:', err);
      }
    }
    setImagePreview(null);
    setValue('image_url', '');
  };

  const onSubmit = async (data: GoalFormData) => {
    try {
      setIsUploading(true);
      await onSave(data);
      reset();
      setNotificationState(prev => ({ ...prev, isVisible: false }));
      onSuccess?.();
      onCancel();
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError('Failed to save goal. Please try again.');
      setNotificationState({
        isVisible: true,
        type: 'error',
        message: 'Failed to save goal. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-40">
      <WhatsAppNotification
        {...notificationState}
        onHide={() => setNotificationState(prev => ({ ...prev, isVisible: false }))}
      />

      <div className="w-full max-w-md transform transition-all">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-800">
                {initialGoal ? 'Edit Goal' : 'New Goal'}
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
                  Goal Name
                </label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Enter your goal..."
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why This Goal Matters
                </label>
                <textarea
                  {...register('importance')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  placeholder="Why is this goal important to you?"
                />
                {errors.importance && (
                  <p className="mt-2 text-sm text-red-600">{errors.importance.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Completion Date
                </label>
                <input
                  {...register('expiry_date')}
                  type="date"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                {errors.expiry_date && (
                  <p className="mt-2 text-sm text-red-600">{errors.expiry_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Image
                </label>
                <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 hover:border-gray-400 transition-colors">
                  {isUploading ? (
                    <div className="text-center">
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                      <div className="mt-4 text-sm text-gray-600">Uploading...</div>
                    </div>
                  ) : imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg shadow-md" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="mt-4">
                        <label className="relative cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : initialGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}