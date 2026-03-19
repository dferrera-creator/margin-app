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
import { updateProperty } from "@/lib/actions";
import { Save } from "lucide-react";
import type { Property } from "@prisma/client";

export function PropertySettingsForm({ property }: { property: Property }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    nickname: property.nickname,
    businessModel: property.businessModel,
    commissionRate: property.commissionRate ?? "",
    fixedOwnerPayoutMonthly: property.fixedOwnerPayoutMonthly ?? "",
    internetMonthly: property.internetMonthly,
    hoaMonthly: property.hoaMonthly,
    defaultElectricityPerNight: property.defaultElectricityPerNight,
    defaultWaterPerNight: property.defaultWaterPerNight,
    defaultGasPerNight: property.defaultGasPerNight,
    defaultHousekeepingPerStay: property.defaultHousekeepingPerStay,
    defaultLaundryPerStay: property.defaultLaundryPerStay,
    notes: property.notes ?? "",
  });

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    startTransition(async () => {
      await updateProperty(property.id, {
        nickname: form.nickname,
        businessModel: form.businessModel,
        commissionRate:
          form.commissionRate !== "" ? Number(form.commissionRate) : null,
        fixedOwnerPayoutMonthly:
          form.fixedOwnerPayoutMonthly !== ""
            ? Number(form.fixedOwnerPayoutMonthly)
            : null,
        internetMonthly: Number(form.internetMonthly),
        hoaMonthly: Number(form.hoaMonthly),
        defaultElectricityPerNight: Number(form.defaultElectricityPerNight),
        defaultWaterPerNight: Number(form.defaultWaterPerNight),
        defaultGasPerNight: Number(form.defaultGasPerNight),
        defaultHousekeepingPerStay: Number(form.defaultHousekeepingPerStay),
        defaultLaundryPerStay: Number(form.defaultLaundryPerStay),
        notes: form.notes || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nickname</Label>
            <Input
              value={form.nickname}
              onChange={(e) => set("nickname", e.target.value)}
            />
          </div>
          <div>
            <Label>Business Model</Label>
            <select
              value={form.businessModel}
              onChange={(e) => set("businessModel", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="commission">Commission</option>
              <option value="master_lease">Master Lease</option>
            </select>
          </div>
          {form.businessModel === "commission" && (
            <div>
              <Label>Commission Rate (decimal, e.g. 0.20 for 20%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.commissionRate}
                onChange={(e) => set("commissionRate", e.target.value)}
              />
            </div>
          )}
          {form.businessModel === "master_lease" && (
            <div>
              <Label>Fixed Monthly Owner Payout ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.fixedOwnerPayoutMonthly}
                onChange={(e) =>
                  set("fixedOwnerPayoutMonthly", e.target.value)
                }
              />
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Defaults</CardTitle>
          <CardDescription>
            Default assumptions used for estimating expenses when no override
            exists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Housekeeping / Stay ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.defaultHousekeepingPerStay}
                onChange={(e) =>
                  set("defaultHousekeepingPerStay", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="text-xs">Laundry / Stay ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.defaultLaundryPerStay}
                onChange={(e) =>
                  set("defaultLaundryPerStay", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="text-xs">Electricity / Night ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.defaultElectricityPerNight}
                onChange={(e) =>
                  set("defaultElectricityPerNight", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="text-xs">Water / Night ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.defaultWaterPerNight}
                onChange={(e) =>
                  set("defaultWaterPerNight", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="text-xs">Gas / Night ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.defaultGasPerNight}
                onChange={(e) => set("defaultGasPerNight", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Internet / Month ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.internetMonthly}
                onChange={(e) => set("internetMonthly", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">HOA / Month ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.hoaMonthly}
                onChange={(e) => set("hoaMonthly", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2 flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Saved successfully</span>
        )}
      </div>
    </div>
  );
}
