import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgeSelection } from './steps/AgeSelection';
import { GoalBuilder } from './steps/GoalBuilder';
import { OldMeAssessment } from './steps/OldMeAssessment';
import { NewMeVision } from './steps/NewMeVision';
import { ProgressIndicator } from './components/ProgressIndicator';

export function OnboardingSurvey() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 6) {
      console.log("Onboarding complete, navigating to dashboard");
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={6} />
        
        <div className="mt-8">
          {currentStep === 1 && <AgeSelection onNext={handleNext} />}
          {currentStep >= 2 && currentStep <= 4 && (
            <GoalBuilder 
              stepNumber={currentStep - 1} 
              onNext={handleNext} 
            />
          )}
          {currentStep === 5 && <OldMeAssessment onNext={handleNext} />}
          {currentStep === 6 && <NewMeVision onNext={handleNext} />}
        </div>
      </div>
    </div>
  );
}
