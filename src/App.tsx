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
            muted: 'text-slate-600',
            highlightText: ''
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
            muted: 'text-gray-300',
            highlightText: ''
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
            muted: 'text-stone-600',
            highlightText: ''
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
            muted: 'text-purple-800',
            highlightText: ''
        },
        neon: {
            name: 'Neon',
            bg: 'bg-gray-900',
            text: 'text-gray-100',
            panel: 'bg-gray-800',
            border: 'border-pink-600 border-2',
            primary: 'bg-pink-600 hover:bg-pink-700',
            secondary: 'bg-indigo-600 hover:bg-indigo-700',
            accent: 'bg-gray-800',
            accentBorder: 'border-pink-500',
            highlight: 'hover:border-pink-400',
            muted: 'text-gray-400',
            highlightText: 'text-yellow-300',
            shadow: 'shadow-lg shadow-pink-500/30'
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
    const [flashColor, setFlashColor] = useState('white'); // State för flash färg
    const [totalTime, setTotalTime] = useState(0); // State för total tid
    const [startTime, setStartTime] = useState(null); // State för starttid
    const [showInput, setShowInput] = useState(true); // State för att visa/dölja input
    
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

            oscillator.type = 'triangle'; // Richer sound than sine wave
            oscillator.frequency.value = 330; // E4
            gainNode.gain.value = 0.4; // Slightly louder

            oscillator.start();
            oscillator.stop(context.currentTime + 0.3); // Kort signal (300ms)
            
            // Quick visual alert
            setFlashColor('yellow');
            setIsFlashing(true);
            setTimeout(() => {
                setIsFlashing(false);
            }, 150);
            
        } catch (error) {
            console.warn('Could not play warning sound:', error);
        }
    }, []);

    // Roligare slutsignal - en festlig celebrationsmelodi med visuell feedback
    const playFinalSound = useCallback(() => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Skapa en master gain node för kontroll över hela ljudbilden
            const masterGain = context.createGain();
            masterGain.gain.value = 0.8;
            masterGain.connect(context.destination);
            
            // Skapa reverb-effekt för mer rymd i ljudet
            const convolver = context.createConvolver();
            const reverbTime = 2; // sekunder
            const sampleRate = context.sampleRate;
            const length = sampleRate * reverbTime;
            const impulse = context.createBuffer(2, length, sampleRate);
            
            // Skapa impulssvar för reverb
            for (let channel = 0; channel < 2; channel++) {
                const impulseData = impulse.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
                }
            }
            
            convolver.buffer = impulse;
            convolver.connect(masterGain);
            
            // Spela en avancerad glad melodi med effekter
            const playNote = (freq, start, duration, volume = 0.3, type = 'sine', pan = 0, reverb = false) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                const panner = context.createStereoPanner();
                
                // Lägg till filter för mer karaktär
                const filter = context.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 1500 + Math.random() * 1000;
                filter.Q.value = 8;
                
                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(panner);
                
                // Lägg till panning för bredare stereoeffekt
                panner.pan.value = pan;
                
                if (reverb) {
                    panner.connect(convolver);
                } else {
                    panner.connect(masterGain);
                }
                
                oscillator.type = type;
                oscillator.frequency.value = freq;
                
                // Addera attack, decay, sustain, release (ADSR) för mer levande ljud
                gainNode.gain.setValueAtTime(0, context.currentTime + start);
                gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + start + 0.05);
                gainNode.gain.linearRampToValueAtTime(volume * 0.8, context.currentTime + start + duration * 0.3);
                gainNode.gain.setValueAtTime(volume * 0.8, context.currentTime + start + duration * 0.6);
                gainNode.gain.linearRampToValueAtTime(0, context.currentTime + start + duration + 0.1);
                
                // Lägg till lite vibrato på längre toner
                if (duration > 0.2) {
                    const lfo = context.createOscillator();
                    const lfoGain = context.createGain();
                    lfo.frequency.value = 6;
                    lfoGain.gain.value = 5;
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    lfo.start(context.currentTime + start + 0.1);
                    lfo.stop(context.currentTime + start + duration);
                }
                
                oscillator.start(context.currentTime + start);
                oscillator.stop(context.currentTime + start + duration + 0.2);
            };
            
            // Spela en festligare och mer komplex fanfarmelodi
            // Huvudtema - glatt uppåtgående arpeggio
            playNote(523.25, 0, 0.12, 0.5, 'triangle', -0.3);     // C5
            playNote(659.25, 0.1, 0.12, 0.5, 'triangle', 0);      // E5
            playNote(783.99, 0.2, 0.12, 0.5, 'triangle', 0.3);    // G5
            playNote(1046.50, 0.3, 0.3, 0.6, 'square', 0, true);  // C6 (festlig avslutning)
            
            // Rytmiska "fireworks" toner som sprids i stereofältet
            playNote(1318.51, 0.4, 0.06, 0.35, 'sawtooth', -0.6); // E6 (vänster)
            playNote(1567.98, 0.46, 0.06, 0.35, 'sawtooth', 0.6); // G6 (höger)
            playNote(1318.51, 0.52, 0.06, 0.35, 'sawtooth', 0.4); // E6 (höger)
            playNote(1567.98, 0.58, 0.06, 0.35, 'sawtooth', -0.4); // G6 (vänster)
            
            // Grandios avslutning
            playNote(2093.00, 0.65, 0.5, 0.45, 'triangle', 0, true);  // C7
            playNote(1046.50, 0.7, 0.4, 0.3, 'square', -0.3, true);   // C6 (harmonisk förstärkning)
            playNote(1318.51, 0.75, 0.3, 0.25, 'sine', 0.3, true);    // E6 (kompletterande harmoni)
            
            // Sparkly effekter på slutet
            for (let i = 0; i < 8; i++) {
                const pitch = 2093 + Math.random() * 700;
                const startTime = 0.9 + i * 0.04;
                const pan = Math.random() * 2 - 1;
                playNote(pitch, startTime, 0.08, 0.15 - i * 0.01, 'sine', pan);
            }

            // Större visuell celebration - kraftigare och mer varierad grön blinkning
            const flashCelebration = () => {
                let flashCount = 0;
                const maxFlashes = 7;
                const colors = ['green', 'lime', 'green', 'lime', 'green', 'lime', 'white'];
                
                const doFlash = () => {
                    if (flashCount >= maxFlashes) return;
                    
                    setFlashColor(colors[flashCount]);
                    setIsFlashing(true);
                    
                    // Gradvis kortare blinkar för mer intensiv känsla
                    const duration = 300 - flashCount * 20;
                    
                    setTimeout(() => {
                        setIsFlashing(false);
                        flashCount++;
                        
                        // Gradvis kortare pauser
                        const pause = 150 - flashCount * 10;
                        setTimeout(doFlash, pause);
                    }, duration);
                };
                
                doFlash();
            };
            
            flashCelebration();
            
        } catch (error) {
            console.warn('Could not play final sound:', error);
        }
    }, []);

    // Funktion för slutförd uppgift med mer intensiv skärmblinkning i orange
    const playCompletionSound = useCallback(() => {
        console.log("playCompletionSound called");
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a more complex sound with multiple oscillators
            const masterGain = context.createGain();
            masterGain.gain.value = 0.7;
            masterGain.connect(context.destination);
            
            // Main tone (higher pitch for completion)
            const oscillator1 = context.createOscillator();
            const gain1 = context.createGain();
            oscillator1.type = 'triangle';
            oscillator1.frequency.value = 700; // Higher frequency
            gain1.gain.setValueAtTime(0, context.currentTime);
            gain1.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.05);
            gain1.gain.linearRampToValueAtTime(0, context.currentTime + 0.8);
            oscillator1.connect(gain1);
            gain1.connect(masterGain);
            
            // Secondary tone (add richness)
            const oscillator2 = context.createOscillator();
            const gain2 = context.createGain();
            oscillator2.type = 'square';
            oscillator2.frequency.value = 350; // Lower octave
            gain2.gain.setValueAtTime(0, context.currentTime);
            gain2.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.1);
            gain2.gain.linearRampToValueAtTime(0, context.currentTime + 0.6);
            oscillator2.connect(gain2);
            gain2.connect(masterGain);
            
            oscillator1.start();
            oscillator2.start();
            oscillator1.stop(context.currentTime + 1);
            oscillator2.stop(context.currentTime + 1);

            // More intense orange flashing - three blinks with increasing intensity
            const flashIntensity = (iteration) => {
                // Set color with increasing intensity
                setFlashColor('orange');
                setIsFlashing(true);
                setTimeout(() => {
                    setIsFlashing(false);
                    if (iteration < 2) {
                        setTimeout(() => flashIntensity(iteration + 1), 150); // Faster blink
                    }
                }, 180 - iteration * 30); // Gradually shorter flash
            };
            
            flashIntensity(0);

        } catch (error) {
            console.warn('Could not play completion sound:', error);
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
        setShowInput(true); // Visa input igen när sekvensen stoppas
        
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
            setShowInput(false); // Dölj input när sekvensen startar
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

    const toggleInputVisibility = useCallback(() => {
        setShowInput(prev => !prev);
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
                            w-6 h-6 sm:w-8 sm:h-8 border rounded-full
                            flex items-center justify-center text-base sm:text-lg
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
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 ${themes[theme].bg} ${themes[theme].text} transition-colors duration-200 ${isFlashing ? (flashColor === 'orange' ? 'bg-orange-500' : flashColor === 'green' ? 'bg-green-500' : flashColor === 'lime' ? 'bg-lime-400' : flashColor === 'yellow' ? 'bg-yellow-400' : 'bg-white') : ''} ${theme === 'neon' ? themes[theme].shadow : ''}`}>
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
                                    key === 'funky' ? '🌈' : 
                                    key === 'neon' ? '⚡' : null}
                    </button>
                ))}
            </div>
            <div className="max-w-full sm:max-w-xl md:max-w-2xl mx-auto">
                {(showInput || !isRunning) && (
                    <div className={`mb-8 ${themes[theme].panel} rounded-lg p-4 md:p-6 transition-colors ${theme === 'neon' ? themes[theme].shadow : ''}`}>
                        <textarea
                            value={taskInput}
                            onChange={handleInputChange}
                            placeholder="Ange uppgifter (en per rad) i formatet:&#10;uppgiftens namn : minuter&#10;exempel:&#10;Första uppgiften : 20&#10;Paus : 5&#10;Andra uppgiften : 30"
                            className={`w-full h-36 sm:h-48 p-3 sm:p-4 border rounded-lg font-mono text-lg ${themes[theme].text} ${themes[theme].bg} ${themes[theme].border} focus:ring-2 focus:ring-opacity-50 focus:ring-current outline-none transition-colors`}
                        />

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={startSequence}
                                disabled={isRunning || tasks.length === 0}
                                className={`px-4 sm:px-6 py-2 text-white rounded-lg ${themes[theme].primary} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                                Starta Sekvens {!isRunning && totalTime > 0 ? formatTotalTime(totalTime) : ""}
                            </button>
                        </div>
                    </div>
                )}

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
                    <div className={`${themes[theme].accent} border-2 ${themes[theme].accentBorder} rounded-lg p-4 md:p-6 transition-colors mb-6 ${theme === 'neon' ? themes[theme].shadow : ''}`}>
                        <h2 className={`text-2xl sm:text-4xl font-semibold ${themes[theme].text} mb-3 break-words ${theme === 'neon' ? themes[theme].highlightText : ''}`}>
                            Nu: {tasks[currentTaskIndex].task}
                        </h2>
                        <TimelineCells
                            totalMinutes={tasks[currentTaskIndex].minutes}
                            elapsedSeconds={tasks[currentTaskIndex].minutes * 60 - timeLeft}
                        />
                        <p className={`text-4xl sm:text-6xl font-mono ${themes[theme].text} mb-4`}>{formatTime(timeLeft)}</p>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={completeTask}
                                className={`px-3 sm:px-4 py-2 text-white text-lg rounded-lg ${themes[theme].primary} transition-colors`}
                            >
                                Slutför Uppgift
                            </button>
                            
                            <button
                                onClick={togglePause}
                                className={`px-3 sm:px-4 py-2 text-white text-lg rounded-lg ${themes[theme].secondary} transition-colors`}
                            >
                                {isPaused ? <Play className="inline h-5 w-5" /> : <Pause className="inline h-5 w-5" />}
                            </button>
                            
                            <button
                                onClick={stopSequence}
                                className={`px-3 sm:px-4 py-2 text-white text-lg rounded-lg bg-red-500 hover:bg-red-600 transition-colors`}
                            >
                                <Square className="inline h-5 w-5" />
                            </button>
                            
                            {!showInput && (
                                <button
                                    onClick={toggleInputVisibility}
                                    className={`px-3 sm:px-4 py-2 text-lg rounded-lg ${themes[theme].panel} ${themes[theme].text} ${themes[theme].border} transition-colors`}
                                >
                                    Visa Input
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {isRunning && tasks.length > currentTaskIndex + 1 && (
                    <div className={`${themes[theme].panel} rounded-lg p-4 md:p-5 transition-colors mb-4 ${theme === 'neon' ? themes[theme].shadow : ''}`}>
                        <h2 className={`text-2xl sm:text-3xl font-bold ${themes[theme].text} mb-3 border-b-2 ${themes[theme].border} pb-1`}>Kommande Uppgifter</h2>
                        <ul className="space-y-1">
                            {tasks.slice(currentTaskIndex + 1).map((task, index) => (
                                <li
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, currentTaskIndex + 1 + index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, currentTaskIndex + 1 + index)}
                                    className={`relative p-2 sm:p-3 rounded-lg ${themes[theme].bg} ${themes[theme].highlight} border-2 ${themes[theme].border} cursor-move flex items-center ${theme === 'neon' ? themes[theme].shadow : ''}`}
                                >
                                    <GripVertical className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                    <span className={`ml-6 ${themes[theme].text} break-words pr-16 text-xl sm:text-2xl font-medium ${theme === 'neon' ? themes[theme].highlightText : ''}`}>{task.task}</span>
                                    <span className={`absolute right-2 font-mono text-xl sm:text-2xl font-bold ${themes[theme].muted}`}>{task.minutes} min</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {completedTasks.length > 0 && (
                    <div className={`${themes[theme].panel} rounded-lg p-4 md:p-5 transition-colors mb-16 ${theme === 'neon' ? themes[theme].shadow : ''}`}>
                        <h2 className={`text-2xl sm:text-3xl font-bold ${themes[theme].text} mb-3 border-b-2 ${themes[theme].border} pb-1`}>Slutförda Uppgifter</h2>
                        <ul className="space-y-1">
                            {completedTasks.map((task, index) => (
                                <li key={index} className={`p-2 sm:p-3 rounded-lg ${themes[theme].bg} border-2 ${themes[theme].border} flex flex-col sm:flex-row sm:justify-between sm:items-center opacity-70 line-through text-gray-500`}>
                                    <div className="break-words mb-1 sm:mb-0">
                                        <span className={`text-gray-500 text-xl sm:text-2xl font-medium`}>{task.task}</span>
                                    </div>
                                    <div className="font-mono text-xl sm:text-2xl sm:text-right">
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
                        <div className={`max-w-full sm:max-w-xl md:max-w-2xl mx-auto ${themes[theme].bg} ${themes[theme].text} px-4 py-3 flex justify-between items-center text-base sm:text-xl opacity-90 hover:opacity-100 transition-opacity`}>
                            <div className="flex items-center">
                                <Clock size={24} className="mr-2 opacity-70" />
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
