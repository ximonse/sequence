import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette } from 'lucide-react';

const themes = {
  light: {
    name: 'Light',
    bg: 'bg-white',
    text: 'text-gray-700',
    panel: 'bg-gray-50',
    border: 'border-gray-200',
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    accent: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    highlight: 'hover:border-blue-200',
    muted: 'text-gray-500'
  },
  dark: {
    name: 'Dark',
    bg: 'bg-gray-900',
    text: 'text-gray-100',
    panel: 'bg-gray-800',
    border: 'border-gray-700',
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    accent: 'bg-gray-800',
    accentBorder: 'border-blue-700',
    highlight: 'hover:border-blue-500',
    muted: 'text-gray-400'
  },
  soft: {
    name: 'Soft',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    panel: 'bg-gray-100',
    border: 'border-gray-200',
    primary: 'bg-gray-600 hover:bg-gray-700',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    accent: 'bg-yellow-50',
    accentBorder: 'border-yellow-200',
    highlight: 'hover:border-yellow-200',
    muted: 'text-gray-500'
  },
  ocean: {
    name: 'Ocean',
    bg: 'bg-blue-50',
    text: 'text-gray-700',
    panel: 'bg-white',
    border: 'border-blue-200',
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-blue-500 hover:bg-blue-600',
    accent: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    highlight: 'hover:border-blue-200',
    muted: 'text-gray-500'
  }
};

const breakActivities = {
  microBreak: [
    "Eye rest: Look 20 feet away",
    "Quick stretches",
    "Deep breathing",
    "Wrist exercises",
    "Posture check"
  ],
  shortBreak: [
    "Stand and stretch",
    "Get water",
    "Walk around",
    "Desk exercises",
    "Mindful breathing"
  ],
  longBreak: [
    "Take a walk",
    "Full stretching",
    "Healthy snack",
    "Meditation",
    "Fresh air"
  ]
};

