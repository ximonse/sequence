import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette } from 'lucide-react';

function TaskSequencer() {
  const themes = {
    light: {
      name: 'Light (Claude)',
      bg: 'bg-white',
      text: 'text-slate-700',
      panel: 'bg-slate-50',
      border: 'border-slate-200',
      primary: 'bg-emerald-600 hover:bg-emerald-700',
      secondary: 'bg-slate-600 hover:bg-slate-700',
      accent: 'bg-emerald-50',
      accentBorder: 'border-emerald-200',
      highlight: 'hover:border-emerald-200',
      muted: 'text-slate-500'
    },
    dark: {
      name: 'Dark',
      bg: 'bg-gray-900',
      text: 'text-gray-100',
      panel: 'bg-gray-800',
      border: 'border-gray-700',
      primary: 'bg-emerald-500 hover:bg-emerald-600',
      secondary: 'bg-gray-600 hover:bg-gray-700',
      accent: 'bg-gray-800',
      accentBorder: 'border-emerald-700',
      highlight: 'hover:border-emerald-500',
      muted: 'text-gray-400'
    },
    soft: {
      name: 'Soft',
      bg: 'bg-stone-50',
      text: 'text-stone-700',
      panel: 'bg-stone-100',
      border: 'border-stone-200',
      primary: 'bg-stone-600 hover:bg-stone-700',
      secondary: 'bg-stone-500 hover:bg-stone-600',
      accent: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      highlight: 'hover:border-amber-200',
      muted: 'text-stone-500'
    },
    ocean: {
      name: 'Ocean',
      bg: 'bg-cyan-50',
      text: 'text-slate-700',
      panel: 'bg-white',
      border: 'border-cyan-200',
      primary: 'bg-cyan-600 hover:bg-cyan-700',
      secondary: 'bg-blue-500 hover:bg-blue-600',
      accent: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      highlight: 'hover:border-blue-200',
      muted: 'text-slate-500'
    }
  };

  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [theme, setTheme] = useState('light');

  function playHalfwayBeep() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    
    function playDoubleBeep(startTime) {
      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      osc1.connect(gain1);
      gain1.connect(context.destination);
      osc1.type = 'sine';
      osc1.frequency.value = 600;
      gain1.gain.value = 0.5;
      osc1.start(startTime);
      osc1.stop(startTime + 0.1);

      const osc2 = context.createOscillator();
      const gain2 = context.createGain();
      osc2.connect(gain2);
      gain2.connect(context.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 600;
      gain2.gain.value = 0.5;
      osc2.start(startTime + 0.1);
      osc2.stop(startTime + 0.2);
    }

    playDoubleBeep(context.currentTime);
    playDoubleBeep(context.currentTime + 0.6);
    playDoubleBeep(context.currentTime + 1.2);
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
    
    function playBeep(startTime, duration) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.5;
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    }
    
    playBeep(context.currentTime, 0.2);
    playBeep(context.currentTime + 0.6, 0.2);
    playBeep(context.currentTime + 1.2, 0.2);
    playBeep(context.currentTime + 1.8, 0.8);
  }

  const breakActivities = {
    microBreak: [
      "Eye rest: Look at something 20 feet away for 20 seconds",
      "Quick stretches: Neck and shoulders",
      "Deep breathing: 5 slow breaths",
      "Hand and wrist exercises",
      "Quick posture check and adjustment"
    ],
    shortBreak: [
      "Stand up and stretch",
      "Get a glass of water",
      "Quick walk around the room",
      "Simple desk exercises",
      "Mindful breathing exercise"
    ],
    longBreak: [
      "Take a proper walk",
      "Do a full stretching routine",
      "Prepare a healthy snack",
      "Brief meditation session",
      "Step outside for fresh air"
    ]
  };

  function getRandomActivity(breakType) {
    const activities = breakActivities[breakType];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  function calculateBreaks(taskName, minutes, isUnbreakable = false) {
    if (isUnbreakable || minutes <= 25) {
      return [{ task: taskName, minutes, isUnbreakable }];
    }

    const segments = [];
    let remainingMinutes = minutes;
    let partNumber = 1;
    const totalParts = Math.ceil(minutes / 25);

    while (remainingMinutes > 0) {
      // Determine segment duration and break type
      let segmentDuration = Math.min(remainingMinutes, 25);
      let breakDuration = 0;
      let breakType = '';
      
      // Cumulative time worked
      const timeWorked = minutes - remainingMinutes;

      if (remainingMinutes > 25) {  // Not the last segment
        if (timeWorked % 90 === 0) {
          // Long break after every 90 minutes
          breakDuration = 15;
          breakType = 'longBreak';
        } else if (timeWorked % 25 === 0) {
          // Short break after 25 minutes
          breakDuration = timeWorked % 50 === 0 ? 5 : 2;
          breakType = breakDuration === 5 ? 'shortBreak' : 'microBreak';
        }
      }

      // Add work segment
      const partLabel = totalParts > 1 ? ` (Part ${partNumber})` : '';
      segments.push({
        task: taskName + partLabel,
        minutes: segmentDuration
      });

      // Add break if needed
      if (breakDuration > 0) {
        const activity = getRandomActivity(breakType);
        segments.push({
          task: `Break - ${activity}`,
          minutes: breakDuration,
          isBreak: true,
          breakType
        });
      }

      remainingMinutes -= segmentDuration;
      partNumber++;
    }

    return segments;
  }

  function suggestBreak(taskName, minutes, isUnbreakable = false) {
    if (!isUnbreakable && minutes > 25) {
      const message = minutes > 90 
        ? `"${taskName}" is a long task (${minutes} minutes). Would you like to add smart breaks?\n\n` +
          "• 2-min micro-breaks every 25 minutes for eye rest and stretching\n" +
          "• 5-min breaks every 50 minutes\n" +
          "• 15-min breaks every 90 minutes\n" +
          "\nBreaks will include suggested activities."
        : `"${taskName}" is longer than 25 minutes. Would you like to add smart breaks with suggested activities?`;

      const shouldAddBreaks = window.confirm(message);
      
      if (shouldAddBreaks) {
        return calculateBreaks(taskName, minutes, false);
      }
    }
    return [{ task: taskName, minutes, isUnbreakable }];
  }

  function parseTaskInput(input) {
    const rawTasks = input
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [task, minutes] = line.split(':').map(part => part.trim());
        return {
          task,
          minutes: parseInt(minutes) || 0
        };
      });

    // Process each task and potentially split long ones with breaks
    return rawTasks.reduce((acc, { task, minutes }) => {
      return [...acc, ...suggestBreak(task, minutes)];
    }, []);
  }

  function handleInputChange(e) {
    setTaskInput(e.target.value);
    const input = e.target.value;
    
    // Check for special markers
    const lines = input.split('\n').map(line => {
      const isUnbreakable = line.includes('!unbreakable');
      const cleanLine = line.replace('!unbreakable', '').trim();
      return { line: cleanLine, isUnbreakable };
    });

    // Parse tasks with unbreakable information
    const parsedTasks = lines
      .filter(({ line }) => line)
      .map(({ line, isUnbreakable }) => {
        const [task, minutes] = line.split(':').map(part => part.trim());
        return {
          task,
          minutes: parseInt(minutes) || 0,
          isUnbreakable
        };
      });

    // Process each task through break suggestion
    const processedTasks = parsedTasks.reduce((acc, { task, minutes, isUnbreakable }) => {
      return [...acc, ...suggestBreak(task, minutes, isUnbreakable)];
    }, []);

    setTasks(processedTasks);
  }

  function completeTask() {
    const currentTask = tasks[currentTaskIndex];
    const completionTime = new Date().toLocaleTimeString();
    
    playCompletionSound();
    
    setCompletedTasks([...completedTasks, {
      ...currentTask,
      completedAt: completionTime
    }]);

    if (currentTaskIndex < tasks.length - 1) {
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      setTimeLeft(parseInt(tasks[nextIndex].minutes) * 60);
      setIsPaused(false);
    } else {
      setIsRunning(false);
      setCurrentTaskIndex(-1);
      setTimeLeft(0);
      setIsPaused(false);
    }
  }

  useEffect(() => {
    let timer;
    if (isRunning && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const currentTask = tasks[currentTaskIndex];
          const totalSeconds = currentTask?.minutes * 60 || 0;
          
          if (currentTask?.minutes > 14 && prevTime === Math.floor(totalSeconds / 2)) {
            playHalfwayBeep();
          }
          
          if (currentTask?.minutes > 10 && prevTime === 300) {
            playWarningBeep();
          }
          
          if (prevTime <= 1) {
            completeTask();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft]);

  function togglePause() {
    setIsPaused(!isPaused);
  }

  function startSequence() {
    if (tasks.length > 0) {
      setCurrentTaskIndex(0);
      setTimeLeft(parseInt(tasks[0].minutes) * 60);
      setIsRunning(true);
      setIsPaused(false);
      setCompletedTasks([]);
    }
  }

  function exportTasks() {
    const exportData = {
      originalSequence: tasks,
      completedTasks: completedTasks,
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
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.currentTarget.classList.add('opacity-50');
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedIndex(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    if (draggedIndex === null) return;

    const draggedUpcomingIndex = draggedIndex - (currentTaskIndex + 1);
    const dropUpcomingIndex = dropIndex - (currentTaskIndex + 1);

    const newTasks = [...tasks];
    const upcomingTasks = newTasks.slice(currentTaskIndex + 1);
    const [reorderedItem] = upcomingTasks.splice(draggedUpcomingIndex, 1);
    upcomingTasks.splice(dropUpcomingIndex, 0, reorderedItem);

    setTasks([
      ...newTasks.slice(0, currentTaskIndex + 1),
      ...upcomingTasks
    ]);
  }

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
             key === 'ocean' ? '🌊' : null}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className={`mb-8 ${themes[theme].panel} rounded-lg p-6 transition-colors`}>
          <textarea
            value={taskInput}
            onChange={handleInputChange}
            onBlur={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputChange(e);
              }
            }}
            placeholder="Enter tasks (one per line) in format:&#10;task name : minutes&#10;example:&#10;First task : 20&#10;Break : 5&#10;Second task : 30&#10;&#10;Add !unbreakable for tasks that shouldn't be split:&#10;Important meeting !unbreakable : 45"
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
                onClick={togglePause}
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
              <p className={`text-4xl font-mono ${themes[theme].text} mb-4`}>{formatTime(timeLeft)}</p>
              <button
                onClick={completeTask}
                className={`px-4 py-2 text-white rounded-lg ${themes[theme].primary} transition-colors`}
              >
                Complete Task
              </button>
            </div>

            <div className={`${themes[theme].panel} rounded-lg p-6 transition-colors`}>
              <h3 className={`text-lg font-semibold ${themes[theme].text} mb-4`}>
                Upcoming Tasks <span className={`text-sm font-normal ${themes[theme].muted}`}>(drag to reorder)</span>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskSequencer;