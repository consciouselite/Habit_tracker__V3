import { BottomNav } from '../../components/BottomNav';
import { MotivationalTweet } from './components/MotivationalTweet';
import { VisionBoard } from './components/VisionBoard';
import { MonthlyProgress } from './components/MonthlyProgress';
import { AssessmentComparison } from './components/AssessmentComparison';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <MotivationalTweet />
        <VisionBoard />
        <MonthlyProgress />
        <AssessmentComparison />
      </div>
      <BottomNav />
    </div>
  );
}
