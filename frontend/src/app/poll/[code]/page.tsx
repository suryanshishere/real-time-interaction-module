"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import LiveChart from "@components/LiveChart";
import axiosInstance from "@shared/utils/axios-instance";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@shared/store";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@shared/store/thunks/response-thunk";

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
  const [hasError, setHasError] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const errorMsg = useSelector((state: RootState) => state.response.onErrorMsg);
  const successMsg = useSelector((state: RootState) => state.response.onSuccessMsg);

  // Fetch poll data on mount
  useEffect(() => {
    if (!code) return;

    axiosInstance
      .get(`/poll/${code}`, { withCredentials: true })
      .then((res) => {
        setPoll(res.data);
        setVotes(res.data.votes);
      })
      .catch(() => {
        setHasError(true);
        dispatch(triggerErrorMsg("Poll not found or unauthorized."));
      });
  }, [code, dispatch]);

  // Setup socket connection
  useEffect(() => {
    if (!poll) return;

    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.emit("join", poll.sessionCode);

    socket.on("voteUpdate", (newVotes: number[]) => {
      setVotes(newVotes);
    });

    socket.on("voteError", (msg: string) => {
      dispatch(triggerErrorMsg(msg));
    });

    socket.on("voteSuccess", (msg: string) => {
      dispatch(triggerSuccessMsg(msg));
    });

    return () => {
      socket.disconnect();
    };
  }, [poll, dispatch]);

  // Cast vote with optimistic update
  const castVote = (idx: number) => {
    if (!poll || !votes || selectedVote !== null) return;

    setSelectedVote(idx); // this only affects current session

    setVotes((prevVotes) => {
      if (!prevVotes) return prevVotes;
      const updatedVotes = [...prevVotes];
      updatedVotes[idx] += 1;
      return updatedVotes;
    });

    socket.emit("castVote", {
      code: poll.sessionCode,
      optionIndex: idx,
    });
  };

  if (hasError) {
    return (
      <div className="text-center mt-8 text-red-500">
        {errorMsg || "Something went wrong loading the poll."}
      </div>
    );
  }

  if (!poll || votes === null) {
    return <div className="text-center mt-8">Loading poll...</div>;
  }

  return (
    <div className="w-full sm:w-[30rem] mx-auto my-8 flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-center">{poll.question}</h2>

      {errorMsg && <div className="text-center text-red-500 mt-2">{errorMsg}</div>}
      {successMsg && (
        <div className="text-center text-green-600 mt-2">{successMsg}</div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {poll.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => castVote(i)}
            disabled={selectedVote !== null}
            className={`custom_go p-2 rounded text-left ${
              selectedVote === i
                ? "bg-green-100 border border-green-500 text-green-800 font-medium"
                : "bg-white border border-gray-300"
            }`}
          >
            {opt}
            {selectedVote === i && (
              <span className="ml-2 text-green-700 font-medium">(You just voted this)</span>
            )}
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
