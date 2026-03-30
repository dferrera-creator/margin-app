"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  bulkSaveExpenseDefaults,
  bulkSaveExpenseOverrides,
  bulkSaveBusinessModels,
} from "@/lib/actions";
import type {
  BulkDefaultsRow,
  BulkOverridesRow,
  BulkBusinessModelRow,
} from "@/lib/actions";
import { Save, Copy } from "lucide-react";

// ─── Column definitions ───

const DEFAULT_COLUMNS = [
  { key: "defaultHousekeepingPerStay", label: "Housekeeping/Stay", short: "HK" },
  { key: "defaultLaundryPerStay", label: "Laundry/Stay", short: "Lnd" },
  { key: "defaultElectricityPerNight", label: "Electric/Night", short: "Elec" },
  { key: "defaultWaterPerNight", label: "Water/Night", short: "H2O" },
  { key: "defaultGasPerNight", label: "Gas/Night", short: "Gas" },
  { key: "internetMonthly", label: "Internet/Mo", short: "Net" },
  { key: "hoaMonthly", label: "HOA/Mo", short: "HOA" },
  { key: "pmsSoftwareMonthly", label: "PMS/Mo", short: "PMS" },
  { key: "autorankMonthly", label: "Autorank/Mo", short: "AR" },
  { key: "rmsSoftwareMonthly", label: "RMS/Mo", short: "RMS" },
  { key: "messagingSoftwareMonthly", label: "Messaging/Mo", short: "Msg" },
] as const;

const OVERRIDE_COLUMNS = [
  { key: "housekeepingOverride", label: "Housekeeping", short: "HK" },
  { key: "laundryOverride", label: "Laundry", short: "Lnd" },
  { key: "electricityOverride", label: "Electricity", short: "Elec" },
  { key: "waterOverride", label: "Water", short: "H2O" },
  { key: "gasOverride", label: "Gas", short: "Gas" },
  { key: "internetOverride", label: "Internet", short: "Net" },
  { key: "hoaOverride", label: "HOA", short: "HOA" },
  { key: "pmsSoftwareOverride", label: "PMS Software", short: "PMS" },
  { key: "autorankOverride", label: "Autorank", short: "AR" },
  { key: "rmsSoftwareOverride", label: "RMS Software", short: "RMS" },
  { key: "messagingSoftwareOverride", label: "Messaging", short: "Msg" },
] as const;

// ─── Types ───

interface PropertyData {
  id: string;
  nickname: string;
  businessModel: string;
  commissionRate: number | null;
  fixedOwnerPayoutMonthly: number | null;
  defaultHousekeepingPerStay: number;
  defaultLaundryPerStay: number;
  defaultElectricityPerNight: number;
  defaultWaterPerNight: number;
  defaultGasPerNight: number;
  internetMonthly: number;
  hoaMonthly: number;
  pmsSoftwareMonthly: number;
  autorankMonthly: number;
  rmsSoftwareMonthly: number;
  messagingSoftwareMonthly: number;
}

interface OverrideData {
  propertyId: string;
  housekeepingOverride: number | null;
  laundryOverride: number | null;
  electricityOverride: number | null;
  waterOverride: number | null;
  gasOverride: number | null;
  internetOverride: number | null;
  hoaOverride: number | null;
  pmsSoftwareOverride: number | null;
  autorankOverride: number | null;
  rmsSoftwareOverride: number | null;
  messagingSoftwareOverride: number | null;
}

interface Props {
  properties: PropertyData[];
  existingOverrides: OverrideData[];
  monthKey: string;
}

type TabMode = "business_model" | "defaults" | "overrides";

// ─── Component ───

