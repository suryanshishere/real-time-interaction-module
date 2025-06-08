'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import io from 'socket.io-client';

interface LiveChartProps {
  code: string;
  options: { label: string; votes: number }[];
}

const socket = io('http://localhost:4000');

export default function LiveChart({ code, options }: LiveChartProps) {
  // Defensive: If options is undefined or empty, initialize empty array
  const initialData = Array.isArray(options)
    ? options.map(opt => ({ name: opt.label, votes: opt.votes || 0 }))
    : [];

  const [chartData, setChartData] = useState(initialData);

  useEffect(() => {
    socket.emit('join', code);

    socket.on('voteUpdate', (votes: number[]) => {
  setChartData(prev =>
    prev.map((item, i) => ({
      ...item,
      votes: votes[i] || 0,
    }))
  );
});


    return () => {
      socket.off('voteUpdate');
    };
  }, [code]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="votes" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
