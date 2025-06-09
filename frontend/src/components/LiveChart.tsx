"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import io from "socket.io-client";

interface LiveChartProps {
  code: string;
  options: { label: string; votes: number }[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const socket = io(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"
);

export default function LiveChart({ code, options }: LiveChartProps) {
  const initialData = Array.isArray(options)
    ? options.map((opt) => ({ name: opt.label, votes: opt.votes || 0 }))
    : [];

  const [chartData, setChartData] = useState(initialData);

  useEffect(() => {
    socket.emit("join", code);

    socket.on("voteUpdate", (votes: number[]) => {
      setChartData((prev) =>
        prev.map((item, i) => ({
          ...item,
          votes: votes[i] || 0,
        }))
      );
    });

    return () => {
      socket.off("voteUpdate");
    };
  }, [code]);

  const hasVotes = chartData.some((item) => item.votes > 0);

  if (!hasVotes) {
    return (
      <div className="text-center font-bold text-custom_red mt-10">
        None voted yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 mt-6">
      {/* Bar Chart with horizontal scroll */}
      <div className="w-full bg-white shadow rounded p-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-8 text-center text-gray-700">
          Live Vote Count (Bar)
        </h3>
        {/* Set minWidth so bars don't shrink too much */}
        <div style={{ minWidth: chartData.length * 70 + 100, height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ left: 20, right: 20, bottom: 20 }}
            >
              <XAxis
                dataKey="name"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="votes" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart with limited radius */}
      <div className="w-full bg-white shadow rounded p-4 flex flex-col items-center overflow-auto">
        <h3 className="text-lg font-semibold mb-6 text-center text-gray-700">
          Vote Distribution (Pie)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="votes"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              height={40}
              wrapperStyle={{ fontSize: 12, maxHeight: 80, overflowY: "auto" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
