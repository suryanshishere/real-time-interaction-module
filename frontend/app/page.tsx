'use client';
import { useState } from 'react';
import AdminPanel from './components/AdminPanel';
import JoinSession from './components/JoinSession';

export default function Home() {
  const [mode, setMode] = useState<'admin' | 'user' | null>(null);

  if (!mode)
    return (
      <div className="space-x-4">
        <button onClick={() => setMode('admin')} className="btn">Admin</button>
        <button onClick={() => setMode('user')} className="btn">User</button>
      </div>
    );

  return mode === 'admin' ? <AdminPanel /> : <JoinSession />;
}