import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Home from "./app/page";
import GoogleAuthPanel from "./components/auth/GoogleAuthPanel";
import Response from "./shared/utils/Response";

const CreatePoll = lazy(() => import("./app/create-poll/page"));
const JoinSession = lazy(() => import("./app/vote/page"));
const PollPage = lazy(() => import("./app/poll/[code]/page"));

export default function App() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-gray-100 p-4">
      <Response />
      <header className="flex w-full max-w-3xl items-center justify-between">
        <Link to="/" className="font-mono text-xl font-extrabold tracking-tight">pollbuzz</Link>
        <nav className="flex gap-4 text-sm" aria-label="Main navigation">
          <Link to="/create-poll" className="hover:underline">Create</Link>
          <Link to="/vote" className="hover:underline">Join</Link>
        </nav>
      </header>
      <main className="flex w-full max-w-3xl flex-1 items-center justify-center">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-poll" element={<CreatePoll />} />
            <Route path="/vote" element={<JoinSession />} />
            <Route path="/poll/:code" element={<PollPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <GoogleAuthPanel />
    </div>
  );
}
