import { useEffect, useState } from 'react';
    import { supabase } from '../../../lib/supabase';
    import { useAuth } from '../../../contexts/AuthContext';

    interface Assessment {
      assessment_type: string;
      limiting_beliefs?: string;
      bad_habits?: string;
      time_wasters?: string;
      energy_drainers?: string;
      growth_blockers?: string;
      new_beliefs?: string;
      empowering_habits?: string;
      time_investment?: string;
      energy_gains?: string;
      growth_areas?: string;
    }

    const OLD_EMOJIS = ['😔', '😩', '😫', '😖', '😣'];
    const NEW_EMOJIS = ['😊', '💪', '🎯', '✨', '🚀'];

    export function AssessmentComparison() {
      const [oldMeAssessments, setOldMeAssessments] = useState<Assessment[]>([]);
      const [newMeAssessments, setNewMeAssessments] = useState<Assessment[]>([]);
      const { user } = useAuth();
      const [firstName, setFirstName] = useState('');

      useEffect(() => {
        if (!user) return;

        const fetchAssessments = async () => {
          const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching assessments data:', error);
            return;
          }

          if (data) {
            const oldMe = data.filter(a => a.assessment_type === 'old_me' && a.limiting_beliefs && a.bad_habits && a.time_wasters && a.energy_drainers && a.growth_blockers);
            const newMe = data.filter(a => a.assessment_type === 'new_me' && a.new_beliefs && a.empowering_habits && a.time_investment && a.energy_gains && a.growth_areas);
            setOldMeAssessments(oldMe);
            setNewMeAssessments(newMe);
          }
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

        fetchAssessments();
        fetchProfile();
      }, [user]);

      const getEmojiForOldMe = (index: number, itemIndex: number) => {
        return OLD_EMOJIS[itemIndex] || '🤔';
      };

      const getEmojiForNewMe = (index: number, itemIndex: number) => {
        return NEW_EMOJIS[itemIndex] || '✨';
      };

      const getOldMeItems = (item: Assessment) => {
        return [
          { label: 'Limiting Beliefs', value: item.limiting_beliefs },
          { label: 'Bad Habits', value: item.bad_habits },
          { label: 'Time Wasters', value: item.time_wasters },
          { label: 'Energy Drainers', value: item.energy_drainers },
          { label: 'Growth Blockers', value: item.growth_blockers },
        ].filter(i => i.value);
      };

      const getNewMeItems = (item: Assessment) => {
        return [
          { label: 'New Beliefs', value: item.new_beliefs },
          { label: 'Empowering Habits', value: item.empowering_habits },
          { label: 'Time Investment', value: item.time_investment },
          { label: 'Energy Gains', value: item.energy_gains },
          { label: 'Growth Areas', value: item.growth_areas },
        ].filter(i => i.value);
      };

      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            The Old {firstName} vs The NEW {firstName}
          </h2>
          <div className="relative flex">
            <div className="w-1/2 pr-4 space-y-4">
              {oldMeAssessments.map((item, index) => (
                <div key={index} className="space-y-2">
                  {getOldMeItems(item).map((listItem, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="bg-red-100 p-3 rounded-md flex items-center space-x-2">
                        <span className="text-xl">{getEmojiForOldMe(index, i)}</span>
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">{listItem.label}</p>
                          <p>{listItem.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full">
              <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="h-full w-[2px] bg-gray-300"></div>
                {oldMeAssessments.map((_, index) => (
                  <div key={index} className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" style={{ top: `${(index / (oldMeAssessments.length - 1)) * 100}%` }} />
                ))}
              </div>
            </div>
            <div className="w-1/2 pl-4 space-y-4">
              {newMeAssessments.map((item, index) => (
                <div key={index} className="space-y-2">
                  {getNewMeItems(item).map((listItem, i) => (
                    <div key={i} className="flex items-center space-x-3 justify-end">
                      <div className="bg-green-100 p-3 rounded-md flex items-center space-x-2">
                        <span className="text-xl">{getEmojiForNewMe(index, i)}</span>
                        <div className="text-sm text-gray-700 text-right">
                          <p className="font-medium">{listItem.label}</p>
                          <p>{listItem.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
