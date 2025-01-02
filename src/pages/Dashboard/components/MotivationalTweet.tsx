import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const COACH_PROFILE_PICTURE = 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=48&h=48';
const COACH_NAME = 'Your Coach';
const COACH_HANDLE = '@coach';

type CoachTweetProps = {
  day?: number; // Made optional since we'll calculate it internally
};

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function MotivationalTweet({}: CoachTweetProps) {
  const [tweet, setTweet] = useState('');
  const { user } = useAuth();
  const [currentDayInfo, setCurrentDayInfo] = useState({ 
    day: 1, 
    totalDays: 365 
  });

  // Calculate current day of year and store last tweet date
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = Number(now) - Number(start);
    const oneDay = 1000 * 60 * 60 * 24;
    const currentDay = Math.floor(diff / oneDay);
    
    // Calculate total days in current year (accounts for leap years)
    const totalDays = new Date(now.getFullYear(), 11, 31).getDate() === 31 ? 365 : 366;
    
    setCurrentDayInfo({ 
      day: currentDay, 
      totalDays: totalDays 
    });
  }, []);

  const fetchUserData = async () => {
    if (!user) {
      return { goals: [], assessments: [], first_name: '', streak: 0 };
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, created_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('name, importance')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      const oldMeAssessments = await supabase
        .from('assessments')
        .select('assessment_type, limiting_beliefs, bad_habits, time_wasters, energy_drainers, growth_blockers')
        .eq('user_id', user.id)
        .in('assessment_type', ['old_me'])
        .not('limiting_beliefs', 'is', null)
        .not('bad_habits', 'is', null)
        .not('time_wasters', 'is', null)
        .not('energy_drainers', 'is', null)
        .not('growth_blockers', 'is', null);

      if (oldMeAssessments.error) throw oldMeAssessments.error;

      const newMeAssessments = await supabase
        .from('assessments')
        .select('assessment_type, new_beliefs, empowering_habits, time_investment, energy_gains, growth_areas')
        .eq('user_id', user.id)
        .in('assessment_type', ['new_me'])
        .not('new_beliefs', 'is', null)
        .not('empowering_habits', 'is', null)
        .not('time_investment', 'is', null)
        .not('energy_gains', 'is', null)
        .not('growth_areas', 'is', null);

      if (newMeAssessments.error) throw newMeAssessments.error;

      return {
        goals: goalsData,
        assessments: [...oldMeAssessments.data, ...newMeAssessments.data],
        first_name: profileData.first_name,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { goals: [], assessments: [], first_name: '' };
    }
  };

  const generateTweet = async () => {
    try {
      // First, check if we have an API key
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        console.error('Gemini API key is missing');
        setTweet('Failed to generate tweet: API key missing');
        return;
      }
  
      // Fetch user data with error checking
      const userData = await fetchUserData();
      if (!userData.first_name) {
        console.error('User data is incomplete');
        setTweet('Failed to generate tweet: User data incomplete');
        return;
      }
  
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  
      // Prepare goals and assessment text with null checks
      let goalsText = userData.goals?.map((goal: { name: string, importance: string }) => 
        `You want to achieve ${goal.name} because ${goal.importance}.`
      ).join(' ') || 'no specific goals yet';
  
      let assessmentText = userData.assessments?.map((assessment: any) => {
        if (assessment.assessment_type === 'old_me') {
          return `You have limiting beliefs of ${assessment.limiting_beliefs}, bad habits of ${assessment.bad_habits}, time wasters of ${assessment.time_wasters}, energy drainers of ${assessment.energy_drainers}, and growth blockers of ${assessment.growth_blockers}.`;
        } else if (assessment.assessment_type === 'new_me') {
          return `You have new beliefs of ${assessment.new_beliefs}, empowering habits of ${assessment.empowering_habits}, time investment of ${assessment.time_investment}, energy gains of ${assessment.energy_gains}, and growth areas of ${assessment.growth_areas}.`;
        }
        return '';
      }).join(' ') || 'no assessments yet';
  
      const prompt = `Generate a short, supportive and relatable tweet for ${userData.first_name} on this ${dayOfWeek} based on their goals: ${goalsText} and assessments: ${assessmentText}. The tweet should not include emojis or hashtags.`;
  
      console.log('Sending request to Gemini API...', { prompt });
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }],
            }],
          }),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Gemini API response:', data);
  
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }
  
      const generatedTweet = data.candidates[0].content.parts[0].text;
      setTweet(generatedTweet);
      
      // Store tweet with timestamp
      localStorage.setItem('dailyTweet', JSON.stringify({
        text: generatedTweet,
        timestamp: new Date().toISOString()
      }));
  
    } catch (error) {
      console.error('Detailed error in generateTweet:', error);
      setTweet(error instanceof Error ? `Failed to generate tweet: ${error.message}` : 'Failed to generate tweet');
    }
  };

  // Check and generate tweet if needed
  useEffect(() => {
    const checkAndGenerateTweet = () => {
      const storedTweetData = localStorage.getItem('dailyTweet');
      
      if (storedTweetData) {
        const { text, timestamp } = JSON.parse(storedTweetData);
        const storedDate = new Date(timestamp);
        const now = new Date();
        
        // Check if the stored tweet is from a different day
        if (storedDate.toDateString() !== now.toDateString()) {
          generateTweet();
        } else {
          setTweet(text);
        }
      } else {
        generateTweet();
      }
    };

    if (user) {
      checkAndGenerateTweet();
    }
  }, [user]);

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={COACH_PROFILE_PICTURE}
            alt="Coach"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{COACH_NAME}</h3>
            <p className="text-sm text-gray-500">{COACH_HANDLE}</p>
          </div>
        </div>
        <span className="text-gray-500 text-sm">
          Day {currentDayInfo.day}/{currentDayInfo.totalDays}
        </span>
      </div>
      <p className="text-gray-800 mb-4">{tweet}</p>
      <div className="flex gap-6">
        <a
          href="#youtube"
          className="text-gray-600 hover:text-[#FF0000] transition-colors"
          aria-label="YouTube"
        >
          <YouTubeIcon />
        </a>
        <a
          href="#instagram"
          className="text-gray-600 hover:text-[#E4405F] transition-colors"
          aria-label="Instagram"
        >
          <InstagramIcon />
        </a>
        <a
          href="#whatsapp"
          className="text-gray-600 hover:text-[#25D366] transition-colors"
          aria-label="WhatsApp"
        >
          <WhatsAppIcon />
        </a>
      </div>
    </div>
  );
}