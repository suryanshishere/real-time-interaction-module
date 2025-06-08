import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center gap-4">
      <Link href="/create-poll" className="custom_go text-xl">
        Create a poll
      </Link>
      <Link href="/vote" className="custom_go text-xl">
        Vote
      </Link>
      <Image
        src="/assets/homeVote.png"
        alt="Vote Illustration Icon"
        width={100}
        height={100}
        className="mb-8 -ml-4"
      />
    </div>
  );
}
