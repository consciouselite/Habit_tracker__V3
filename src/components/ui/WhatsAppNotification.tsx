import React from 'react';
import { useState, useEffect } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './Alert.tsx';

export interface WhatsAppNotificationProps {
  isVisible: boolean;
  type: 'uploading' | 'success' | 'error';
  message?: string;
  onHide?: () => void;
}

export const motivationalMessages = [
  "🎯 Amazing! Your goal is set. Refresh the app to view your updated goal.",
  "💪 Goal locked in! You're on your way to greatness! Refresh the app to view your updated goal.",
  "✨ Brilliant! Your future self will thank you for this goal! Refresh the app to view your updated goal.",
  "🌟 Goal saved! Get ready to crush it! Refresh the app to view your updated goal.",
  "🚀 Goal registered! Your journey to success begins now! Refresh the app to view your updated goal."
];

export function WhatsAppNotification({ isVisible, type, message, onHide }: WhatsAppNotificationProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      if (type === 'success' || type === 'error') {
        const timer = setTimeout(() => {
          setIsShowing(false);
          onHide?.();
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsShowing(false);
    }
  }, [isVisible, type, onHide]);

  if (!isShowing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md transition-all duration-600 ease-in-out">
      <Alert className="bg-white border border-gray-200 shadow-lg rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <img
              src="https://yutnpnswdacivlaacgoj.supabase.co/storage/v1/object/public/images/agecategory/20.jpg"
              alt="Assistant"
              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <AlertTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              {type === 'uploading' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Atomic Habits Assistant</span>
                </>
              )}
              {type === 'success' && (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Atomic Habits Assistant</span>
                </>
              )}
              {type === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Atomic Habits Assistant</span>
                </>
              )}
            </AlertTitle>

            <AlertDescription className="mt-1 text-sm text-gray-600">
              {type === 'uploading' && (
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>Creating your goal...</span>
                </div>
              )}
              {type === 'success' && <div className="text-green-600">{message}</div>}
              {type === 'error' && (
                <div className="text-red-600">
                  {message || "Oops! Something went wrong. Please try again."}
                </div>
              )}
            </AlertDescription>

            <div className="mt-1 text-xs text-gray-400">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}