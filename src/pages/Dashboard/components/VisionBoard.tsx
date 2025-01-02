import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  importance: string;
  image_url: string;
}

export function VisionBoard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchGoals = async () => {
      const { data } = await supabase
        .from('goals')
        .select('id, name, importance, image_url')
        .eq('user_id', user.id);

      if (data) setGoals(data);
    };

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile data:', error);
        return;
      }

      if (data) {
        setFirstName(data.first_name);
      }
    };

    fetchGoals();
    fetchProfile();
  }, [user]);

  const nextGoal = () => {
    setCurrentIndex((prev) => (prev + 1) % goals.length);
  };

  const prevGoal = () => {
    setCurrentIndex((prev) => (prev - 1 + goals.length) % goals.length);
  };

  if (goals.length === 0) return null;

  const currentGoal = goals[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-blue-600 to-purple-600 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
      <div className="p-4 md:p-6 space-y-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-wide">
          {firstName}'s Vision Board
        </h2>
        
        <div className="relative bg-white p-4 rounded-lg">
          <div className="flex items-center">
            <button
              onClick={prevGoal}
              className="absolute left-6 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors duration-200 focus:outline-none"
              aria-label="Previous goal"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="w-full px-2">
              <div className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                <img
                  src={currentGoal.image_url || 'https://res.cloudinary.com/dzkqpbwya/image/upload/v1735751911/dc36bb83-9d6d-45f9-9c49-401b88da62f5_pt0y7j.jpg'}
                  alt={currentGoal.name}
                  className="w-full h-64 md:h-96 object-cover rounded-xl transform transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
              <p className="mt-4 text-lg md:text-xl text-gray-600 text-center font-medium">
                {currentGoal.importance}
              </p>
            </div>

            <button
              onClick={nextGoal}
              className="absolute right-6 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors duration-200 focus:outline-none"
              aria-label="Next goal"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex justify-center space-x-3 mt-4">
          {goals.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                i === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default VisionBoard;