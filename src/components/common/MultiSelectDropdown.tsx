"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export interface MultiSelectOption {
  id: string;
  name: string;
  subtitle?: string;
  avatar?: string;
  disabled?: boolean;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  maxHeight?: string;
  searchable?: boolean;
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  label,
  disabled = false,
  maxHeight = "300px",
  searchable = true,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOptions = options.filter((opt) => selected.includes(opt.id));

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const removeOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== id));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}

      {/* Selected Items Display */}
      <div
        className={`relative min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${isOpen ? "ring-2 ring-ring" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 items-center pr-8">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <div
                key={opt.id}
                className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium"
              >
                {opt.avatar && (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                    {opt.avatar}
                  </div>
                )}
                <span>{opt.name}</span>
                <button
                  type="button"
                  onClick={(e) => removeOption(opt.id, e)}
                  className="hover:bg-primary/20 rounded-sm p-0.5"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Dropdown Icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              className="hover:bg-muted rounded-sm p-1"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-lg">
          {searchable && (
            <div className="p-2 border-b border-border">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer ${
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent"
                    } ${isSelected ? "bg-accent" : ""}`}
                    onClick={() => !option.disabled && toggleOption(option.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-input"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>

                    {option.avatar && (
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {option.avatar}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.name}</div>
                      {option.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedOptions.length > 0 && (
            <div className="p-2 border-t border-border bg-muted/50">
              <div className="text-xs text-muted-foreground">
                {selectedOptions.length} selected
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
