import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette, BarChart } from 'lucide-react';

// Theme configurations
const themes = {
  light: {
    name: 'Ljust',
    bg: 'bg-white',
    text: 'text-gray-700',
    panel: 'bg-gray-50',
    border: 'border-gray-200',
    primary: 'bg-emerald-600 hover:bg-emerald-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    accent: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    highlight: 'hover:border-emerald-200',
    muted: 'text-gray-500'
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
    muted: 'text-gray-400'
  }
};

// Break type configurations
const breakTypes = {
  micro: {
    trigger: 25,
    duration: 2,
    emoji: '👁️',
    activities: [
      { sv: "Vila ögonen: Titta 20 fot bort", en: "Rest eyes: Look 20 feet away" },
      { sv: "Snabbstretch", en: "Quick stretch" },
      { sv: "Djupandning", en: "Deep breathing" },
      { sv: "Handledsövningar", en: "Wrist exercises" },
      { sv: "Hållningskontroll", en: "Posture check" }
    ]
  },
  short: {
    trigger: 50,
    duration: 5,
    emoji: '🔄',
    activities: [
      { sv: "Stå och sträck på dig", en: "Stand and stretch" },
      { sv: "Drick vatten", en: "Get water" },
      { sv: "Kort promenad", en: "Quick walk" },
      { sv: "Skrivbordsövningar", en: "Desk exercises" },
      { sv: "Medveten andning", en: "Mindful breathing" }
    ]
  },
  long: {
    trigger: 90,
    duration: 15,
    emoji: '🌟',
    activities: [
      { sv: "Ta en promenad", en: "Take a walk" },
      { sv: "Komplett stretching", en: "Full stretching" },
      { sv: "Nyttig mellanmål", en: "Healthy snack" },
      { sv: "Meditation", en: "Meditation" },
      { sv: "Frisk luft", en: "Fresh air" }
    ]
  }
};

// Task priority and category configurations
const priorities = {
  '!!!': { level: 'high', emoji: '🔴', sv: 'Hög', fatigue: 1.5 },
  '!!': { level: 'medium', emoji: '🟡', sv: 'Medel', fatigue: 1.2 },
  '!': { level: 'low', emoji: '🟢', sv: 'Låg', fatigue: 1.0 }
};

const taskCategories = {
  '@focus': { emoji: '🧠', sv: 'Fokus', fatigue: 1.3 },
  '@meeting': { emoji: '👥', sv: 'Möte', fatigue: 1.1 },
  '@creative': { emoji: '🎨', sv: 'Kreativ', fatigue: 1.2 },
  '@admin': { emoji: '📋', sv: 'Admin', fatigue: 0.9 },
  '@exercise': { emoji: '💪', sv: 'Träning', fatigue: 1.4 }
};

