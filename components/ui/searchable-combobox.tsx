"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Check,
  Plus,
  X,
  User,
  Stethoscope,
  Truck,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

export interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  iconType?: "user" | "doctor" | "supplier" | "tag" | "none";
  // Adding new item directly
  onAddNew?: (currentSearch: string) => void;
  addNewButtonText?: string;
  allowClear?: boolean;
  clearLabel?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Pilih atau cari...",
  searchPlaceholder = "Ketik untuk mencari...",
  emptyText = "Tidak ditemukan",
  className,
  disabled = false,
  iconType = "none",
  onAddNew,
  addNewButtonText = "Tambah Baru",
  allowClear = false,
  clearLabel = "-- Kosongkan Pilihan --",
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofocus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtered Options
  const filteredOptions = options.filter((opt) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const matchLabel = opt.label.toLowerCase().includes(q);
    const matchDesc = opt.description?.toLowerCase().includes(q) ?? false;
    const matchBadge = opt.badge?.toLowerCase().includes(q) ?? false;
    return matchLabel || matchDesc || matchBadge;
  });

  const renderIcon = () => {
    if (selectedOption?.icon) return selectedOption.icon;
    switch (iconType) {
      case "user":
        return <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case "doctor":
        return <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case "supplier":
        return <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case "tag":
        return <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border bg-white transition-all text-left shadow-2xs select-none",
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
            : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {renderIcon()}
          {selectedOption ? (
            <div className="truncate flex items-center gap-1.5 flex-1">
              <span className="font-semibold text-slate-800 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0",
                    selectedOption.badgeColor ||
                      "bg-emerald-100 text-emerald-800"
                  )}
                >
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption.description && (
                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                  • {selectedOption.description}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedOption && allowClear && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:text-slate-600 hover:bg-slate-100 rounded-md transition"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180 text-emerald-600"
            )}
          />
        </div>
      </button>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] max-w-full sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs py-1.5 pr-2 focus:outline-none text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-50">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl text-xs transition text-left",
                  !value
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-500 hover:bg-slate-100/70"
                )}
              >
                <span>{clearLabel}</span>
                {!value && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400">{emptyText}</p>
                {search.trim() && onAddNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNew(search.trim());
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambahkan &quot;{search.trim()}&quot;</span>
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-start justify-between gap-2 p-2 rounded-xl text-xs transition text-left",
                      isSelected
                        ? "bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 shadow-2xs"
                        : "text-slate-700 hover:bg-slate-100/70"
                    )}
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold block truncate">
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0",
                              opt.badgeColor ||
                                "bg-emerald-100 text-emerald-800"
                            )}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-tight">
                          {opt.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Add Button Footer */}
          {onAddNew && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Belum terdaftar?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew(search.trim());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewButtonText}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
