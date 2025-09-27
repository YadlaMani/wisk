"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">
        <Link
          href="/"
          className="text-[30px] font-bold tracking-tight hover:opacity-80 "
        >
          Wisk
        </Link>

        <nav className="flex items-center gap-4">
          <SignedIn>
            <ul className="hidden sm:flex items-center gap-6 text-sm font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-[#6c47ff]">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-[#6c47ff]">
                  Explore
                </Link>
              </li>
            </ul>

            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-100">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-11 px-5 cursor-pointer hover:bg-[#5936d9] transition">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
