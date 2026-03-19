"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveExpenseOverrides, resetExpenseOverride } from "@/lib/actions";
import { formatCurrencyPrecise } from "@/lib/utils";
import type { PropertyFinancialSummary } from "@/lib/types";
import { RotateCcw, Save } from "lucide-react";

interface Props {
  propertyId: string;
  monthKey: string;
  financials: PropertyFinancialSummary;
}

const EXPENSE_CATEGORIES = [
  { key: "electricity", label: "Electricity", unit: "per night" },
  { key: "water", label: "Water", unit: "per night" },
  { key: "gas", label: "Gas", unit: "per night" },
  { key: "internet", label: "Internet", unit: "fixed monthly" },
  { key: "hoa", label: "HOA Fees", unit: "fixed monthly" },
  { key: "housekeeping", label: "Housekeeping", unit: "per stay" },
  { key: "laundry", label: "Laundry", unit: "per stay" },
] as const;

export function ExpenseOverrideForm({ propertyId, monthKey, financials }: Props) {
  const [isPending, startTransition] = useTransition();
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      const expense = financials.expenses[cat.key as keyof typeof financials.expenses];
      if (expense.override !== null) {
        initial[cat.key] = String(expense.override);
      }
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      const data: Record<string, number | null> = {};
      for (const cat of EXPENSE_CATEGORIES) {
        const val = overrides[cat.key];
        data[`${cat.key}Override`] =
          val !== undefined && val !== "" ? parseFloat(val) : null;
      }
      await saveExpenseOverrides(propertyId, monthKey, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleReset = (category: string) => {
    startTransition(async () => {
      await resetExpenseOverride(propertyId, monthKey, category);
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Expense Overrides &mdash; {monthKey}
        </CardTitle>
        <CardDescription>
          Override estimated values with actual monthly amounts. Clear a field to
          revert to the estimated value.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {EXPENSE_CATEGORIES.map((cat) => {
            const expense =
              financials.expenses[cat.key as keyof typeof financials.expenses];
            const hasOverride =
              overrides[cat.key] !== undefined && overrides[cat.key] !== "";
            return (
              <div
                key={cat.key}
                className="grid grid-cols-[1fr_120px_120px_120px_auto] gap-3 items-center"
              >
                <div>
                  <Label className="text-sm font-medium">{cat.label}</Label>
                  <p className="text-xs text-muted-foreground">{cat.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">
                    Estimated
                  </p>
                  <p className="text-sm">
                    {formatCurrencyPrecise(expense.estimated)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Actual Override
                  </p>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="—"
                    value={overrides[cat.key] ?? ""}
                    onChange={(e) =>
                      setOverrides((prev) => ({
                        ...prev,
                        [cat.key]: e.target.value,
                      }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Final</p>
                  <p className="text-sm font-medium">
                    {formatCurrencyPrecise(expense.final)}
                  </p>
                </div>
                <div>
                  {hasOverride && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleReset(cat.key)}
                      title="Reset to estimated"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  {hasOverride ? (
                    <Badge variant="default" className="text-[10px] ml-1">
                      Override
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      Est.
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Overrides"}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">
                Saved successfully
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
