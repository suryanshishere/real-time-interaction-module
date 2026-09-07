import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface LiveChartProps { options: { label: string; votes: number }[]; }
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function LiveChart({ options }: LiveChartProps) {
  const chartData = options.map((option) => ({ name: option.label, votes: option.votes || 0 }));
  if (!chartData.some((item) => item.votes > 0)) return <div className="mt-10 text-center font-bold text-custom_red">No votes yet.</div>;
  return (
    <div className="mt-6 flex flex-col gap-10">
      <div className="w-full overflow-auto rounded bg-white p-4 shadow">
        <h2 className="mb-8 text-center text-lg font-semibold text-gray-700">Live Vote Count</h2>
        <div style={{ minWidth: chartData.length * 70 + 100, height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: 20, right: 20, bottom: 20 }}><XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="votes" fill="#3b82f6" /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="flex w-full flex-col items-center overflow-auto rounded bg-white p-4 shadow">
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-700">Vote Distribution</h2>
        <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={chartData} dataKey="votes" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`} labelLine={false}>{chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={40} /></PieChart></ResponsiveContainer>
      </div>
    </div>
  );
}
