"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, MapPin, X, Check } from "lucide-react";
import { type AddressSuggestion } from "@/app/api/address/autocomplete/route";

interface AddressAutocompleteInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
  country: "IN" | "GB";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function AddressAutocompleteInput({
  id = "address-autocomplete",
  label,
  value,
  onChange,
  onSelectSuggestion,
  country,
  placeholder = "Start typing your street address or locality...",
  required = false,
  disabled = false,
  helperText,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [hasSelected, setHasSelected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (q.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/address/autocomplete?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`
        );
        if (!res.ok) throw new Error("Autocomplete request failed");
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setIsOpen(data.suggestions.length > 0);
          setActiveIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [country]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    setHasSelected(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newVal.trim().length >= 3) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(newVal);
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelect = (item: AddressSuggestion) => {
    // Populate the input with the street or top address string
    const displayValue = item.street || item.locality || item.label;
    onChange(displayValue);
    setIsOpen(false);
    setSuggestions([]);
    setHasSelected(true);
    onSelectSuggestion(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && value.trim().length >= 3) {
        fetchSuggestions(value);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]"
        >
          {label} {required && <span className="text-[#7DD3FC]">*</span>}
        </label>
        {hasSelected && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> Auto-filled from OpenStreetMap
          </span>
        )}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !hasSelected) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          aria-activedescendant={
            activeIndex >= 0 ? `${id}-item-${activeIndex}` : undefined
          }
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC] transition-colors text-xs"
        />

        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3] pointer-events-none" />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-[#7DD3FC] animate-spin" />
          )}
          {value && !isLoading && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSuggestions([]);
                setIsOpen(false);
                setHasSelected(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear address"
              className="text-[#9CAFC3] hover:text-[#FFFFFF] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {helperText && <p className="text-[11px] text-[#9CAFC3]">{helperText}</p>}

      {/* Autocomplete Dropdown Listbox */}
      {isOpen && suggestions.length > 0 && (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl bg-[#080B10]/98 backdrop-blur-xl border border-[#243447] shadow-2xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CAFC3] flex items-center justify-between border-b border-[#243447]/60 pb-1">
            <span>Matching Addresses ({country === "IN" ? "India" : "UK"})</span>
            <span className="text-[9px] font-normal text-[#9CAFC3]/80">Use ↑↓ &amp; Enter</span>
          </div>

          {suggestions.map((item, index) => {
            const isSelected = index === activeIndex;
            return (
              <div
                key={item.id}
                id={`${id}-item-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(item)}
                className={`px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors flex items-start gap-2.5 ${
                  isSelected
                    ? "bg-[#102A43] text-[#7DD3FC]"
                    : "text-[#FFFFFF] hover:bg-[#102A43]/60 hover:text-[#7DD3FC]"
                }`}
              >
                <Search className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isSelected ? "text-[#7DD3FC]" : "text-[#9CAFC3]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {item.street || item.locality || item.label}
                  </div>
                  <div className="text-[11px] text-[#9CAFC3] truncate mt-0.5">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="px-2.5 py-1 text-[9px] text-[#9CAFC3]/60 text-right border-t border-[#243447]/60 pt-1">
            OpenStreetMap &amp; Photon Geocoding
          </div>
        </div>
      )}
    </div>
  );
}
