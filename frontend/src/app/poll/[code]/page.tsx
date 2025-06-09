"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import LiveChart from "@components/LiveChart";
import axiosInstance from "@shared/utils/axios-instance";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@shared/store";
import { triggerErrorMsg, triggerSuccessMsg } from "@shared/store/thunks/response-thunk";

let socket: Socket;

export default function PollPage() {
  const { code } = useParams() as { code: string };
  const [poll, setPoll] = useState<{
    sessionCode: string;
    question: string;
    options: string[];
    votes: number[];
  } | null>(null);
  const [votes, setVotes] = useState<number[] | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const errorMsg = useSelector((state: RootState) => state.response.onErrorMsg);

  // 1. Fetch poll data
  useEffect(() => {
    if (!code) return;

    axiosInstance
      .get(`/poll/${code}`)
      .then((res) => {
        setPoll(res.data);
        setVotes(res.data.votes);
      })
      .catch(() => {
        dispatch(triggerErrorMsg("Poll not found."));
      });
  }, [code, dispatch]);

  // 2. Setup Socket.IO
  useEffect(() => {
    if (!poll) return;

    socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000",
      {
        withCredentials: true,
        transports: ["websocket"],
      }
    );

    socket.emit("join", poll.sessionCode);

    // Handle incoming vote updates
    socket.on("voteUpdate", (newVotes: number[]) => {
      setVotes(newVotes);
    });

    // Handle vote errors
    socket.on("voteError", (msg: string) => {
      dispatch(triggerErrorMsg(msg ));
    });

    socket.on("voteSuccess", (msg: string) => {
      dispatch(triggerSuccessMsg(msg ));
    });

    return () => {
      socket.disconnect();
    };
  }, [poll, dispatch]);

  // 3. Emit vote
  const castVote = (idx: number) => {
    if (!poll) return;
    socket.emit("castVote", {
      code: poll.sessionCode,
      optionIndex: idx,
    });
  };

  // 4. Render UI
  if (!poll || votes === null) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center">{poll.question}</h2>

      {errorMsg && (
        <div className="text-center text-red-500 mt-2">{errorMsg}</div>
      )}

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
        options={poll.options.map((opt, i) => ({
          label: opt,
          votes: votes[i],
        }))}
      />
    </div>
  );
}
