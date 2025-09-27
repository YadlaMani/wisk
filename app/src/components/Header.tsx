"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { ModeToggle } from "./ui/mode-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <img src="./logo.png" alt="Logo" className="h-8 w-8" />
          <Link
            href="/"
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-colors"
          >
            Wisk
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <SignedIn>
            <Link
              href="/academic"
              className="hover:text-primary transition-colors"
            >
              Academic Verification
            </Link>
            <Link href="/pan" className="hover:text-primary transition-colors">
              Pancard Verification
            </Link>
            <Link href="/name" className="hover:text-primary transition-colors">
              Name Verification
            </Link>
          </SignedIn>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <ModeToggle />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium px-3 py-2 rounded-md hover:bg-accent transition-colors">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="bg-primary text-white rounded-full font-medium text-sm h-10 px-5 cursor-pointer hover:bg-primary/90 transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
