"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import LogoutButton from "./logout-button";

export default function SiteHeader() {
  const { token } = useAuth();
  if (!token) return null; 

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <span className="text-xl font-bold text-blue-600">FM Logo</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
            Teams
          </Link>
          <Link href="/market" className="text-gray-700 hover:text-blue-600 font-medium">
            Market
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