function TaskSequencer() {
  // State management
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [theme, setTheme] = useState('light');
  const [stats, setStats] = useState({
    dailyFatigue: 0,
    tasksCompleted: 0,
    totalBreakTime: 0,
    productivity: []
  });

  // Sound management
  const playSound = useCallback((type) => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    switch(type) {
      case 'halfway':
        oscillator.type = 'sine';
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        break;
      case 'warning':
        oscillator.type = 'sine';
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
        break;
      case 'complete':
        oscillator.type = 'sine';
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
        oscillator.type = 'square';
        gainNode.gain.value = 0.2;
        
        // Rising victory melody
        const notes = [400, 500, 600, 800];
        const noteDuration = 0.15;
        
        notes.forEach((freq, i) => {
          oscillator.frequency.setValueAtTime(freq, context.currentTime + (i * noteDuration));
          if (i === notes.length - 1) {
            oscillator.start(context.currentTime + (i * noteDuration));
            oscillator.stop(context.currentTime + (i * noteDuration) + 0.5);
          } else {
            oscillator.start(context.currentTime + (i * noteDuration));
            oscillator.stop(context.currentTime + ((i + 1) * noteDuration));
          }
        });
        break;
      default:
        break;
    }
  }, []);

  // Helper functions
  const getRandomActivity = useCallback((breakType) => {
    const activities = breakTypes[breakType].activities;
    return activities[Math.floor(Math.random() * activities.length)];
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Task input handling
  const handleInputChange = useCallback((e) => {
    const input = e.target.value;
    setTaskInput(input);
    
    const parsedTasks = input
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Parse priority and category
        const priority = Object.keys(priorities).find(p => line.includes(p)) || '';
        const category = Object.keys(taskCategories).find(c => line.includes(c)) || '';
        
        const isUnbreakable = line.includes('!unbreakable');
        const cleanLine = line
          .replace('!unbreakable', '')
          .replace(priority, '')
          .replace(category, '')
          .trim();
        
        const [task, minutes] = cleanLine.split(':').map(part => part.trim());
        const taskMinutes = parseInt(minutes) || 0;

        // Calculate fatigue factor
        const priorityFatigue = priorities[priority]?.fatigue || 1;
        const categoryFatigue = taskCategories[category]?.fatigue || 1;
        const fatigueFactor = priorityFatigue * categoryFatigue;

        // Base task object
        const baseTask = {
          task,
          originalMinutes: taskMinutes,
          priority,
          category,
          isUnbreakable,
          fatigueFactor
        };

        if (isUnbreakable) {
          return {
            ...baseTask,
            minutes: taskMinutes,
            displayName: `${priorities[priority]?.emoji || ''} ${taskCategories[category]?.emoji || ''} ${task}`
          };
        }

        // Split long tasks and add dynamic breaks
        if (taskMinutes > 30) {
          const parts = [];
          let remainingMinutes = taskMinutes;
          let partNum = 1;
          let accumulatedFatigue = 0;

          while (remainingMinutes > 0) {
            // Calculate dynamic break duration based on fatigue
            accumulatedFatigue += 30 * fatigueFactor;
            const breakDuration = Math.min(
              Math.ceil(accumulatedFatigue / 50) * 5, // 5 min break for every 50 fatigue points
              15 // Max 15 min break
            );

            if (remainingMinutes > 30) {
              // Add work chunk
              parts.push({
                ...baseTask,
                minutes: 30,
                displayName: `${priorities[priority]?.emoji || ''} ${taskCategories[category]?.emoji || ''} ${task} (Del ${partNum})`
              });

              // Add appropriate break with random activity
              const breakType = accumulatedFatigue > 90 ? 'long' : 'short';
              const activity = getRandomActivity(breakType);
              parts.push({
                task: `${breakTypes[breakType].emoji} Paus: ${activity.sv}`,
                minutes: breakDuration,
                isBreak: true,
                breakType
              });

              remainingMinutes -= 30;
              partNum++;
            } else {
              parts.push({
                ...baseTask,
                minutes: remainingMinutes,
                displayName: `${priorities[priority]?.emoji || ''} ${taskCategories[category]?.emoji || ''} ${task} (Del ${partNum})`
              });
              remainingMinutes = 0;
            }
          }
          return parts;
        }

        return {
          ...baseTask,
          minutes: taskMinutes,
          displayName: `${priorities[priority]?.emoji || ''} ${taskCategories[category]?.emoji || ''} ${task}`
        };
      })
      .flat();

    setTasks(parsedTasks);
  }, [getRandomActivity]);

  // Task completion handling
  const completeTask = useCallback(() => {
    const currentTask = tasks[currentTaskIndex];
    playSound('complete');
    
    setCompletedTasks(prev => [...prev, {
      ...currentTask,
      completedAt: new Date().toLocaleTimeString()
    }]);

    // Update statistics
    setStats(prev => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
      dailyFatigue: prev.dailyFatigue + (currentTask.minutes * (currentTask.fatigueFactor || 1)),
      totalBreakTime: prev.totalBreakTime + (currentTask.isBreak ? currentTask.minutes : 0)
    }));

    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTimeLeft(tasks[currentTaskIndex + 1].minutes * 60);
      setIsPaused(false);
    } else {
      playSound('allComplete');
      setIsRunning(false);
      setCurrentTaskIndex(-1);
      setTimeLeft(0);
      setIsPaused(false);
    }
  }, [currentTaskIndex, tasks, playSound]);

  // Timer effect
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

  // Sequence control
  const startSequence = useCallback(() => {
    if (tasks.length > 0) {
      setCurrentTaskIndex(0);
      setTimeLeft(tasks[0].minutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setCompletedTasks([]);
      setStats({
        dailyFatigue: 0,
        tasksCompleted: 0,
        totalBreakTime: 0,
        productivity: []
      });
    }
  }, [tasks]);

  // Export functionality
  const exportTasks = useCallback(() => {
    const exportData = {
      originalSequence: tasks,
      completedTasks,
	  exportedAt: new Date().toLocaleString(),
      stats
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
  }, [tasks, completedTasks, stats]);

  // Instructions component
  const Instructions = () => (
    <div className={`mb-4 ${themes[theme].panel} rounded-lg p-4`}>
      <h3 className={`text-lg font-semibold ${themes[theme].text} mb-2`}>Instruktioner:</h3>
      <div className={`${themes[theme].text} space-y-2 text-sm`}>
        <p>• Skriv uppgifter på formatet: <code>uppgift : minuter</code></p>
        <p>• Använd prioriteter: !!! (hög), !! (medel), ! (låg)</p>
        <p>• Kategorier: @focus, @meeting, @creative, @admin, @exercise</p>
        <p>• Använd !unbreakable för att förhindra pauser</p>
        <p>• Långa uppgifter delas automatiskt med pauser</p>
        <p>Exempel:</p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
          !!! @focus Viktigt projekt : 60{'\n'}
          !! @meeting Teammöte !unbreakable : 45{'\n'}
          ! @admin Email : 30
        </pre>
      </div>
    </div>
  );

  // Statistics component
  const Statistics = () => (
    <div className={`mb-4 ${themes[theme].panel} rounded-lg p-4`}>
      <h3 className={`text-lg font-semibold ${themes[theme].text} mb-2`}>Statistik:</h3>
      <div className={`${themes[theme].text} space-y-1`}>
        <p>Avklarade uppgifter: {stats.tasksCompleted}</p>
        <p>Total paustid: {Math.round(stats.totalBreakTime)} minuter</p>
        <p>Trötthetsfaktor: {Math.round(stats.dailyFatigue)} / 480</p>
      </div>
    </div>
  );

  // Main render
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
            {key === 'light' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <Instructions />

        <div className={`mb-8 ${themes[theme].panel} rounded-lg p-6 transition-colors`}>
          <textarea
            value={taskInput}
            onChange={handleInputChange}
            placeholder="Skriv uppgifter (en per rad):&#10;uppgift : minuter&#10;Exempel:&#10;!!! @focus Viktigt projekt : 60&#10;!! @meeting Teammöte !unbreakable : 45&#10;! @admin Email : 30"
            className={`w-full h-48 p-4 border rounded-lg font-mono ${themes[theme].text} ${themes[theme].bg} ${themes[theme].border} focus:ring-2 focus:ring-opacity-50 focus:ring-current outline-none transition-colors`}
          />
          
          <div className="mt-4 space-x-3">
            <button
              onClick={startSequence}
              disabled={isRunning || tasks.length === 0}
              className={`px-6 py-2 text-white rounded-lg ${themes[theme].primary} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              Starta sekvens
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
                Aktuell uppgift: {tasks[currentTaskIndex].displayName || tasks[currentTaskIndex].task}
              </h2>
              <p className={`text-4xl font-mono ${themes[theme].text} mb-4`}>
                {formatTime(timeLeft)}
              </p>
              <button
                onClick={completeTask}
                className={`px-4 py-2 text-white rounded-lg ${themes[theme].primary} transition-colors`}
              >
                Avsluta uppgift
              </button>
            </div>

            <Statistics />

            <div className={`${themes[theme].panel} rounded-lg p-6 transition-colors`}>
              <h3 className={`text-lg font-semibold ${themes[theme].text} mb-4`}>
                Kommande uppgifter
              </h3>
              <div className="space-y-2">
                {tasks.slice(currentTaskIndex + 1).map((task, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 border rounded-lg ${themes[theme].border} ${themes[theme].highlight} transition-colors`}
                  >
                    <GripVertical className={`mr-3 ${themes[theme].muted}`} size={16} />
                    <span className={themes[theme].text}>{task.displayName || task.task}</span>
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