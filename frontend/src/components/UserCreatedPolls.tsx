import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@shared/utils/axios-instance";

interface Poll { id: string; sessionCode: string; question: string; options: string[]; votes: number[]; createdAt: string; }

export default function UserCreatedPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { axiosInstance.get("/me/polls").then(({ data }) => setPolls(data)).finally(() => setLoading(false)); }, []);
  if (loading) return <p>Loading your polls…</p>;
  if (!polls.length) return <p>You have not created any polls yet.</p>;
  return (
    <div className="mt-4 w-full">
      <h2 className="mb-4 text-center font-semibold">Your Polls</h2>
      <ul className="space-y-4">
        {polls.map((poll) => {
          const total = poll.votes.reduce((sum, count) => sum + count, 0);
          return <li key={poll.id} className="rounded border p-4 shadow-sm"><Link to={`/poll/${poll.sessionCode}`} className="text-blue-600 underline">{poll.question}</Link><p className="text-xs text-gray-600">{new Date(poll.createdAt).toLocaleDateString()}</p>{poll.options.map((option, index) => { const count = poll.votes[index] || 0; const percent = total ? count / total * 100 : 0; return <div key={index} className="mt-2"><div className="flex justify-between text-xs"><span>{option}</span><span>{count} ({percent.toFixed(1)}%)</span></div><div className="h-2 rounded bg-gray-300"><div className="h-2 rounded bg-blue-500" style={{ width: `${percent}%` }} /></div></div>; })}</li>;
        })}
      </ul>
    </div>
  );
}
