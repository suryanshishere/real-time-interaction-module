"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import LiveChart from "@components/LiveChart";

let socket: Socket;

export default function PollPage() {
  const { code } = useParams() as { code: string };
  const [poll, setPoll] = useState<{
    sessionCode: string;
    question: string;
    options: string[];
    votes: number[];
  } | null>(null);

  const [error, setError] = useState("");
  const [votes, setVotes] = useState<number[] | null>(null);

  // Fetch poll data from backend
  useEffect(() => {
    if (!code) return;

    axios
      .get(`http://localhost:4000/api/poll/${code}`)
      .then((res) => {
        setPoll(res.data);
        setVotes(res.data.votes); // initial votes
      })
      .catch(() => setError("Poll not found."));
  }, [code]);

  // Setup socket connection and live updates
  useEffect(() => {
    if (!poll) return;

    socket = io("http://localhost:4000");

    socket.emit("join", poll.sessionCode);

    socket.on("voteUpdate", (newVotes: number[]) => {
      setVotes(newVotes);
    });

    return () => {
      socket.disconnect();
    };
  }, [poll]);

  const castVote = (idx: number) => {
    if (!poll) return;
    socket.emit("castVote", { code: poll.sessionCode, optionIndex: idx });
  };

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (!poll || votes === null) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center">{poll.question}</h2>

      <div className="grid grid-cols-1 gap-2">
        {poll.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => castVote(i)}
            className="btn py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {opt}
          </button>
        ))}
      </div>

      <LiveChart
        code={poll.sessionCode}
        options={poll.options}
        votes={votes}
      />
    </div>
  );
}