function TaskSequencer() {
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [theme, setTheme] = useState('light');

  const playSound = useCallback((type) => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = 'sine';
    
    switch(type) {
      case 'halfway':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        break;
      case 'warning':
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
        break;
		case 'complete':
        // Create pattern: "bep bep bep beeeep"
        let beepTime = context.currentTime;
        
        // Create separate oscillators for each beep
        for(let i = 0; i < 4; i++) {
          const beepOsc = context.createOscillator();
          const beepGain = context.createGain();
          beepOsc.connect(beepGain);
          beepGain.connect(context.destination);
          
          beepOsc.frequency.value = 800;
          beepGain.gain.value = 0.3;
          beepOsc.type = 'sine';
          
          if (i < 3) {
            // Short beeps
            beepOsc.start(beepTime);
            beepOsc.stop(beepTime + 0.1);
            beepTime += 0.5; // Gap between beeps
          } else {
            // Final long beep
            beepOsc.start(beepTime);
            beepOsc.stop(beepTime + 0.6);
          }
        }
        break;
		case 'allComplete':
        // Victory fanfare: "do-do-do-dooooo!"
        oscillator.type = 'square'; // More video-game like sound
        gainNode.gain.value = 0.2;
        
        // Rising melody
        const notes = [400, 500, 600, 800];
        const noteDuration = 0.15;
        
        notes.forEach((freq, i) => {
          oscillator.frequency.setValueAtTime(freq, context.currentTime + (i * noteDuration));
          // Last note held longer
          if (i === notes.length - 1) {
            oscillator.start(context.currentTime + (i * noteDuration));
            oscillator.stop(context.currentTime + (i * noteDuration) + 0.5);
          } else {
            oscillator.start(context.currentTime + (i * noteDuration));
            oscillator.stop(context.currentTime + ((i + 1) * noteDuration));
          }
        });
        break;
    }
  }, []);

  const getRandomActivity = useCallback((breakType) => {
    const activities = breakActivities[breakType];
    return activities[Math.floor(Math.random() * activities.length)];
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleInputChange = useCallback((e) => {
    const input = e.target.value;
    setTaskInput(input);
    
    const parsedTasks = input
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const isUnbreakable = line.includes('!unbreakable');
        const cleanLine = line.replace('!unbreakable', '').trim();
        const [task, minutes] = cleanLine.split(':').map(part => part.trim());
        return {
          task,
          minutes: parseInt(minutes) || 0,
          isUnbreakable
        };
      });

    setTasks(parsedTasks);
  }, []);

  const completeTask = useCallback(() => {
    const currentTask = tasks[currentTaskIndex];
    playSound('complete');
    
    setCompletedTasks(prev => [...prev, {
      ...currentTask,
      completedAt: new Date().toLocaleTimeString()
    }]);

    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTimeLeft(tasks[currentTaskIndex + 1].minutes * 60);
      setIsPaused(false);
    } else {
      playSound('allComplete'); // Add this line to play victory sound
      setIsRunning(false);
      setCurrentTaskIndex(-1);
      setTimeLeft(0);
      setIsPaused(false);
    }
  }, [currentTaskIndex, tasks, playSound]);

  useEffect(() => {
    let timer;
    if (isRunning && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            completeTask();
            return 0;
          }
          
          const currentTask = tasks[currentTaskIndex];
          const totalSeconds = currentTask?.minutes * 60 || 0;
          
          if (currentTask?.minutes > 14 && prevTime === Math.floor(totalSeconds / 2)) {
            playSound('halfway');
          }
          
          if (currentTask?.minutes > 10 && prevTime === 300) {
            playSound('warning');
          }
          
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft, currentTaskIndex, tasks, playSound, completeTask]);

  const startSequence = useCallback(() => {
    if (tasks.length > 0) {
      setCurrentTaskIndex(0);
      setTimeLeft(tasks[0].minutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setCompletedTasks([]);
    }
  }, [tasks]);

  const exportTasks = useCallback(() => {
    const exportData = {
      originalSequence: tasks,
      completedTasks,
      exportedAt: new Date().toLocaleString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-sequence-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [tasks, completedTasks]);

  return (
    <div className={`min-h-screen p-6 ${themes[theme].bg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto mb-4 flex justify-end space-x-2">
        {Object.entries(themes).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`p-2 rounded-lg transition-colors ${theme === key ? `${themes[theme].primary} text-white` : `${themes[theme].panel} ${themes[theme].text}`}`}
            title={value.name}
          >
            {key === 'light' ? <Sun size={20} /> :
             key === 'dark' ? <Moon size={20} /> :
             key === 'soft' ? <Palette size={20} /> :
             key === 'ocean' ? '🌊' : null}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className={`mb-8 ${themes[theme].panel} rounded-lg p-6 transition-colors`}>
          <textarea
            value={taskInput}
            onChange={handleInputChange}
            placeholder="Enter tasks (one per line):&#10;task : minutes&#10;Example:&#10;Work on project : 25&#10;Break : 5&#10;Meeting !unbreakable : 60"
            className={`w-full h-48 p-4 border rounded-lg font-mono ${themes[theme].text} ${themes[theme].bg} ${themes[theme].border} focus:ring-2 focus:ring-opacity-50 focus:ring-current outline-none transition-colors`}
          />
          
          <div className="mt-4 space-x-3">
            <button
              onClick={startSequence}
              disabled={isRunning || tasks.length === 0}
              className={`px-6 py-2 text-white rounded-lg ${themes[theme].primary} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              Start Sequence
            </button>
            
            {isRunning && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`px-6 py-2 text-white rounded-lg ${themes[theme].secondary} transition-colors`}
              >
                {isPaused ? <Play className="inline h-5 w-5" /> : <Pause className="inline h-5 w-5" />}
              </button>
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
          <div className="space-y-6">
            <div className={`${themes[theme].accent} border-2 ${themes[theme].accentBorder} rounded-lg p-6 transition-colors`}>
              <h2 className={`text-2xl font-semibold ${themes[theme].text} mb-3`}>
                Current Task: {tasks[currentTaskIndex].task}
              </h2>
              <p className={`text-4xl font-mono ${themes[theme].text} mb-4`}>
                {formatTime(timeLeft)}
              </p>
              <button
                onClick={completeTask}
                className={`px-4 py-2 text-white rounded-lg ${themes[theme].primary} transition-colors`}
              >
                Complete Task
              </button>
            </div>

            <div className={`${themes[theme].panel} rounded-lg p-6 transition-colors`}>
              <h3 className={`text-lg font-semibold ${themes[theme].text} mb-4`}>
                Upcoming Tasks
              </h3>
              <div className="space-y-2">
                {tasks.slice(currentTaskIndex + 1).map((task, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 border rounded-lg ${themes[theme].border} ${themes[theme].highlight} transition-colors`}
                  >
                    <GripVertical className={`mr-3 ${themes[theme].muted}`} size={16} />
                    <span className={themes[theme].text}>{task.task}</span>
                    <span className={`ml-auto ${themes[theme].muted}`}>{task.minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskSequencer;