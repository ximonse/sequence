import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette, Square } from 'lucide-react';

const TaskSequencer = () => {
  const themes = {
    light: {
      name: 'Ljust (Claude)',
      bg: 'bg-white',
      text: 'text-slate-900',
      panel: 'bg-slate-100',
      border: 'border-slate-300',
      primary: 'bg-emerald-600 hover:bg-emerald-700',
      secondary: 'bg-slate-700 hover:bg-slate-800',
      accent: 'bg-emerald-100',
      accentBorder: 'border-emerald-300',
      highlight: 'hover:border-emerald-300',
      muted: 'text-slate-600'
    },
    dark: {
      name: 'Mörkt',
      bg: 'bg-gray-950',
      text: 'text-gray-50',
      panel: 'bg-gray-900',
      border: 'border-gray-600',
      primary: 'bg-emerald-500 hover:bg-emerald-600',
      secondary: 'bg-gray-600 hover:bg-gray-700',
      accent: 'bg-gray-800',
      accentBorder: 'border-emerald-600',
      highlight: 'hover:border-emerald-400',
      muted: 'text-gray-300'
    },
    soft: {
      name: 'Mjukt',
      bg: 'bg-stone-100',
      text: 'text-stone-900',
      panel: 'bg-stone-200',
      border: 'border-stone-300',
      primary: 'bg-stone-700 hover:bg-stone-800',
      secondary: 'bg-stone-600 hover:bg-stone-700',
      accent: 'bg-amber-100',
      accentBorder: 'border-amber-300',
      highlight: 'hover:border-amber-300',
      muted: 'text-stone-600'
    },
    funky: {
      name: 'Galet Färgglatt',
      bg: 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400',
      text: 'text-indigo-900',
      panel: 'bg-gradient-to-r from-yellow-200 via-green-200 to-pink-200',
      border: 'border-purple-400 border-2',
      primary: 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600',
      secondary: 'bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600',
      accent: 'bg-gradient-to-r from-orange-200 to-rose-200',
      accentBorder: 'border-orange-400',
      highlight: 'hover:border-purple-400',
      muted: 'text-purple-800'
    }
  };

  const [taskInput, setTaskInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [theme, setTheme] = useState('light');

  const stopSequence = useCallback(() => {
    console.log('Stopping sequence');
    setIsRunning(false);
    setCurrentTaskIndex(-1);
    setTimeLeft(0);
    setIsPaused(false);
  }, []);

  const completeTask = useCallback(() => {
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return;
    
    const completionTime = new Date().toLocaleTimeString();
    playCompletionSound();
    
    setCompletedTasks(prev => [...prev, {
      ...currentTask,
      completedAt: completionTime
    }]);

    const nextIndex = currentTaskIndex + 1;
    if (nextIndex < tasks.length) {
      const nextTask = tasks[nextIndex];
      setCurrentTaskIndex(nextIndex);
      setTimeLeft(nextTask.minutes * 60);
    } else {
      stopSequence();
    }
  }, [currentTaskIndex, tasks, stopSequence]);

  const startSequence = useCallback(() => {
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      console.log('Starting sequence with task:', firstTask);
      setCurrentTaskIndex(0);
      setTimeLeft(firstTask.minutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setCompletedTasks([]);
    }
  }, [tasks]);

  const togglePause = useCallback(() => {
    console.log('Toggling pause, current state:', isPaused);
    setIsPaused(prev => !prev);
  }, [isPaused]);

  // Playback sound function
  const playCompletionSound = useCallback(() => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.5;
      oscillator.start();
      oscillator.stop(context.currentTime + 0.8);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, []);

  return (
    <div className={`min-h-screen p-6 ${themes[theme].bg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto mb-4 flex justify-end space-x-2">
        {Object.entries(themes).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`p-2 rounded-lg transition-colors ${
              theme === key 
                ? `${themes[theme].primary} text-white` 
                : `${themes[theme].panel} ${themes[theme].text}`
            }`}
            title={value.name}
          >
            {key === 'light' ? <Sun size={20} /> :
             key === 'dark' ? <Moon size={20} /> :
             key === 'soft' ? <Palette size={20} /> :
             key === 'funky' ? '🌈' : null}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className={`mb-8 ${themes[theme].panel} rounded-lg p-6 transition-colors`}>
          <textarea
            value={taskInput}
            onChange={handleInputChange}
            placeholder="Ange uppgifter (en per rad) i formatet:&#10;uppgiftens namn : minuter&#10;exempel:&#10;Första uppgiften : 20&#10;Paus : 5&#10;Andra uppgiften : 30&#10;&#10;Lägg till !odelbar för uppgifter som inte ska delas upp:&#10;Viktigt möte !odelbar : 45"
            className={`w-full h-48 p-4 border rounded-lg font-mono ${themes[theme].text} ${themes[theme].bg} ${themes[theme].border} focus:ring-2 focus:ring-opacity-50 focus:ring-current outline-none transition-colors`}
          />
          
          <div className="mt-4 space-x-3">
            <button
              onClick={startSequence}
              disabled={isRunning || tasks.length === 0}
              className={`px-6 py-2 text-white rounded-lg ${themes[theme].primary} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              Starta Sekvens
            </button>
            
            {isRunning && (
              <>
                <button
                  onClick={togglePause}
                  className={`px-6 py-2 text-white rounded-lg ${themes[theme].secondary} transition-colors`}
                >
                  {isPaused ? <Play className="inline h-5 w-5" /> : <Pause className="inline h-5 w-5" />}
                </button>
                <button
                  onClick={stopSequence}
                  className={`px-6 py-2 text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors`}
                >
                  <Square className="inline h-5 w-5" />
                </button>
              </>
            )}
            
            {completedTasks.length > 0 && (
              <button
                onClick={exportTasks}
                className={`px-6 py-2 rounded-lg ${themes[theme].panel} ${themes[theme].text} transition-colors`}
              >
                <Download className="inline h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {isRunning && currentTaskIndex >= 0 && tasks[currentTaskIndex] && (
          <div className={`${themes[theme].accent} border-2 ${themes[theme].accentBorder} rounded-lg p-6 transition-colors mb-6`}>
            <h2 className={`text-2xl font-semibold ${themes[theme].text} mb-3`}>
              Aktuell Uppgift: {tasks[currentTaskIndex].task}
            </h2>
            <TimelineCells 
              totalMinutes={tasks[currentTaskIndex].minutes} 
              elapsedSeconds={tasks[currentTaskIndex].minutes * 60 - timeLeft}
            />
            <p className={`text-4xl font-mono ${themes[theme].text} mb-4`}>{formatTime(timeLeft)}</p>
            <button
              onClick={completeTask}
              className={`px-4 py-2 text-white rounded-lg ${themes[theme].primary} transition-colors`}
            >
              Slutför Uppgift
            </button>
          </div>
        )}

        {isRunning && tasks.length > currentTaskIndex + 1 && (
          <div className={`${themes[theme].panel} rounded-lg p-6 transition-colors mb-6`}>
            <h3 className={`text-lg font-semibold ${themes[theme].text} mb-4`}>
              Kommande Uppgifter <span className={`text-sm font-normal ${themes[theme].muted}`}>(dra för att ordna om)</span>
            </h3>
            <div className="space-y-2">
              {tasks.slice(currentTaskIndex + 1).map((task, index) => {
                const actualIndex = index + currentTaskIndex + 1;
                return (
                  <div
                    key={actualIndex}
                    draggable
                    onDragStart={(e) => handleDragStart(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                    className={`flex items-center p-3 border rounded-lg ${themes[theme].border} ${themes[theme].highlight} transition-colors cursor-move`}
                  >
                    <GripVertical className={`mr-3 ${themes[theme].muted}`} size={16} />
                    <span className={themes[theme].text}>{task.task}</span>
                    <span className={`ml-auto ${themes[theme].muted}`}>{task.minutes}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className={`${themes[theme].panel} rounded-lg p-6 transition-colors`}>
            <h3 className={`text-lg font-semibold ${themes[theme].text} mb-4`}>
              Slutförda Uppgifter
            </h3>
            <ul className="space-y-2">
              {completedTasks.map((task, index) => (
                <li 
                  key={index} 
                  className={`p-3 border rounded-lg ${themes[theme].border} ${completedTaskStyle} transition-colors`}
                >
                  {task.task} - Completed at {task.completedAt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Add missing sound functions back
function playHalfwayBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = 600;
  gainNode.gain.value = 0.5;
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}

function playWarningBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = 400;
  gainNode.gain.value = 0.5;
  oscillator.start();
  oscillator.stop(context.currentTime + 2.0);
}

function playCompletionSound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = 800;
  gainNode.gain.value = 0.5;
  oscillator.start();
  oscillator.stop(context.currentTime + 0.8);
}

export default TaskSequencer;