import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface GoalBuilderProps {
  stepNumber: number;
  onNext: () => void;
}

const HABIT_CATEGORIES = {
  Health: '🏃',
  Productivity: '⚡',
  Finance: '💰',
  Relationships: '❤️',
  Learning: '📚',
  'Spiritual/Mental': '🧘'
} as const;

export function GoalBuilder({ stepNumber, onNext }: GoalBuilderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    importance: '',
    habitName: '',
    habitCategory: '',
    habitDescription: '',
    imageFile: null as File | null
  });
  const { user } = useAuth();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return `https://yutnpnswdacivlaacgoj.supabase.co/storage/v1/object/public/images/${filePath}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      let imageUrl = null;
      if (formData.imageFile) {
        imageUrl = await uploadImage(formData.imageFile);
      }

      const { error: goalError } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          name: formData.name,
          importance: formData.importance,
          image_url: imageUrl
        }]);

      if (goalError) throw goalError;

      const { error: habitError } = await supabase
        .from('habits')
        .insert([{
          user_id: user.id,
          name: formData.habitName,
          category: formData.habitCategory,
          description: formData.habitDescription,
        }]);

      if (habitError) throw habitError;

      onNext();
    } catch (err) {
      setError('Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          ✨ Goal {stepNumber} of 3
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Define your goal and the key habit that will help you achieve it 
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Goal Name 🎯
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your goal..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Why This Matters 
            </label>
            <textarea
              value={formData.importance}
              onChange={e => setFormData(prev => ({ ...prev, importance: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Explain why this goal is important to you..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Goal Image 🖼️
            </label>
            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
              <div className="text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto h-32 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, imageFile: null }));
                      }}
                      className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500">
                          Upload a file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="text-lg font-medium text-gray-900">
              Key Habit 
            </h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Habit Name 
                </label>
                <input
                  type="text"
                  value={formData.habitName}
                  onChange={e => setFormData(prev => ({ ...prev, habitName: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter habit name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category 
                </label>
                <select
                  value={formData.habitCategory}
                  onChange={e => setFormData(prev => ({ ...prev, habitCategory: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {Object.entries(HABIT_CATEGORIES).map(([category, emoji]) => (
                    <option key={category} value={category}>
                      {emoji} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description 
                </label>
                <textarea
                  value={formData.habitDescription}
                  onChange={e => setFormData(prev => ({ ...prev, habitDescription: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe your habit..."
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-lg px-4 py-2 text-white font-medium ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <span>Continue ✨</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default GoalBuilder;