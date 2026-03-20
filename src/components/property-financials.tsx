import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyPrecise, formatPercent, cn } from "@/lib/utils";
import type { PropertyFinancialSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function PropertyFinancials({
  financials,
}: {
  financials: PropertyFinancialSummary;
}) {
  const f = financials;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Gross Payout" value={formatCurrencyPrecise(f.grossPayout)} />
          <Row label="Owner Payout" value={formatCurrencyPrecise(f.ownerPayout)} />
          <Separator />
          <Row
            label="Delmar Revenue"
            value={formatCurrencyPrecise(f.delmarRevenue)}
            bold
          />
        </CardContent>
      </Card>

      {/* Booking Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Total Reservations" value={String(f.totalReservations)} />
          <Row label="Nights Booked" value={String(f.nightsBooked)} />
          <Row label="Stays Booked" value={String(f.staysBooked)} />
          <Row label="Business Model" value={f.businessModel === "commission" ? "Commission" : "Master Lease"} />
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operating Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(f.expenses).map(([key, val]) => {
            const labels: Record<string, string> = {
              housekeeping: "Housekeeping",
              laundry: "Laundry",
              electricity: "Electricity",
              water: "Water",
              gas: "Gas",
              internet: "Internet",
              hoa: "HOA Fees",
              pmsSoftware: "PMS Software",
              autorank: "Autorank",
              rmsSoftware: "RMS Software",
              messagingSoftware: "Messaging Software",
            };
            return (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm">
                {labels[key] || key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatCurrencyPrecise(val.final)}
                </span>
                {val.override !== null ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Override
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    Est.
                  </Badge>
                )}
              </div>
            </div>
            );
          })}
          <Separator />
          <Row
            label="Total Operating Expenses"
            value={formatCurrencyPrecise(f.totalOperatingExpenses)}
            bold
          />
        </CardContent>
      </Card>

      {/* Margin Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utility Margin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Delmar Revenue" value={formatCurrencyPrecise(f.delmarRevenue)} />
          <Row
            label="Operating Expenses"
            value={`(${formatCurrencyPrecise(f.totalOperatingExpenses)})`}
          />
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Net Utility Margin</span>
            <span
              className={cn(
                "text-lg font-bold",
                f.netUtilityMargin >= 0 ? "text-green-700" : "text-red-600"
              )}
            >
              {formatCurrencyPrecise(f.netUtilityMargin)}
            </span>
          </div>
          <Separator />
          <Row
            label="Margin % (on Gross)"
            value={formatPercent(f.utilityMarginPercentGross)}
          />
          <Row
            label="Margin % (on Delmar Rev)"
            value={formatPercent(f.utilityMarginPercentDelmar)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn("text-sm", bold && "font-bold")}>{label}</span>
      <span className={cn("text-sm", bold && "font-bold")}>{value}</span>
    </div>
  );
}
