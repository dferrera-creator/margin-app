import { format } from "date-fns";
import { formatCurrencyPrecise } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reservation } from "@prisma/client";

export function ReservationsTable({
  reservations,
}: {
  reservations: Reservation[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Reservations ({reservations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No reservations in this period
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
                {reservations.map((r) => (
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
      </CardContent>
    </Card>
  );
}
