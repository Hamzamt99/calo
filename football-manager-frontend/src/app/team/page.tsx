// src/app/team/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { getTeam, listPlayer } from "../../lib/api";
import { socket } from "../../socket";
import { jwtDecode } from "jwt-decode";

interface DecodedToken { id: number }

// Simple className joiner
function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

// Price dialog (no external libs)
function PriceDialog({
  open,
  onClose,
  onConfirm,
  playerName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
  playerName: string;
}) {
  const [val, setVal] = useState("100000");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setVal("100000"); setErr(null); } }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold">List {playerName}</h3>
        <p className="text-sm text-gray-600 mt-1">Set an asking price to place this player on the market.</p>
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="price">Asking price</label>
          <input
            id="price"
            type="number"
            inputMode="decimal"
            min={1}
            className={cn("w-full rounded-xl border p-3 bg-white/60 outline-none focus:ring-2",
              err ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200")}
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button
            onClick={() => {
              const n = Number(val);
              if (!Number.isFinite(n) || n <= 0) { setErr("Enter a valid positive number."); return; }
              onConfirm(n);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            List on Market
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; player?: any }>(() => ({ open: false }));
  const [listingId, setListingId] = useState<number | null>(null);

  const fetchTeam = async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await getTeam(token);
      setTeam(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setTeam(null);
      } else {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchTeam();

    const decoded = jwtDecode<DecodedToken>(token);
    socket.connect();
    socket.emit("join", decoded.id);
    socket.on("team-ready", () => { fetchTeam(); });
    return () => { socket.off("team-ready"); socket.disconnect(); };
  }, [token]);

  const filtered = useMemo(() => {
    if (!team?.players) return [] as any[];
    const q = query.trim().toLowerCase();
    if (!q) return team.players;
    return team.players.filter((p: any) =>
      [p.name, p.position].some((v: string) => String(v).toLowerCase().includes(q))
    );
  }, [team, query]);

  const handleList = async (playerId: number, price: number) => {
    try {
      setListingId(playerId);
      await listPlayer(token!, playerId, price);
      // Optimistic removal from roster
      setTeam((t: any) => ({ ...t, players: t.players.filter((p: any) => p.id !== playerId) }));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setListingId(null);
      setDialog({ open: false });
    }
  };

  if (!token) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border bg-yellow-50 text-yellow-800 p-4">Please sign in to view your team.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-40 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
          Team creation in progress… We'll refresh when it's ready.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">{team.name}</h1>
          <p className="text-sm text-gray-600">Budget: ${Number(team.budget).toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-full sm:w-72 rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Search by name or position…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table (md+) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              <th className="p-4">Player</th>
              <th className="p-4">Position</th>
              <th className="p-4">Value</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50/60">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4"><span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{p.position}</span></td>
                <td className="p-4">${Number(p.market_value).toFixed(2)}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setDialog({ open: true, player: p })}
                    disabled={listingId === p.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                    )}
                  >
                    {listingId === p.id ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" fill="none" strokeWidth="4" className="opacity-75" /></svg>
                        Listing…
                      </>
                    ) : (
                      <>List</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No players match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filtered.map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.position}</p>
              </div>
              <p className="text-sm font-medium">${Number(p.market_value).toFixed(2)}</p>
            </div>
            <button
              onClick={() => setDialog({ open: true, player: p })}
              disabled={listingId === p.id}
              className="mt-3 w-full rounded-xl bg-green-600 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {listingId === p.id ? "Listing…" : "List on Market"}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-100 p-6 text-center text-gray-500">No players match your search.</div>
        )}
      </div>

      <div className="mt-6 text-right">
        <a href="/market" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
          Go to Market
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>

      <PriceDialog
        open={dialog.open}
        playerName={dialog.player?.name ?? "player"}
        onClose={() => setDialog({ open: false })}
        onConfirm={(price) => handleList(dialog.player!.id, price)}
      />
    </div>
  );
}
