import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgeSelection } from './steps/AgeSelection';
import { GoalBuilder } from './steps/GoalBuilder';
import { OldMeAssessment } from './steps/OldMeAssessment';
import { NewMeVision } from './steps/NewMeVision';
import { ProgressIndicator } from './components/ProgressIndicator';
import { SexSelection } from './steps/SexSelection';

export function OnboardingSurvey() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 7) {
      console.log("Onboarding complete, navigating to dashboard");
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={7} />
        
        <div className="mt-8">
          {currentStep === 1 && <SexSelection onNext={handleNext} />}
          {currentStep === 2 && <AgeSelection onNext={handleNext} />}
          {currentStep >= 3 && currentStep <= 5 && (
            <GoalBuilder 
              stepNumber={currentStep - 2} 
              onNext={handleNext} 
            />
          )}
          {currentStep === 6 && <OldMeAssessment onNext={handleNext} />}
          {currentStep === 7 && <NewMeVision onNext={handleNext} />}
        </div>
      </div>
    </div>
  );
}
