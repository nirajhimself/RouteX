import { useState, useEffect, useRef } from "react";
import { MapIcon } from "@heroicons/react/24/outline";
import { searchPlaces } from "../utils/geocode";

export default function PlaceSearch({ label, placeholder, value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounce search — wait 350ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchPlaces(query);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (place) => {
    setQuery(place.name);
    onChange(place.name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
  };

  const TYPE_ICON = {
    city: "🏙️",
    town: "🏘️",
    village: "🏡",
    administrative: "📍",
    state: "🗺️",
    road: "🛣️",
    suburb: "🏙️",
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label">{label}</label>
      <div className="relative">
        <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 z-10" />
        <input
          placeholder={placeholder}
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="input pl-9 pr-8"
          autoComplete="off"
        />
        {/* Loading spinner inside input */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin block" />
          </div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-dark-500 bg-dark-800 shadow-2xl overflow-hidden">
          {suggestions.map((place, i) => (
            <button
              key={i}
              onClick={() => handleSelect(place)}
              className="w-full text-left px-4 py-2.5 hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-0 flex items-start gap-3"
            >
              <span className="text-base mt-0.5 flex-shrink-0">
                {TYPE_ICON[place.type] || "📍"}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-200 truncate">{place.name}</p>
                <p className="text-[10px] text-slate-600 font-mono truncate">
                  {place.full}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-1.5 bg-dark-900 border-t border-dark-700">
            <p className="text-[9px] text-slate-700 font-mono">
              powered by OpenStreetMap
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
