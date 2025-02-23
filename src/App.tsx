import React, { useState } from 'react';
import { Sun, Moon, Palette, Play, Download } from 'lucide-react';

const ThemePreview = () => {
  const [activeTheme, setActiveTheme] = useState('light');
  
  // Theme configurations with enhanced borders and shadows
  const themes = {
    light: {
      name: 'Ljust',
      bg: 'bg-white',
      text: 'text-gray-700',
      panel: 'bg-white',
      border: 'border-gray-200',
      primary: 'bg-emerald-500 hover:bg-emerald-600',
      secondary: 'bg-gray-500 hover:bg-gray-600',
      accent: 'bg-sky-50',
      accentBorder: 'border-gray-400',  // Lighter grey border
      highlight: 'hover:border-sky-200',
      muted: 'text-gray-400',
      instruction: 'text-gray-500',
      shadow: 'shadow-lg',
      taskShadow: 'shadow-2xl'
    },
    dark: {
      name: 'Mörkt',
      bg: 'bg-gray-900',
      text: 'text-gray-100',
      panel: 'bg-gray-800',
      border: 'border-gray-700',
      primary: 'bg-emerald-500 hover:bg-emerald-600',
      secondary: 'bg-gray-600 hover:bg-gray-700',
      accent: 'bg-gray-800',
      accentBorder: 'border-emerald-700',
      highlight: 'hover:border-emerald-500',
      muted: 'text-gray-400',
      instruction: 'text-gray-400',
      shadow: 'shadow-md',
      taskShadow: 'shadow-lg'
    },
    funky: {
      name: 'Funky',
      bg: 'bg-fuchsia-50',
      text: 'text-indigo-900',
      panel: 'bg-white',
      border: 'border-purple-300',  // Darker border
      primary: 'bg-fuchsia-500 hover:bg-fuchsia-600',
      secondary: 'bg-indigo-500 hover:bg-indigo-600',
      accent: 'bg-fuchsia-100',
      accentBorder: 'border-fuchsia-700',  // Much darker accent border
      highlight: 'hover:border-fuchsia-400',
      muted: 'text-fuchsia-600',
      instruction: 'text-indigo-400',
      shadow: 'shadow-md',
      taskShadow: 'shadow-lg'
    }
  };

  return (
    <div className={`min-h-screen p-6 ${themes[activeTheme].bg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto">
        {/* Theme switcher */}
        <div className="flex justify-end space-x-2 mb-6">
          {Object.entries(themes).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setActiveTheme(key)}
              className={`p-2 rounded-lg transition-colors ${
                activeTheme === key 
                  ? `${themes[activeTheme].primary} text-white` 
                  : `${themes[activeTheme].panel} ${themes[activeTheme].text}`
              }`}
              title={value.name}
            >
              {key === 'light' ? <Sun size={20} /> : 
               key === 'dark' ? <Moon size={20} /> : 
               <Palette size={20} />}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className={`mb-8 ${themes[activeTheme].panel} ${themes[activeTheme].shadow} rounded-lg p-6 transition-all border ${themes[activeTheme].border}`}>
          <textarea
            value=""
            readOnly
            className={`w-full h-32 p-4 border rounded-lg font-mono ${themes[activeTheme].text} bg-white ${themes[activeTheme].border} focus:ring-2 focus:ring-opacity-50 focus:ring-current outline-none transition-colors`}
          />
          
          <div className="mt-4 space-x-3">
            <button
              className={`px-6 py-2 text-white rounded-lg ${themes[activeTheme].primary} transition-colors`}
            >
              Start Sequence
            </button>
            
            <button
              className={`px-6 py-2 text-white rounded-lg ${themes[activeTheme].secondary} transition-colors`}
            >
              <Play className="inline h-5 w-5" />
            </button>
            
            <button
              className={`px-6 py-2 rounded-lg ${themes[activeTheme].panel} ${themes[activeTheme].text} border ${themes[activeTheme].border} transition-colors`}
            >
              <Download className="inline h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className={`${themes[activeTheme].instruction} text-sm space-y-2 mb-8`}>
          <p>• Write tasks in the format: <code>task : minutes</code></p>
          <p>• Use priorities: !!! (high), !! (medium), ! (low)</p>
          <p>• Use !unbreakable to prevent breaks</p>
          <p>• Long tasks are automatically split with breaks</p>
        </div>

        {/* Current task preview with enhanced shadow and border */}
        <div className={`${themes[activeTheme].accent} border-2 ${activeTheme === 'funky' ? 'border-gray-800' : themes[activeTheme].accentBorder} rounded-lg p-6 transition-all shadow-xl`}>
          <h2 className={`text-2xl font-semibold ${themes[activeTheme].text} mb-3`}>
            Current Task: 🔴 🧠 Important project
          </h2>
          <p className={`text-4xl font-mono ${themes[activeTheme].text} mb-4`}>
            25:00
          </p>
          <button
            className={`px-4 py-2 text-white rounded-lg ${themes[activeTheme].primary} transition-colors`}
          >
            Complete Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;