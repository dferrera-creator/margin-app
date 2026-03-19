"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const defaultMonth = format(
    searchParams.get("month")
      ? new Date(searchParams.get("month")! + "-01")
      : now,
    "yyyy-MM"
  );

  const [month, setMonth] = useState(defaultMonth);
  const [customStart, setCustomStart] = useState(
    searchParams.get("start") || ""
  );
  const [customEnd, setCustomEnd] = useState(searchParams.get("end") || "");
  const [mode, setMode] = useState<"month" | "custom">(
    searchParams.get("start") ? "custom" : "month"
  );

  const applyMonth = (m: string) => {
    setMonth(m);
    const params = new URLSearchParams();
    params.set("month", m);
    router.push(`?${params.toString()}`);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    const params = new URLSearchParams();
    params.set("start", customStart);
    params.set("end", customEnd);
    router.push(`?${params.toString()}`);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1);
    const newDate = direction === -1 ? subMonths(d, 1) : new Date(d.setMonth(d.getMonth() + 1));
    applyMonth(format(newDate, "yyyy-MM"));
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant={mode === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("month")}
        >
          Monthly
        </Button>
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("custom")}
        >
          Custom Range
        </Button>
      </div>

      {mode === "month" ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="month"
              value={month}
              onChange={(e) => applyMonth(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Start</Label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <Label className="text-xs">End</Label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-36"
            />
          </div>
          <Button size="sm" onClick={applyCustomRange}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
