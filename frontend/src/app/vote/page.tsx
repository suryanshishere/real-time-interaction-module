import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@shared/ui/Input";
import Seo from "@shared/utils/Seo";

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const normalized = code.trim().toUpperCase();
  return (
    <div className="space-y-4">
      <Seo
        title="Join a Poll — Vote on PollBuzz"
        description="Enter a session code to join a live poll and cast your vote. See real-time results update instantly as others vote."
        path="/vote"
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <img src="/assets/collaboration.png" alt="People collaborating" width={200} height={150} />
        <div className="flex items-center justify-center gap-4">
          <Input name="sessionCode" type="text" required value={code} maxLength={6} onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(""); }} placeholder="Session Code" className="mt-1 uppercase" />
          <Link to={`/poll/${normalized}`} className={`custom_go ${!normalized ? "cursor-not-allowed opacity-50" : ""}`} onClick={(event) => { if (!normalized) { event.preventDefault(); setError("Please enter a session code."); } }}>Join</Link>
        </div>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
}
