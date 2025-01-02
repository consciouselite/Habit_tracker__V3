import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-12 max-w-2xl w-full">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=100&h=100"
            alt="Coach Profile"
            className="w-28 h-28 rounded-full mx-auto border-4 border-indigo-500 animate-pulse object-cover"
          />
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <h1 className="text-6xl font-black text-white tracking-tight">
              Transform Your 2025
              <span className="inline-block ml-4 text-5xl animate-bounce">😊</span>
            </h1>
          </div>
          
          <p className="text-xl text-indigo-200 font-light tracking-wide">
            Let's build your personalized habit system
          </p>
        </div>

        <Button 
          onClick={() => navigate('/signup')} 
          size="lg"
          className="bg-white hover:bg-gray-50 text-indigo-900 px-8 py-6 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

export default LandingPage;
