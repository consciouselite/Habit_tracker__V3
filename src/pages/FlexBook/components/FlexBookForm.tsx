import { useState } from 'react';
    import { Button } from '../../../components/ui/Button';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { z } from 'zod';

    interface FlexBookFormProps {
      onCancel: () => void;
      onSave: (post: PostFormData) => void;
      initialPost?: PostFormData | null;
    }

    const postSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      image_url: z.string().url('Invalid image URL'),
      caption: z.string().min(1, 'Caption is required'),
    });

    type PostFormData = z.infer<typeof postSchema>;

    export function FlexBookForm({ onCancel, onSave, initialPost }: FlexBookFormProps) {
      const [error, setError] = useState('');
      const { register, handleSubmit, formState: { errors }, reset } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: initialPost || {
          title: '',
          image_url: '',
          caption: '',
        },
      });

      const onSubmit = async (data: PostFormData) => {
        try {
          await onSave(data);
          reset();
        } catch (err) {
          setError('Failed to save post. Please try again.');
        }
      };

      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {initialPost ? 'Edit Post' : 'Create New Post'}
          </h3>

          {error && (
            <div className="text-red-600 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                {...register('image_url')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.image_url && (
                <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Caption
              </label>
              <textarea
                {...register('caption')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.caption && (
                <p className="mt-1 text-sm text-red-600">{errors.caption.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </form>
        </div>
      );
    }
