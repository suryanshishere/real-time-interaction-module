"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@shared/utils/axios-instance";
import Link from "next/link";

interface Poll {
  _id: string;
  sessionCode: string;
  question: string;
  options: string[];
  votes: number[];
  createdAt: string;
}

export default function UserCreatedPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get("/my-polls", { withCredentials: true })
      .then((res) => {
        setPolls(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load your polls.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="w-full text-center">Loading your polls...</div>;
  if (error) return <div className="text-red-600 w-full text-center">{error}</div>;

  if (polls.length === 0) return <div className="w-full text-center">You haven't created any polls yet.</div>;

  return (
    <div className="w-full mt-10">
      <h3 className="text-base text-center font-semibold mb-4">Your Created Polls History</h3>
      <ul className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = poll.votes.reduce((a, b) => a + b, 0);
          return (
            <li key={poll._id} className="border p-4 rounded shadow-sm">
              <Link href={`/poll/${poll.sessionCode}`} target="_blank" className="text-blue-600 underline">
                {poll.question}
              </Link>
              <p className="text-sm text-gray-600">Created on: {new Date(poll.createdAt).toLocaleDateString()}</p>
              <div className="mt-2">
                {poll.options.map((opt, idx) => {
                  const votesCount = poll.votes[idx] || 0;
                  const percent = totalVotes > 0 ? (votesCount / totalVotes) * 100 : 0;
                  return (
                    <div key={idx} className="mb-1">
                      <div className="flex justify-between text-sm">
                        <span>{opt}</span>
                        <span>{votesCount} votes ({percent.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-300 rounded">
                        <div
                          className="h-2 bg-blue-500 rounded"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
