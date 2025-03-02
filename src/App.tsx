import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette, Square, Clock } from 'lucide-react';

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
    const [totalTime, setTotalTime] = useState(0); // State för total tid
    const [startTime, setStartTime] = useState(null); // Ny state för starttid
    
    // Wake Lock states
    const [wakeLock, setWakeLock] = useState(null);
    const [wakeLockSupported, setWakeLockSupported] = useState(false);

    // Beräkna sluttiden baserat på totala minuter
    const calculateEndTime = useCallback((totalMinutes) => {
        if (totalMinutes === 0) return "";
        
        let endTimeDate;
        if (startTime) {
            // Om sekvensen pågår, beräkna från starttiden
            endTimeDate = new Date(startTime.getTime() + totalMinutes * 60 * 1000);
        } else {
            // Om sekvensen inte har startat, beräkna från nuvarande tid
            const now = new Date();
            endTimeDate = new Date(now.getTime() + totalMinutes * 60 * 1000);
        }
        
        // Formatera tiden som HH:MM
        const hours = endTimeDate.getHours().toString().padStart(2, '0');
        const minutes = endTimeDate.getMinutes().toString().padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }, [startTime]);

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

    // Kontrollera om Wake Lock API stöds
    useEffect(() => {
        if ('wakeLock' in navigator) {
            setWakeLockSupported(true);
            console.log('Wake Lock API stöds i denna webbläsare');
        } else {
            console.log('Wake Lock API stöds INTE i denna webbläsare');
            setWakeLockSupported(false);
        }
    }, []);

    // Hantera Wake Lock beroende på om sekvensen körs eller inte
    useEffect(() => {
        let lockRequest = null;

        const requestWakeLock = async () => {
            if (!wakeLockSupported) return;
            
            try {
                const lock = await navigator.wakeLock.request('screen');
                setWakeLock(lock);
                
                lock.addEventListener('release', () => {
                    console.log('Wake Lock släpptes av systemet');
                    setWakeLock(null);
                    
                    // Försök begära ett nytt lås om appen fortfarande är aktiv och inte pausad
                    if (isRunning && !isPaused) {
                        requestWakeLock();
                    }
                });
                
                console.log('Wake Lock aktiverad');
            } catch (err) {
                console.error(`Kunde inte aktivera Wake Lock: ${err.message}`);
            }
        };
        
        const releaseWakeLock = async () => {
            if (wakeLock) {
                try {
                    await wakeLock.release();
                    console.log('Wake Lock släppt manuellt');
                    setWakeLock(null);
                } catch (err) {
                    console.error(`Kunde inte släppa Wake Lock: ${err.message}`);
                }
            }
        };
        
        // Aktivera Wake Lock när sekvensen startas och inte är pausad
        if (isRunning && !isPaused && wakeLockSupported && !wakeLock) {
            requestWakeLock();
        }
        
        // Släpp Wake Lock när appen pausas eller stoppas
        if ((!isRunning || isPaused) && wakeLock) {
            releaseWakeLock();
        }
        
        return () => {
            if (wakeLock) {
                releaseWakeLock();
            }
        };
    }, [isRunning, isPaused, wakeLock, wakeLockSupported]);

    // Hantera visibilitychange event för att återaktivera Wake Lock när appen blir synlig igen
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isRunning && !isPaused && wakeLockSupported && !wakeLock) {
                // Försök begära ett nytt lås när appen blir synlig igen
                const requestWakeLock = async () => {
                    try {
                        const lock = await navigator.wakeLock.request('screen');
                        setWakeLock(lock);
                        console.log('Wake Lock återaktiverad efter visibilitychange');
                    } catch (err) {
                        console.error(`Kunde inte återaktivera Wake Lock: ${err.message}`);
                    }
                };
                requestWakeLock();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isRunning, isPaused, wakeLock, wakeLockSupported]);

    const stopSequence = useCallback(() => {
        setIsRunning(false);
        setCurrentTaskIndex(-1);
        setTimeLeft(0);
        setIsPaused(false);
        setIsFlashing(false);
        setStartTime(null); // Återställ starttiden
        
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
            setStartTime(new Date()); // Spara den aktuella tidpunkten som starttid
            playStartSound(); // Spela startsignal för första uppgiften
        }
    }, [tasks, playStartSound]);
    
    // Funktion för att formatera total tid
    const formatTotalTime = useCallback((minutes) => {
        if (minutes === 0) return "";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}min`;
        } else {
            return `${mins}min`;
        }
    }, []);

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
            
            // Beräkna total tid i minuter
            const totalMinutes = parsedTasks.reduce((sum, task) => sum + (task.minutes || 0), 0);
            setTotalTime(totalMinutes);
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
            <div className="flex flex-wrap gap-1 pb-2 mb-4 justify-center sm:justify-start">
                {minutesArray.map((minute) => (
                    <div
                        key={minute}
                        className={`
                            w-5 h-5 sm:w-6 sm:h-6 border rounded-full
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
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 ${themes[theme].bg} ${themes[theme].text} transition-colors duration-200 ${isFlashing ? 'bg-white' : ''}`}>
            <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto mb-4 flex justify-end space-x-2">
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
            <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto">
                <div className={`mb-8 ${themes[theme].panel} rounded-lg p-4 md:p-6 transition-colors`}>
                    <textarea
                        value={taskInput}
                        onChange={handleInputChange}
                        placeholder="Ange uppgifter (en per rad) i formatet:&#10;uppgiftens namn : minuter&#10;exempel:&#10;Första uppgiften : 20&#10;Paus : 5&#10;Andra uppgiften : 30"
                        className={`w-full h-36 sm:h-48 p-3 sm:p-4 border rounded-lg font-mono text-sm ${themes[theme].text} ${themes[theme].bg} ${themes[theme].border} focus:ring-2 focus:ring-opacity-50 focus:ring-current outline-none transition-colors`}
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={startSequence}
                            disabled={isRunning || tasks.length === 0}
                            className={`px-4 sm:px-6 py-2 text-white rounded-lg ${themes[theme].primary} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                        >
                            Starta Sekvens {!isRunning && totalTime > 0 ? formatTotalTime(totalTime) : ""}
                        </button>

                        {isRunning && (
                            <>
                                <button
                                    onClick={togglePause}
                                    className={`px-4 sm:px-6 py-2 text-white rounded-lg ${themes[theme].secondary} transition-colors`}
                                >
                                    {isPaused ? <Play className="inline h-5 w-5" /> : <Pause className="inline h-5 w-5" />}
                                </button>
                                <button
                                    onClick={stopSequence}
                                    className={`px-4 sm:px-6 py-2 text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors`}
                                >
                                    <Square className="inline h-5 w-5" />
                                </button>
                            </>
                        )}

                        {completedTasks.length > 0 && (
                            <button
                                onClick={exportTasks}
                                className={`px-4 sm:px-6 py-2 rounded-lg ${themes[theme].panel} ${themes[theme].text} transition-colors`}
                            >
                                <Download className="inline h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Wake Lock Status Indicator */}
                {isRunning && wakeLockSupported && (
                    <div className={`fixed top-2 right-2 text-xs px-2 py-1 rounded-full 
                        ${wakeLock 
                            ? `${themes[theme].primary} text-white` 
                            : `${themes[theme].panel} ${themes[theme].text} opacity-50`}`}>
                        {wakeLock ? "Skärm låst" : "Skärm olåst"}
                    </div>
                )}

                {isRunning && currentTaskIndex >= 0 && tasks[currentTaskIndex] && (
                    <div className={`${themes[theme].accent} border-2 ${themes[theme].accentBorder} rounded-lg p-4 md:p-6 transition-colors mb-6`}>
                        <h2 className={`text-xl sm:text-2xl font-semibold ${themes[theme].text} mb-3 break-words`}>
                            Aktuell Uppgift: {tasks[currentTaskIndex].task}
                        </h2>
                        <TimelineCells
                            totalMinutes={tasks[currentTaskIndex].minutes}
                            elapsedSeconds={tasks[currentTaskIndex].minutes * 60 - timeLeft}
                        />
                        <p className={`text-3xl sm:text-4xl font-mono ${themes[theme].text} mb-4`}>{formatTime(timeLeft)}</p>
                        <button
                            onClick={completeTask}
                            className={`px-3 sm:px-4 py-2 text-white rounded-lg ${themes[theme].primary} transition-colors`}
                        >
                            Slutför Uppgift
                        </button>
                    </div>
                )}

                {isRunning && tasks.length > currentTaskIndex + 1 && (
                    <div className={`${themes[theme].panel} rounded-lg p-4 md:p-5 transition-colors mb-4`}>
                        <h2 className={`text-xl sm:text-2xl font-bold ${themes[theme].text} mb-3 border-b-2 ${themes[theme].border} pb-1`}>Kommande Uppgifter</h2>
                        <ul className="space-y-1">
                            {tasks.slice(currentTaskIndex + 1).map((task, index) => (
                                <li
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, currentTaskIndex + 1 + index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, currentTaskIndex + 1 + index)}
                                    className={`relative p-2 sm:p-3 rounded-lg ${themes[theme].bg} ${themes[theme].highlight} border-2 ${themes[theme].border} cursor-move flex items-center`}
                                >
                                    <GripVertical className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                    <span className={`ml-6 ${themes[theme].text} break-words pr-16 text-base sm:text-xl font-medium`}>{task.task}</span>
                                    <span className={`absolute right-2 font-mono text-base sm:text-xl font-bold ${themes[theme].muted}`}>{task.minutes} min</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {completedTasks.length > 0 && (
                    <div className={`${themes[theme].panel} rounded-lg p-4 md:p-5 transition-colors mb-16`}>
                        <h2 className={`text-xl sm:text-2xl font-bold ${themes[theme].text} mb-3 border-b-2 ${themes[theme].border} pb-1`}>Slutförda Uppgifter</h2>
                        <ul className="space-y-1">
                            {completedTasks.map((task, index) => (
                                <li key={index} className={`p-2 sm:p-3 rounded-lg ${themes[theme].bg} border-2 ${themes[theme].border} flex flex-col sm:flex-row sm:justify-between sm:items-center opacity-70 line-through text-gray-500`}>
                                    <div className="break-words mb-1 sm:mb-0">
                                        <span className={`text-gray-500 text-base sm:text-xl font-medium`}>{task.task}</span>
                                    </div>
                                    <div className="font-mono text-base sm:text-xl sm:text-right">
                                        <span className={`text-gray-500 font-medium`}>Slutfört: {task.completedAt}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Footer med information om total tid och sluttid */}
                {isRunning && (
                    <div className="fixed bottom-0 left-0 right-0 border-t border-opacity-30 border-gray-500">
                        <div className={`max-w-full sm:max-w-xl md:max-w-2xl mx-auto ${themes[theme].bg} ${themes[theme].text} px-4 py-3 flex justify-between items-center text-sm sm:text-base opacity-90 hover:opacity-100 transition-opacity`}>
                            <div className="flex items-center">
                                <Clock size={20} className="mr-2 opacity-70" />
                                <span className={`${themes[theme].muted} font-medium`}>Total tid: <span className="font-mono font-bold">{formatTotalTime(totalTime)}</span></span>
                            </div>
                            <div className="flex items-center">
                                <span className={`${themes[theme].muted} font-medium`}>Sluttid: <span className="font-mono font-bold">{calculateEndTime(totalTime)}</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskSequencer;
