"use client";

import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = options.findIndex((o) => o.value === value);
      let nextIndex = currentIndex;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      }

      if (nextIndex !== currentIndex) {
        onValueChange(options[nextIndex]!.value);
        // Focus the newly selected button
        const container = e.currentTarget;
        const buttons = container.querySelectorAll<HTMLButtonElement>(
          '[role="radio"]',
        );
        buttons[nextIndex]?.focus();
      }
    },
    [options, value, onValueChange],
  );

  return (
    <div
      role="radiogroup"
      onKeyDown={handleKeyDown}
      className={cn(
        "bg-muted inline-flex gap-0.5 rounded-lg p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
              isSelected
                ? "bg-background text-foreground shadow-sm dark:ring-1 dark:ring-white/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
