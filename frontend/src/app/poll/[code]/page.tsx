import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import axiosInstance from "@shared/utils/axios-instance";
import type { AppDispatch } from "@shared/store";
import { triggerErrorMsg, triggerSuccessMsg } from "@shared/store/thunks/response-thunk";
import LiveChart from "@components/LiveChart";
import Seo from "@shared/utils/Seo";

interface Poll { sessionCode: string; question: string; options: string[]; votes: number[]; }

export default function PollPage() {
  const { code = "" } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<number | undefined>(undefined);
  const normalizedCode = code.toUpperCase();

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/polls/${normalizedCode}`).then(({ data }) => { setPoll(data); setVotes(data.votes); }).catch((error) => dispatch(triggerErrorMsg(error.response?.data?.error?.message || "Poll could not be loaded."))).finally(() => setLoading(false));
  }, [dispatch, normalizedCode]);

  useEffect(() => {
    if (!poll) return;
    let disposed = false;
    let socket: WebSocket | null = null;
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${window.location.host}/api/polls/${poll.sessionCode}/live`);
      socket.onopen = () => { reconnectAttempt.current = 0; setConnected(true); };
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as { type?: string; votes?: number[] };
        if ((message.type === "poll.snapshot" || message.type === "poll.votes") && Array.isArray(message.votes)) setVotes(message.votes);
      };
      socket.onclose = () => {
        setConnected(false);
        if (disposed) return;
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current++, 15000);
        reconnectTimer.current = window.setTimeout(connect, delay);
      };
    };
    connect();
    return () => { disposed = true; if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current); socket?.close(); };
  }, [poll]);

  const chartOptions = useMemo(() => poll?.options.map((label, index) => ({ label, votes: votes[index] || 0 })) || [], [poll, votes]);
  const castVote = async (optionIndex: number) => {
    try {
      const { data } = await axiosInstance.post(`/polls/${normalizedCode}/votes`, { optionIndex });
      setSelectedVote(optionIndex);
      setVotes(data.votes);
      dispatch(triggerSuccessMsg(data.message));
    } catch (error: any) {
      dispatch(triggerErrorMsg(error.response?.data?.error?.message || "Vote could not be submitted."));
    }
  };

  const seo = (
    <Seo
      title={poll ? `${poll.question} — PollBuzz` : "Poll — PollBuzz"}
      description="Vote on this live PollBuzz poll and watch results update in real time."
      path={`/poll/${normalizedCode}`}
      noindex
    />
  );

  if (loading) return <>{seo}<p>Loading poll…</p></>;
  if (!poll) return <>{seo}<p className="text-red-600">Poll not found.</p></>;
  return (
    <section className="mx-auto my-8 flex w-full max-w-[30rem] flex-col gap-6">
      {seo}
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{poll.question}</h1>
        <p className={`mt-1 text-xs ${connected ? "text-green-700" : "text-amber-700"}`}>{connected ? "Live updates connected" : "Reconnecting live updates…"}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {poll.options.map((option, index) => (
          <button key={index} type="button" onClick={() => void castVote(index)} disabled={selectedVote !== null} className={`custom_go rounded p-2 text-left disabled:cursor-not-allowed disabled:opacity-70 ${selectedVote === index ? "font-medium text-green-800" : ""}`}>{option}{selectedVote === index && <span className="ml-2">(your vote)</span>}</button>
        ))}
      </div>
      <LiveChart options={chartOptions} />
    </section>
  );
}
