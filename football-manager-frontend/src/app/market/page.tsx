// src/app/market/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { getListings, buyPlayer } from "../../lib/api";
import { Toaster, toast } from "react-hot-toast"; 

function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

function currency(n: number) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n); } catch { return `$${n.toFixed(2)}`; }
}

function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onClose }:{
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketPage() {
  const { token } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ teamName: "", playerName: "", maxPrice: "" });
  const [pendingBuy, setPendingBuy] = useState<{ id: number, label: string } | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const loadListings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getListings(token, filters);
      setListings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadListings(); }, [token]);

  const applyFilters = () => loadListings();
  const clearFilters = () => setFilters({ teamName: "", playerName: "", maxPrice: "" });

  const filtered = useMemo(() => listings, [listings]);

  const handleBuy = async (id: number) => {
    if (!token) return;
    try {
      setBuyingId(id);
      const l = listings.find(li => li.id === id);
      await toast.promise(
        buyPlayer(token, id),
        {
          loading: "Processing purchase…",
          success: `Bought ${l?.playerName ?? "player"} for ${currency(Number(l?.askingPrice ?? 0))} ✅`,
          error: (e) => e?.response?.data?.message || e?.message || "Purchase failed.",
        }
      );
      setListings((ls) => ls.filter((x) => x.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Purchase failed.";
      setError(msg);
    } finally {
      setBuyingId(null);
      setPendingBuy(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <Toaster position="top-right" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Transfer Market</h1>
          <p className="text-sm text-gray-600">Browse available players and purchase instantly.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="teamName">Team name</label>
            <input id="teamName" name="teamName" value={filters.teamName}
              onChange={(e)=> setFilters(f=>({...f, teamName: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g., Falcons"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="playerName">Player name</label>
            <input id="playerName" name="playerName" value={filters.playerName}
              onChange={(e)=> setFilters(f=>({...f, playerName: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g., John Doe"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="maxPrice">Max price</label>
            <input id="maxPrice" name="maxPrice" type="number" value={filters.maxPrice}
              onChange={(e)=> setFilters(f=>({...f, maxPrice: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g., 150000"/>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={applyFilters} className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-medium hover:bg-blue-700">Filter</button>
            <button onClick={clearFilters} className="w-full rounded-xl bg-gray-100 px-4 py-3 font-medium hover:bg-gray-200">Clear</button>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="p-6 animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-32 w-full bg-gray-200 rounded" />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="p-4">Player</th>
                <th className="p-4">Team</th>
                <th className="p-4">Asking Price</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="p-4 font-medium">{l.playerName}</td>
                  <td className="p-4">{l.sellerTeamName}</td>
                  <td className="p-4">{currency(Number(l.askingPrice))}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setPendingBuy({ id: l.id, label: `${l.playerName} for ${currency(Number(l.askingPrice))}` })}
                      disabled={buyingId === l.id}
                      className={cn("inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-white font-medium hover:bg-purple-700 disabled:opacity-50")}
                    >
                      {buyingId === l.id ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" fill="none" strokeWidth="4" className="opacity-75" /></svg>
                          Buying…
                        </>
                      ) : (
                        <>Buy</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No listings match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {loading ? (
          <div className="rounded-2xl border border-gray-100 p-4 animate-pulse">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="mt-3 h-4 w-24 bg-gray-200 rounded" />
            <div className="mt-3 h-10 w-full bg-gray-200 rounded" />
          </div>
        ) : filtered.length ? (
          filtered.map((l: any) => (
            <div key={l.id} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{l.playerName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{l.sellerTeamName}</p>
                </div>
                <p className="text-sm font-medium">{currency(Number(l.askingPrice))}</p>
              </div>
              <button
                onClick={() => setPendingBuy({ id: l.id, label: `${l.playerName} for ${currency(Number(l.askingPrice))}` })}
                disabled={buyingId === l.id}
                className="mt-3 w-full rounded-xl bg-purple-600 py-2 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {buyingId === l.id ? "Buying…" : "Buy"}
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-gray-100 p-6 text-center text-gray-500">No listings match your filters.</div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingBuy}
        title="Confirm purchase"
        description={pendingBuy?.label}
        confirmLabel="Buy"
        onConfirm={() => handleBuy(pendingBuy!.id)}
        onClose={() => setPendingBuy(null)}
      />
    </div>
  );
}