export function BulkExpenseEditor({
  properties,
  existingOverrides,
  monthKey: initialMonthKey,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabMode>("business_model");
  const [monthKey, setMonthKey] = useState(initialMonthKey);

  // ── Business model state ──
  const [bizModels, setBizModels] = useState<
    Record<string, { businessModel: string; commissionRate: string; fixedOwnerPayoutMonthly: string }>
  >(() => {
    const state: Record<string, { businessModel: string; commissionRate: string; fixedOwnerPayoutMonthly: string }> = {};
    for (const prop of properties) {
      state[prop.id] = {
        businessModel: prop.businessModel,
        commissionRate: prop.commissionRate !== null ? String(prop.commissionRate) : "",
        fixedOwnerPayoutMonthly: prop.fixedOwnerPayoutMonthly !== null ? String(prop.fixedOwnerPayoutMonthly) : "",
      };
    }
    return state;
  });

  // ── Defaults grid state ──
  const [defaults, setDefaults] = useState<Record<string, Record<string, string>>>(() => {
    const state: Record<string, Record<string, string>> = {};
    for (const prop of properties) {
      state[prop.id] = {};
      for (const col of DEFAULT_COLUMNS) {
        state[prop.id][col.key] = String(
          prop[col.key as keyof PropertyData] ?? 0
        );
      }
    }
    return state;
  });

  // ── Overrides grid state ──
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>(() => {
    const state: Record<string, Record<string, string>> = {};
    for (const prop of properties) {
      const existing = existingOverrides.find((o) => o.propertyId === prop.id);
      state[prop.id] = {};
      for (const col of OVERRIDE_COLUMNS) {
        const val = existing?.[col.key as keyof OverrideData];
        state[prop.id][col.key] =
          val !== null && val !== undefined ? String(val) : "";
      }
    }
    return state;
  });

  const updateCell = useCallback(
    (propId: string, colKey: string, value: string) => {
      if (tab === "defaults") {
        setDefaults((prev) => ({
          ...prev,
          [propId]: { ...prev[propId], [colKey]: value },
        }));
      } else if (tab === "overrides") {
        setOverrides((prev) => ({
          ...prev,
          [propId]: { ...prev[propId], [colKey]: value },
        }));
      }
    },
    [tab]
  );

  const fillColumnDown = useCallback(
    (colKey: string) => {
      const grid = tab === "defaults" ? defaults : overrides;
      const firstPropId = properties[0]?.id;
      if (!firstPropId) return;
      const sourceValue = grid[firstPropId]?.[colKey] ?? "";

      if (tab === "defaults") {
        setDefaults((prev) => {
          const next = { ...prev };
          for (const prop of properties) {
            next[prop.id] = { ...next[prop.id], [colKey]: sourceValue };
          }
          return next;
        });
      } else {
        setOverrides((prev) => {
          const next = { ...prev };
          for (const prop of properties) {
            next[prop.id] = { ...next[prop.id], [colKey]: sourceValue };
          }
          return next;
        });
      }
    },
    [tab, defaults, overrides, properties]
  );

  const handleSave = () => {
    startTransition(async () => {
      setSaved(false);

      if (tab === "business_model") {
        const rows: BulkBusinessModelRow[] = properties.map((prop) => {
          const bm = bizModels[prop.id];
          return {
            propertyId: prop.id,
            businessModel: bm.businessModel,
            commissionRate: bm.commissionRate !== "" ? Number(bm.commissionRate) : null,
            fixedOwnerPayoutMonthly: bm.fixedOwnerPayoutMonthly !== "" ? Number(bm.fixedOwnerPayoutMonthly) : null,
          };
        });
        await bulkSaveBusinessModels(rows);
      } else if (tab === "defaults") {
        const rows: BulkDefaultsRow[] = properties.map((prop) => ({
          propertyId: prop.id,
          defaultHousekeepingPerStay: Number(defaults[prop.id].defaultHousekeepingPerStay) || 0,
          defaultLaundryPerStay: Number(defaults[prop.id].defaultLaundryPerStay) || 0,
          defaultElectricityPerNight: Number(defaults[prop.id].defaultElectricityPerNight) || 0,
          defaultWaterPerNight: Number(defaults[prop.id].defaultWaterPerNight) || 0,
          defaultGasPerNight: Number(defaults[prop.id].defaultGasPerNight) || 0,
          internetMonthly: Number(defaults[prop.id].internetMonthly) || 0,
          hoaMonthly: Number(defaults[prop.id].hoaMonthly) || 0,
          pmsSoftwareMonthly: Number(defaults[prop.id].pmsSoftwareMonthly) || 0,
          autorankMonthly: Number(defaults[prop.id].autorankMonthly) || 0,
          rmsSoftwareMonthly: Number(defaults[prop.id].rmsSoftwareMonthly) || 0,
          messagingSoftwareMonthly: Number(defaults[prop.id].messagingSoftwareMonthly) || 0,
        }));
        await bulkSaveExpenseDefaults(rows);
      } else {
        const rows: BulkOverridesRow[] = properties.map((prop) => {
          const row = overrides[prop.id];
          const parseVal = (v: string) =>
            v !== "" && v !== undefined ? Number(v) : null;
          return {
            propertyId: prop.id,
            housekeepingOverride: parseVal(row.housekeepingOverride),
            laundryOverride: parseVal(row.laundryOverride),
            electricityOverride: parseVal(row.electricityOverride),
            waterOverride: parseVal(row.waterOverride),
            gasOverride: parseVal(row.gasOverride),
            internetOverride: parseVal(row.internetOverride),
            hoaOverride: parseVal(row.hoaOverride),
            pmsSoftwareOverride: parseVal(row.pmsSoftwareOverride),
            autorankOverride: parseVal(row.autorankOverride),
            rmsSoftwareOverride: parseVal(row.rmsSoftwareOverride),
            messagingSoftwareOverride: parseVal(row.messagingSoftwareOverride),
          };
        });
        await bulkSaveExpenseOverrides(monthKey, rows);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const tabDescriptions: Record<TabMode, string> = {
    business_model: "Configure business model (Commission or Master Lease) and payout rates for all properties.",
    defaults: "Edit estimated expense rates (per-night, per-stay, monthly) across all properties at once.",
    overrides: "Push actual monthly costs across all properties. Leave fields empty to use estimated values.",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk Editor</CardTitle>
        <CardDescription>{tabDescriptions[tab]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab toggle + month selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border p-1">
            {(
              [
                { key: "business_model", label: "Business Model" },
                { key: "defaults", label: "Estimated Defaults" },
                { key: "overrides", label: "Actual Overrides" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.key}
                onClick={() => setTab(mode.key)}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-colors",
                  tab === mode.key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {tab === "overrides" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Month:</span>
              <input
                type="month"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
        </div>

        {/* ── Business Model Tab ── */}
        {tab === "business_model" && (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="text-left p-2 font-medium min-w-[160px]">
                    Property
                  </th>
                  <th className="p-2 font-medium min-w-[150px]">
                    Business Model
                  </th>
                  <th className="p-2 font-medium min-w-[140px]">
                    Commission Rate
                  </th>
                  <th className="p-2 font-medium min-w-[160px]">
                    Fixed Monthly Payout
                  </th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => {
                  const bm = bizModels[prop.id];
                  return (
                    <tr key={prop.id} className="border-b hover:bg-muted/20">
                      <td className="p-2 font-medium">
                        <span className="truncate max-w-[140px] inline-block">
                          {prop.nickname}
                        </span>
                      </td>
                      <td className="p-1">
                        <select
                          value={bm.businessModel}
                          onChange={(e) =>
                            setBizModels((prev) => ({
                              ...prev,
                              [prop.id]: {
                                ...prev[prop.id],
                                businessModel: e.target.value,
                              },
                            }))
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="commission">Commission</option>
                          <option value="master_lease">Master Lease</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={
                            bm.businessModel === "commission"
                              ? "e.g. 0.20"
                              : "N/A"
                          }
                          disabled={bm.businessModel !== "commission"}
                          value={bm.commissionRate}
                          onChange={(e) =>
                            setBizModels((prev) => ({
                              ...prev,
                              [prop.id]: {
                                ...prev[prop.id],
                                commissionRate: e.target.value,
                              },
                            }))
                          }
                          className={cn(
                            "h-8 text-sm",
                            bm.businessModel !== "commission" && "opacity-40"
                          )}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={
                            bm.businessModel === "master_lease"
                              ? "e.g. 2500"
                              : "N/A"
                          }
                          disabled={bm.businessModel !== "master_lease"}
                          value={bm.fixedOwnerPayoutMonthly}
                          onChange={(e) =>
                            setBizModels((prev) => ({
                              ...prev,
                              [prop.id]: {
                                ...prev[prop.id],
                                fixedOwnerPayoutMonthly: e.target.value,
                              },
                            }))
                          }
                          className={cn(
                            "h-8 text-sm",
                            bm.businessModel !== "master_lease" && "opacity-40"
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Defaults / Overrides Spreadsheet ── */}
        {(tab === "defaults" || tab === "overrides") && (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="text-left p-2 font-medium sticky left-0 bg-muted/50 min-w-[160px]">
                    Property
                  </th>
                  {(tab === "defaults" ? DEFAULT_COLUMNS : OVERRIDE_COLUMNS).map(
                    (col) => (
                      <th
                        key={col.key}
                        className="p-2 font-medium min-w-[100px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px]" title={col.label}>
                            {col.short}
                          </span>
                          <button
                            onClick={() => fillColumnDown(col.key)}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Fill all rows with first row's value"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => {
                  const grid =
                    tab === "defaults" ? defaults : overrides;
                  const columns =
                    tab === "defaults" ? DEFAULT_COLUMNS : OVERRIDE_COLUMNS;
                  return (
                    <tr
                      key={prop.id}
                      className="border-b hover:bg-muted/20"
                    >
                      <td className="p-2 font-medium sticky left-0 bg-background">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[120px]">
                            {prop.nickname}
                          </span>
                          <Badge
                            variant={
                              bizModels[prop.id]?.businessModel === "commission"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[10px] shrink-0"
                          >
                            {bizModels[prop.id]?.businessModel === "commission"
                              ? "Comm"
                              : "ML"}
                          </Badge>
                        </div>
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="p-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={tab === "overrides" ? "—" : "0"}
                            value={grid[prop.id]?.[col.key] ?? ""}
                            onChange={(e) =>
                              updateCell(prop.id, col.key, e.target.value)
                            }
                            className="h-8 text-xs text-center w-[90px]"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending
              ? "Saving..."
              : tab === "business_model"
                ? "Save All Business Models"
                : tab === "defaults"
                  ? "Save All Defaults"
                  : `Save All Overrides (${monthKey})`}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">
              Saved {properties.length} properties successfully
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
