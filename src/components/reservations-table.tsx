"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { formatCurrencyPrecise, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Reservation } from "@prisma/client";

export function ReservationsTable({
  reservations,
}: {
  reservations: Reservation[];
}) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Derive unique sources and statuses from the data
  const sources = useMemo(() => {
    const set = new Set(reservations.map((r) => r.source).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [reservations]);

  const statuses = useMemo(() => {
    const set = new Set(reservations.map((r) => r.status));
    return Array.from(set).sort();
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const matchesSearch =
        !search ||
        (r.guestName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.source || "").toLowerCase().includes(search.toLowerCase());
      const matchesSource = sourceFilter === "all" || r.source === sourceFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [reservations, search, sourceFilter, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Reservations ({filtered.length}
          {filtered.length !== reservations.length
            ? ` of ${reservations.length}`
            : ""})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guest name or source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {sources.length > 1 && (
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Sources</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            {statuses.length > 1 && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {reservations.length === 0
                ? "No reservations in this period"
                : "No reservations match your filters"}
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="text-left p-3 font-medium">Guest</th>
                    <th className="text-left p-3 font-medium">Check-in</th>
                    <th className="text-left p-3 font-medium">Check-out</th>
                    <th className="text-right p-3 font-medium">Nights</th>
                    <th className="text-right p-3 font-medium">Payout</th>
                    <th className="text-right p-3 font-medium">Owner Payout</th>
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-3">{r.guestName || "—"}</td>
                      <td className="p-3">
                        {format(new Date(r.checkIn), "MMM d, yyyy")}
                      </td>
                      <td className="p-3">
                        {format(new Date(r.checkOut), "MMM d, yyyy")}
                      </td>
                      <td className="p-3 text-right">{r.nightsBooked}</td>
                      <td className="p-3 text-right">
                        {formatCurrencyPrecise(r.payoutAmount)}
                      </td>
                      <td className="p-3 text-right">
                        {r.ownerPayoutAmount !== null
                          ? formatCurrencyPrecise(r.ownerPayoutAmount)
                          : "—"}
                      </td>
                      <td className="p-3">{r.source || "—"}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            r.status === "confirmed" || r.status === "checked_out"
                              ? "secondary"
                              : r.status === "canceled"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
