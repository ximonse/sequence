import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette, Square } from 'lucide-react';

const TaskSequencer = () => {
    const themes = useMemo(() => ({
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
    }), []);
    const [taskInput, setTaskInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [theme, setTheme] = useState('dark'); // Börja med mörkt läge
    const [isFlashing, setIsFlashing] = useState(false); // State för blinkande skärm

    // Funktion för att spela en kort startsignal
    const playStartSound = useCallback(() => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 440; // A4
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(context.currentTime + 0.3); // Kort signal (300ms)
        } catch (error) {
            console.warn('Could not play start sound:', error);
        }
    }, []);

    // Funktion för att spela en kort varningssignal
    const playWarningSound = useCallback(() => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 330; // E4
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(context.currentTime + 0.3); // Kort signal (300ms)
        } catch (error) {
            console.warn('Could not play warning sound:', error);
        }
    }, []);

    // Funktion för att spela ett slutljud efter hela sekvensen
    const playFinalSound = useCallback(() => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Spela en liten glad melodi
            const playNote = (freq, start, duration, volume = 0.3) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                gainNode.gain.value = volume;
                
                oscillator.start(context.currentTime + start);
                oscillator.stop(context.currentTime + start + duration);
            };
            
            // Spela en enkel treklang (C-dur)
            playNote(523.25, 0, 0.15);     // C5
            playNote(659.25, 0.2, 0.15);   // E5 
            playNote(783.99, 0.4, 0.3);    // G5 (lite längre)
            
        } catch (error) {
            console.warn('Could not play final sound:', error);
        }
    }, []);

    // Funktion för slutförd uppgift med dubbel skärmblinkning
    const playCompletionSound = useCallback(() => {
        console.log("playCompletionSound called");
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.6;

            oscillator.start();
            oscillator.stop(context.currentTime + 1);

            // Skärmblinkning - dubbel blink oavsett tema
            setIsFlashing(true);
            setTimeout(() => {
                setIsFlashing(false);
                setTimeout(() => {
                    setIsFlashing(true);
                    setTimeout(() => {
                        setIsFlashing(false);
                    }, 200);
                }, 200);
            }, 200);

        } catch (error) {
            console.warn('Could not play sound:', error);
        }
    }, []);

    const stopSequence = useCallback(() => {
        setIsRunning(false);
        setCurrentTaskIndex(-1);
        setTimeLeft(0);
        setIsPaused(false);
        setIsFlashing(false);
        
        // Kolla om det var sista uppgiften i sekvensen som slutfördes
        if (completedTasks.length > 0 && completedTasks.length === tasks.length) {
            playFinalSound(); // Spela slutsignalen när alla uppgifter är klara
        }
    }, [completedTasks.length, tasks.length, playFinalSound]);

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
    }, [currentTaskIndex, tasks, stopSequence, playCompletionSound]);

    const startSequence = useCallback(() => {
        if (tasks.length > 0) {
            const firstTask = tasks[0];
            setCurrentTaskIndex(0);
            setTimeLeft(firstTask.minutes * 60);
            setIsRunning(true);
            setIsPaused(false);
            setCompletedTasks([]);
            setIsFlashing(false);
            playStartSound(); // Spela startsignal för första uppgiften
        }
    }, [tasks, playStartSound]);

    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    // Timer effect med varningssignal
    useEffect(() => {
        let timer;

        if (isRunning && !isPaused && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    // Om det är 5 minuter kvar och uppgiften är längre än 9 minuter
                    const currentTask = tasks[currentTaskIndex];
                    if (
                        currentTask && 
                        currentTask.minutes > 9 && 
                        prevTime === 5 * 60 // 5 minuter kvar
                    ) {
                        playWarningSound();
                    }
                    
                    if (prevTime <= 1) {
                        completeTask();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isRunning, isPaused, completeTask, timeLeft, playWarningSound, tasks, currentTaskIndex]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const handleInputChange = useCallback((e) => {
        const input = e.target.value;
        setTaskInput(input);

        // Debounce the task parsing to prevent freezing
        const timeoutId = setTimeout(() => {
            const lines = input.split('\n').filter(line => line.trim());
            const parsedTasks = lines.map(line => {
                const isUnbreakable = line.includes('!odelbar');
                const cleanLine = line.replace('!odelbar', '').trim();
                const [task, minutes] = cleanLine.split(':').map(part => part.trim());
                return {
                    task: task || '',
                    minutes: parseInt(minutes) || 0,
                    isUnbreakable
                };
            });
            setTasks(parsedTasks);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, []);


    const handleDragStart = useCallback((e, index) => {
        setDraggedIndex(index);
        e.currentTarget.classList.add('opacity-50');
    }, []);

    const handleDragEnd = useCallback((e) => {
        e.currentTarget.classList.remove('opacity-50');
        setDraggedIndex(null);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e, dropIndex) => {
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
    }, [currentTaskIndex, draggedIndex, tasks]);


    const exportTasks = useCallback(() => {
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
    }, [tasks, completedTasks]);


    const TimelineCells = React.memo(({ totalMinutes, elapsedSeconds }) => {
        const minutesArray = Array.from({ length: totalMinutes }, (_, i) => i);
        const currentMinute = Math.floor(elapsedSeconds / 60);

        return (
            <div className="flex flex-wrap gap-1.5 pb-2 mb-4">
                {minutesArray.map((minute) => (
                    <div
                        key={minute}
                        className={`
                            w-6 h-6 border rounded-full
                            flex items-center justify-center text-xs
                            ${minute < currentMinute
                                ? `${themes[theme].primary} text-white`
                                : minute === currentMinute
                                    ? `${themes[theme].accent} ${themes[theme].accentBorder}`
                                    : `${themes[theme].panel} ${themes[theme].border}`
                            }
                        `}
                    >
                        {minute + 1}
                    </div>
                ))}
            </div>
        );
    });


    return (
        <div className={`min-h-screen p-6 ${themes[theme].bg} ${themes[theme].text} transition-colors duration-200 ${isFlashing ? 'bg-white' : ''}`}>
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
                        placeholder="Ange uppgifter (en per rad) i formatet:&#10;uppgiftens namn : minuter&#10;exempel:&#10;Första uppgiften : 20&#10;Paus : 5&#10;Andra uppgiften : 30"
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
                        <h2 className={`text-xl font-semibold ${themes[theme].text} mb-4`}>Kommande Uppgifter</h2>
                        <ul className="space-y-2">
                            {tasks.slice(currentTaskIndex + 1).map((task, index) => (
                                <li
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, currentTaskIndex + 1 + index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, currentTaskIndex + 1 + index)}
                                    className={`relative p-3 rounded-lg ${themes[theme].bg} ${themes[theme].highlight} border-2 ${themes[theme].border} cursor-move flex items-center`}
                                >
                                    <GripVertical className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                                    <span className={`ml-4 ${themes[theme].text}`}>{task.task}</span>
                                    <span className={`ml-auto font-mono text-sm ${themes[theme].muted}`}>{task.minutes} min</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {completedTasks.length > 0 && (
                    <div className={`${themes[theme].panel} rounded-lg p-6 transition-colors`}>
                        <h2 className={`text-xl font-semibold ${themes[theme].text} mb-4`}>Slutförda Uppgifter</h2>
                        <ul className="space-y-2">
                            {completedTasks.map((task, index) => (
                                <li key={index} className={`p-3 rounded-lg ${themes[theme].bg} border-2 ${themes[theme].border} flex justify-between items-center opacity-70 line-through text-gray-500`}>
                                    <div>
                                        <span className={`${themes[theme].text}`}>{task.task}</span>
                                    </div>
                                    <div className="font-mono text-sm text-right">
                                        <span className={`${themes[theme].muted}`}>Slutfört: {task.completedAt}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskSequencer;