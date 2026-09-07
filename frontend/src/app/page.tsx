import { Link } from "react-router-dom";

const letters = [
  ["p", "text-red-500"], ["o", "text-orange-500"], ["l", "text-yellow-500"],
  ["l", "text-green-500"], ["b", "text-blue-500"], ["u", "text-indigo-500"],
  ["z", "text-purple-500"], ["z", "text-pink-500"],
];
const animations = ["animate-jump-sm", "animate-stretch-sm", "animate-glow-sm", "animate-grow-sm"];

export default function Home() {
  return (
    <div className="flex flex-col justify-center sm:items-start">
      <div className="flex items-center justify-center gap-3">
        <h1 className="flex gap-4 font-mono text-3xl font-extrabold">
          {letters.map(([letter, color], index) => (
            <span key={index} className={`${color} ${animations[index % animations.length]}`}>{letter}</span>
          ))}
        </h1>
        <img src="/assets/homeVote.png" alt="Vote illustration" width={100} height={100} className="-ml-4 mb-2" />
      </div>
      <div className="z-10 -mt-4 mr-14 flex flex-col items-center justify-center gap-4 text-center text-xl sm:-ml-6 sm:-mt-6 sm:mr-0 sm:flex-row">
        <Link to="/create-poll" className="custom_go w-full sm:w-auto">Create a poll</Link>
        <Link to="/vote" className="custom_go w-full sm:w-auto">Vote</Link>
      </div>
    </div>
  );
}
