'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PollQuestion from './PollQuestion';

export default function JoinSession() {
  const [code, setCode] = useState('');
  const [poll, setPoll] = useState<any>(null);
  const [error, setError] = useState('');

  const join = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/poll/${code}`);
      setPoll(res.data);
      setError('');
    } catch {
      setError('Invalid session code');
    }
  };

  return (
    <div className="space-y-4">
      {!poll ? (
        <>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Session Code"
            className="input"
          />
          <button onClick={join} className="btn-primary">Join</button>
          {error && <div className="text-red-500">{error}</div>}
        </>
      ) : (
        <PollQuestion poll={poll} />
      )}
    </div>
  );
}