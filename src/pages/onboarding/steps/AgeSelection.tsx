import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface AgeSelectionProps {
  onNext: () => void;
}

const AGE_CATEGORIES = [
  {
    value: '18-25',
    icon: '🎓',
    image: '/api/placeholder/400/320',
    alt: 'Group of young friends watching sunset'
  },
  {
    value: '26-35',
    icon: '🚀',
    image: '/api/placeholder/400/320',
    alt: 'Professional man smiling'
  },
  {
    value: '36-45',
    icon: '⚡',
    image: '/api/placeholder/400/320',
    alt: 'Woman with curly hair smiling'
  },
  {
    value: '46+',
    icon: '⭐',
    image: '/api/placeholder/400/320',
    alt: 'Person in blue lighting'
  }
];

export function AgeSelection({ onNext }: AgeSelectionProps) {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!selectedAge || !user) return;

    try {
      const { error: surveyError } = await supabase
        .from('onboarding_surveys')
        .insert([{
          user_id: user.id,
          age_category: selectedAge,
        }]);

      if (surveyError) throw surveyError;
      onNext();
    } catch (err) {
      setError('Failed to save age selection. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Which age group do you belong to?
        </h2>
        <p className="text-gray-600">
          We'll tailor your experience based on your life stage
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {AGE_CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedAge(category.value)}
            className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
              selectedAge === category.value
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:opacity-90'
            }`}
          >
            <div className="aspect-[4/3] relative">
              <img
                src={category.image}
                alt={category.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              <div className="absolute bottom-0 left-0 p-4 flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                <span className="text-white font-bold text-lg">
                  {category.value} years
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedAge}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
          selectedAge
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue <span>→</span>
      </button>
    </div>
  );
}