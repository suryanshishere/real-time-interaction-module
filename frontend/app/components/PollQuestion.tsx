'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import LiveChart from './LiveChart';

let socket: Socket;

interface PollQuestionProps {
  poll: {
    sessionCode: string;
    question: string;
    options: string[];
    votes: number[];
  };
}

export default function PollQuestion({ poll }: PollQuestionProps) {
  const [votes, setVotes] = useState<number[]>(poll.votes);

  useEffect(() => {
    socket = io('http://localhost:4000');
    socket.emit('join', poll.sessionCode);
    socket.on('voteUpdate', setVotes);

    return () => {
      socket.disconnect();
    };
  }, [poll.sessionCode]);

  const castVote = (idx: number) => {
    socket.emit('castVote', { code: poll.sessionCode, optionIndex: idx });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{poll.question}</h2>
      <div className="grid grid-cols-1 gap-2">
        {poll.options.map((opt, i) => (
          <button key={i} onClick={() => castVote(i)} className="btn">
            {opt}
          </button>
        ))}
      </div>
      <LiveChart code={poll.sessionCode} options={poll.options} votes={votes} />
    </div>
  );
}