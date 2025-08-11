"use client";

import Cookies from "js-cookie";

export default function LogoutButton() {

  const handleLogout = () => {
    const ok = window.confirm("Are you sure you want to log out?");
    if (!ok) return;

    Cookies.remove("fm_token", { path: "/" });
    window.location.replace("/login")
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-3 py-2 text-white font-medium hover:bg-red-700"
      aria-label="Log out"
    >
      Logout
    </button>
  );
}
