"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
}

interface CustomDropdownProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  leftIcon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  helperText?: string;
  className?: string;
}

export function CustomDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "-- Select an option --",
  leftIcon,
  disabled = false,
  required = false,
  searchable = false,
  helperText,
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Focus search input when opening if searchable
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
      if (searchable || options.length > 6) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, searchable, options.length]);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const showSearch = searchable || options.length > 6;

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]"
          >
            {label} {required && <span className="text-[#7DD3FC]">*</span>}
          </label>
        </div>
      )}

      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full h-11 px-3.5 rounded-xl bg-[#080B10] hover:bg-[#102A43]/40 border ${
            isOpen ? "border-[#7DD3FC] ring-1 ring-[#7DD3FC]/40" : "border-[#243447]"
          } hover:border-[#7DD3FC]/60 text-xs text-left text-[#FFFFFF] flex items-center justify-between gap-3 transition-all focus:outline-none focus:border-[#7DD3FC] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
            {selectedOption?.icon ? (
              <span className="shrink-0">{selectedOption.icon}</span>
            ) : leftIcon ? (
              <span className="shrink-0 text-[#9CAFC3]">{leftIcon}</span>
            ) : null}

            <div className="min-w-0 truncate">
              {selectedOption ? (
                <span className="text-[#FFFFFF] font-medium truncate">
                  {selectedOption.label}
                </span>
              ) : (
                <span className="text-[#9CAFC3] truncate">{placeholder}</span>
              )}
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 text-[#9CAFC3] transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-[#7DD3FC]" : ""
            }`}
          />
        </button>

        {/* Dropdown Floating Menu */}
        {isOpen && (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-xl bg-[#080B10]/98 backdrop-blur-2xl border border-[#243447] shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 focus:outline-none"
          >
            {/* Inline search filter if many options */}
            {showSearch && (
              <div className="p-1 border-b border-[#243447]/60 mb-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CAFC3]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search options..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-[#102A43]/60 border border-[#243447] text-xs text-[#FFFFFF] placeholder:text-[#9CAFC3]/60 focus:outline-none focus:border-[#7DD3FC]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CAFC3] hover:text-[#FFFFFF] p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#9CAFC3]">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/25"
                        : isHighlighted
                        ? "bg-[#102A43]/60 text-[#7DD3FC]"
                        : "text-[#FFFFFF] hover:bg-[#102A43]/50 hover:text-[#7DD3FC]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate flex items-center gap-2">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtitle && (
                          <div className="text-[11px] text-[#9CAFC3] truncate mt-0.5">
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-[#7DD3FC] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {helperText && <p className="text-[11px] text-[#9CAFC3]">{helperText}</p>}
    </div>
  );
}
