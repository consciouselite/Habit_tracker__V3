import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().min(1, 'Caption is required'),
  image_url: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

export function FlexBookForm({ onCancel, onSave, initialPost }: {
  onCancel: () => void;
  onSave: (post: PostFormData) => void;
  initialPost?: PostFormData | null;
}) {
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialPost?.image_url || null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: initialPost || {
      title: '',
      caption: '',
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

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      if (initialPost?.image_url) {
        const oldPath = initialPost.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('images').remove([`post-images/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
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
    if (initialPost?.image_url) {
      try {
        const oldPath = initialPost.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('images').remove([`post-images/${oldPath}`]);
        }
      } catch (err) {
        console.error('Error removing old image:', err);
      }
    }
    setImagePreview(null);
    setValue('image_url', '');
  };

  const onSubmit = async (data: PostFormData) => {
    try {
      await onSave(data);
      reset();
    } catch (err) {
      setError('Failed to save post. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md transform transition-all">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-800">
                {initialPost ? 'Edit Post' : 'New Post'}
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
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Enter post title..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Image
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  {...register('caption')}
                  rows={3}
                  placeholder="Write a caption..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
                {errors.caption && (
                  <p className="mt-2 text-sm text-red-600">{errors.caption.message}</p>
                )}
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
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {initialPost ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}