"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  provider: any;
  session: { userId: string; userType: string } | null;
  isFullToday?: boolean;
}

// ── Nominatim helpers (OpenStreetMap, free, no API key) ───────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`,
    { headers: { "User-Agent": "QuickHire/1.0" } }
  );
  if (!res.ok) throw new Error("Geocode failed");
  const data = await res.json();
  // Build a readable Ghana address from the result
  const a = data.address ?? {};
  const parts = [
    a.road ?? a.pedestrian ?? a.footway,
    a.suburb ?? a.neighbourhood ?? a.quarter,
    a.city ?? a.town ?? a.village ?? a.county,
    a.state,
  ].filter(Boolean);
  return parts.join(", ") || data.display_name || "";
}

async function searchAddresses(query: string): Promise<{ display_name: string; place_id: number }[]> {
  if (query.length < 3) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=6&addressdetails=1&accept-language=en`,
    { headers: { "User-Agent": "QuickHire/1.0" } }
  );
  if (!res.ok) return [];
  return res.json();
}

// ── Address Input with autocomplete + live location ───────────────────────────
function AddressInput({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<{ display_name: string; place_id: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddresses(q);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 350);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    fetchSuggestions(e.target.value);
  }

  function pickSuggestion(name: string) {
    onChange(name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          onChange(addr);
          setSuggestions([]);
          setShowSuggestions(false);
        } catch {
          setLocError("Could not determine your address. Please type it manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("Location access denied. Please allow location or type your address.");
        } else {
          setLocError("Could not get your location. Please type your address.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div ref={wrapperRef}>
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium" style={{ color: "var(--bark, #2a1e15)" }}>
          Address <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 transition-opacity hover:opacity-80"
          style={{ background: "rgba(196,92,26,0.1)", color: "var(--ember, #c45c1a)", border: "1px solid rgba(196,92,26,0.2)" }}
        >
          {locating ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Locating…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
              Use my location
            </>
          )}
        </button>
      </div>

      {/* Input + dropdown */}
      <div className="relative">
        <input
          type="text"
          required
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="e.g. East Legon, Accra"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          style={{ border: "1.5px solid var(--border, #e8ddd5)" }}
        />

        {showSuggestions && (
          <ul className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg"
            style={{ border: "1px solid var(--border, #e8ddd5)", background: "var(--card-bg, #fff)" }}>
            {suggestions.map((s) => (
              <li key={s.place_id}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(s.display_name)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80 transition-opacity flex items-start gap-2"
                  style={{ color: "var(--warm-mid, #5a4a3d)", borderBottom: "1px solid var(--border, #e8ddd5)" }}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--ember, #c45c1a)" }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="line-clamp-2">{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {locError && (
        <p className="text-xs mt-1.5" style={{ color: "#dc2626" }}>{locError}</p>
      )}
    </div>
  );
}

// ── Main Booking Form ─────────────────────────────────────────────────────────
export default function BookingForm({ provider, session, isFullToday }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    serviceId: provider.services[0]?.id?.toString() ?? "",
    bookingDate: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div className="bg-white rounded-xl p-6 sticky top-24" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
        <p className="font-bold mb-2" style={{ color: "var(--bark, #2a1e15)" }}>Book this Professional</p>
        <p className="text-sm mb-4" style={{ color: "var(--sand, #8c7b6e)" }}>Sign in to book this service.</p>
        <Link
          href={`/auth?callbackUrl=/providers/${provider.id}`}
          className="block w-full text-white text-center py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "var(--ember, #c45c1a)" }}
        >
          Sign In to Book
        </Link>
      </div>
    );
  }

  if (!provider.isAvailable) {
    return (
      <div className="bg-white rounded-xl p-6 sticky top-24" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
        <p className="font-bold mb-2" style={{ color: "var(--bark, #2a1e15)" }}>Book this Professional</p>
        <p className="text-sm" style={{ color: "var(--sand, #8c7b6e)" }}>This provider is currently not taking new bookings.</p>
      </div>
    );
  }

  if (!provider.isVerified) {
    return (
      <div className="bg-white rounded-xl p-6 sticky top-24" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
        <p className="font-bold mb-2" style={{ color: "var(--bark, #2a1e15)" }}>Book this Professional</p>
        <p className="text-sm" style={{ color: "var(--sand, #8c7b6e)" }}>This provider is not yet verified. Bookings will be available once verified.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: provider.id,
        serviceId: parseInt(form.serviceId),
        bookingDate: form.bookingDate,
        address: form.address,
        notes: form.notes,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Booking failed. Try again.");
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 sticky top-24" style={{ border: "1px solid var(--border, #e8ddd5)" }}>
      <h2 className="font-bold text-lg mb-5" style={{ color: "var(--bark, #2a1e15)" }}>Book this Professional</h2>

      {isFullToday && (
        <div className="text-sm rounded-xl px-3 py-2.5 mb-4"
          style={{ background: "#fefce8", border: "1px solid #fef08a", color: "#854d0e" }}>
          This provider is fully booked today. You can still book for another day.
        </div>
      )}
      {error && (
        <div className="text-sm rounded-xl px-3 py-2.5 mb-4"
          style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {provider.services.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--bark, #2a1e15)" }}>Service</label>
            <select
              aria-label="Select service"
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              style={{ border: "1.5px solid var(--border, #e8ddd5)" }}
            >
              {provider.services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.serviceName} — GH₵ {Number(s.price).toFixed(0)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--bark, #2a1e15)" }}>Date &amp; Time</label>
          <input
            type="datetime-local"
            required
            aria-label="Booking date and time"
            value={form.bookingDate}
            onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            style={{ border: "1.5px solid var(--border, #e8ddd5)" }}
          />
        </div>

        {/* ── Address with live location + autocomplete ── */}
        <AddressInput
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--bark, #2a1e15)" }}>Notes <span style={{ color: "var(--sand, #8c7b6e)" }}>(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any special requirements…"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            style={{ border: "1.5px solid var(--border, #e8ddd5)", resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ background: "var(--ember, #c45c1a)" }}
        >
          {loading ? "Booking…" : "Request Booking"}
        </button>
      </form>
    </div>
  );
}
