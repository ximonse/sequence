import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, GripVertical, Sun, Moon, Palette } from 'lucide-react';


// Break type configurations

// Break type configurations

// Break type configurations
const breakTypes = {
  micro: { trigger: 50, duration: 2, emoji: '👁️', activities: ["Vila ögonen", "Snabbstretch", "Djupandning", "Handledsövningar", "Hållningskontroll"] },
  short: { trigger: 90, duration: 5, emoji: '🔄', activities: ["Stå och sträck", "Drick vatten", "Kort promenad", "Skrivbordsövningar", "Medveten andning"] },
  long: { trigger: 120, duration: 15, emoji: '🌟', activities: ["Ta en promenad", "Stretching", "Nyttigt mellanmål", "Meditation", "Frisk luft"] }
};

// Function to get a random break activity
const getRandomActivity = (breakType) => {
  const activities = breakTypes[breakType].activities;
  return activities[Math.floor(Math.random() * activities.length)];
};

// Function to automatically insert breaks into long tasks
const calculateBreaks = (taskName, minutes, isUnbreakable = false) => {
  if (isUnbreakable || minutes <= 50) {
    return [{ task: taskName, minutes, isUnbreakable }];
  }

  const segments = [];
  let remainingMinutes = minutes;
  let partNumber = 1;

  while (remainingMinutes > 0) {
    let segmentDuration = Math.min(remainingMinutes, 50);
    let breakDuration = 0;
    let breakType = '';

    if (remainingMinutes > 50) {
      if (minutes - remainingMinutes >= 120) {
        breakDuration = 15;
        breakType = 'long';
      } else if (minutes - remainingMinutes >= 90) {
        breakDuration = 5;
        breakType = 'short';
      } else if (minutes - remainingMinutes >= 50) {
        breakDuration = 2;
        breakType = 'micro';
      }
    }

    const partLabel = minutes > 50 ? ` (Part ${partNumber})` : '';
    segments.push({ task: taskName + partLabel, minutes: segmentDuration });

    if (breakDuration > 0) {
      const activity = getRandomActivity(breakType);
      segments.push({ task: `Break - ${activity}`, minutes: breakDuration, isBreak: true });
    }

    remainingMinutes -= segmentDuration;
    partNumber++;
  }

  return segments;
};

// Function to process task input and add breaks automatically
const processTaskInput = (tasks) => {
  return tasks.reduce((acc, { task, minutes, isUnbreakable }) => {
    return [...acc, ...calculateBreaks(task, minutes, isUnbreakable)];
  }, []);
};



  const completedTaskStyle = "line-through opacity-50";


function TaskSequencer() {