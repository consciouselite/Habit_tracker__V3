import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface GoalFormProps {
  onCancel: () => void;
  onSave: (goal: GoalFormData) => void;
  initialGoal?: GoalFormData | null;
}

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  importance: z.string().min(1, 'Goal importance is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  image_url: z.string().optional(),
});

export type GoalFormData = z.infer<typeof goalSchema>;

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
const add30Days = (date: Date) => addDays(date, 30);

export function GoalForm({ onCancel, onSave, initialGoal }: GoalFormProps) {
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialGoal?.image_url || null
  );

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

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `goal-images/${fileName}`;

      // Delete old image if exists
      if (initialGoal?.image_url) {
        const oldPath = initialGoal.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('goals')
            .remove([`goal-images/${oldPath}`]);
        }
      }

      // Upload new image
      const { error: uploadError, data } = await supabase.storage
        .from('goals')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('goals')
        .getPublicUrl(filePath);

      setValue('image_url', publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (initialGoal?.image_url) {
      try {
        const oldPath = initialGoal.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('goals')
            .remove([`goal-images/${oldPath}`]);
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
      await onSave(data);
      reset();
    } catch (err) {
      setError('Failed to save goal. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {initialGoal ? 'Edit Goal' : 'Add New Goal'}
              </h3>
              <button 
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Goal Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your goal..."
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Why This Goal Matters
                </label>
                <textarea
                  {...register('importance')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Why is this goal important to you?"
                />
                {errors.importance && (
                  <p className="mt-1 text-sm text-red-600">{errors.importance.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Completion Date
                </label>
                <input
                  {...register('expiry_date')}
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Goal Image
                </label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  {isUploading ? (
                    <div className="text-center">
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
                      <div className="mt-4 text-sm text-gray-600">Uploading...</div>
                    </div>
                  ) : imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : initialGoal ? 'Save Changes' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
