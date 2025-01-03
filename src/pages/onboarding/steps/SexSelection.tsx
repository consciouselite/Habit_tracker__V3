import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

// Type definitions
type SexCategory = 'Male' | 'Female';

interface SexSelectionProps {
  onNext: () => void;
}

interface SexCategoryOption {
  value: SexCategory;
  icon: string;
  image: string;
  alt: string;
}

const SEX_CATEGORIES: SexCategoryOption[] = [
  {
    value: 'Male',
    icon: '♂️',
    image: 'https://yutnpnswdacivlaacgoj.supabase.co/storage/v1/object/public/images/agecategory/26.jpg',
    alt: 'Man'
  },
  {
    value: 'Female',
    icon: '♀️',
    image: 'https://yutnpnswdacivlaacgoj.supabase.co/storage/v1/object/public/images/agecategory/20.jpg',
    alt: 'Woman'
  },
];

export function SexSelection({ onNext }: SexSelectionProps) {
  const [selectedSex, setSelectedSex] = useState<SexCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { updateUserMetadata } = useAuth();

  const handleSubmit = async () => {
    if (!selectedSex || !user) {
      setError('Please select your sex to continue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check if a record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('onboarding_surveys')
        .select('id, age_category')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('onboarding_surveys')
          .update({ 
            sex: selectedSex,
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('onboarding_surveys')
          .insert([{
            user_id: user.id,
            sex: selectedSex,
            age_category: '18-25' // Default age category
          }]);

        if (insertError) throw insertError;
      }
      
      await updateUserMetadata({ sex: selectedSex });
      onNext();
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to save sex selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          What is your sex?
        </h2>
        <p className="mt-2 text-gray-600">
          We'll tailor your experience based on your sex
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {SEX_CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => {
              setSelectedSex(category.value);
              setError(null);
            }}
            type="button"
            className={`
              relative overflow-hidden rounded-xl transition-all duration-200
              ${selectedSex === category.value
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:opacity-90'
              }
              ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
            `}
            disabled={isLoading}
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
                  {category.value}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedSex || isLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium 
          transition-colors duration-200 
          flex items-center justify-center gap-2
          ${selectedSex && !isLoading
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="inline-block animate-spin mr-2">⌛</span>
        ) : null}
        {isLoading ? 'Saving...' : 'Continue'} 
        {!isLoading && <span>→</span>}
      </button>
    </div>
  );
}
