import React from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { toggleThemeMode, updateTheme } from '@/lib/slices/preferencesSlice';
import { Sun, Moon, Monitor } from 'lucide-react';



const PreferencesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(s => s.preferences);

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4">
          <Monitor className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Website Appearance</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Personalize your Tech Tammina CRM experience with custom themes.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Theme</h2>
        
        <div className="relative bg-gray-100 dark:bg-gray-700 rounded-full p-1 flex">
          <button
            onClick={() => dispatch(updateTheme({ mode: 'light' }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all relative z-10 ${
              theme.mode === 'light'
                ? 'text-gray-900 bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-sm font-medium">Light</span>
          </button>

          <button
            onClick={() => dispatch(updateTheme({ mode: 'dark' }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all relative z-10 ${
              theme.mode === 'dark'
                ? 'text-white bg-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-sm font-medium">Dark</span>
          </button>
        </div>
      </div>


    </div>
  );
};

export default PreferencesPage;
