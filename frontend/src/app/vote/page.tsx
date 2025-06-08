"use client";
import { useState } from "react";
import Image from "next/image";
import { Input } from "@shared/ui/Input";
import Link from "next/link";

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    if (error) setError("");
  };

  const handleJoinClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!code.trim()) {
      e.preventDefault();
      setError("Please enter a session code.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-center items-center gap-4">
        <Image
          src="/assets/collaboration.png"
          alt="Collaboration Icon"
          width={200}
          height={150}
        />
        <div className="flex justify-center items-center gap-4">
          <Input
            name="sessionCode"
            type="text"
            required
            value={code}
            onChange={handleInput}
            placeholder="Session Code"
            className="mt-1"
          />
          <Link
            href={`/poll/${code}`}
            className={`custom_go ${!code.trim() && 'cursor-not-allowed opacity-50'}`}
            onClick={handleJoinClick}
          >
            Join
          </Link>
        </div>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
}