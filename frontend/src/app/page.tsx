"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

const letters = [
  { char: "p", color: "text-red-500" },
  { char: "o", color: "text-orange-500" },
  { char: "l", color: "text-yellow-500" },
  { char: "l", color: "text-green-500" },
  { char: "b", color: "text-blue-500" },
  { char: "u", color: "text-indigo-500" },
  { char: "z", color: "text-purple-500" },
  { char: "z", color: "text-pink-500" },
];

const animationClasses = [
  "animate-jump-sm",
  "animate-stretch-sm",
  "animate-glow-sm",
  "animate-grow-sm",
];

export default function Home() {
  const letterAnimations = useMemo(
    () =>
      letters.map(
        (_, idx) =>
          // cycle through animationClasses in order
          animationClasses[idx % animationClasses.length]
      ),
    []
  );

  return (
    <div className="flex flex-col sm:items-start justify-center">
      <div className="flex items-center justify-center gap-3">
        <h1 className="text-3xl font-extrabold font-mono flex gap-4">
          {letters.map((L, i) => (
            <span key={i} className={`${L.color} ${letterAnimations[i]}`}>
              {L.char}
            </span>
          ))}
        </h1>
        <Image
          src="/assets/homeVote.png"
          alt="Vote Illustration Icon"
          width={100}
          height={100}
          className="mb-2 -ml-4"
        />
      </div>
      <div className="text-center mr-14 -mt-4 sm:mr-0 sm:-mt-6 sm:-ml-6 z-10 flex text-xl flex-col items-center sm:flex-row justify-center gap-4">
        <Link href="/create-poll" className="custom_go w-full sm:w-auto">
          Create a poll
        </Link>
        <Link href="/vote" className="custom_go w-full sm:w-auto">
          Vote
        </Link>
      </div>
    </div>
  );
}
