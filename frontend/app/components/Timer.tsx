'use client';
import { useEffect, useState } from 'react';

interface TimerProps {
  duration?: number; // seconds
}

export default function Timer({ duration = 300 }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-center font-mono">
      Time Left: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}