"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RefreshCw, Database, CheckCircle2, XCircle, Clock, TableProperties } from "lucide-react";
import Link from "next/link";

interface SyncJob {
  id: string;
  source: string;
  syncType: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  recordsProcessed: number;
  errorLog: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);

  // Default date range: last 1 month
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const [fromDate, setFromDate] = useState(
    oneMonthAgo.toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);

  const loadSyncJobs = async () => {
    const res = await fetch("/api/sync/guesty");
    if (res.ok) {
      const data = await res.json();
      setSyncJobs(data.jobs || []);
    }
  };

  useEffect(() => {
    loadSyncJobs();
  }, []);

  const handleSync = (type: "listings" | "reservations") => {
    startTransition(async () => {
      setSyncResult(null);
      const payload: Record<string, string> = { type };
      if (type === "reservations") {
        payload.from = fromDate;
        payload.to = toDate;
      }
      const res = await fetch("/api/sync/guesty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSyncResult(
        data.error
          ? `Error: ${data.error}`
          : type === "reservations"
            ? `Reservations sync completed. ${data.recordsProcessed} records processed (${data.from} to ${data.to}).`
            : `Listings sync completed. ${data.recordsProcessed} records processed.`
      );
      loadSyncJobs();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage Guesty sync and global configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guesty Sync</CardTitle>
            <CardDescription>
              Import listings and reservations from Guesty. Credentials are
              configured via environment variables (GUESTY_API_KEY,
              GUESTY_API_SECRET).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={() => handleSync("listings")}
                disabled={isPending}
                variant="outline"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
                />
                Sync Listings
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Reservation Date Range</p>
              <div className="flex gap-3 items-end">
                <div className="space-y-1">
                  <Label htmlFor="sync-from" className="text-xs text-muted-foreground">From</Label>
                  <input
                    id="sync-from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sync-to" className="text-xs text-muted-foreground">To</Label>
                  <input
                    id="sync-to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  onClick={() => handleSync("reservations")}
                  disabled={isPending}
                  variant="outline"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Sync Reservations
                </Button>
              </div>
            </div>
            {syncResult && (
              <p
                className={`text-sm ${syncResult.startsWith("Error") ? "text-red-600" : "text-green-600"}`}
              >
                {syncResult}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database</span>
              <span>PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guesty API</span>
              <Badge variant={process.env.NEXT_PUBLIC_GUESTY_CONFIGURED === "true" ? "default" : "secondary"}>
                {process.env.NEXT_PUBLIC_GUESTY_CONFIGURED === "true" ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            <Separator />
            <Link href="/settings/bulk-edit">
              <Button variant="outline" className="w-full mt-2">
                <TableProperties className="h-4 w-4 mr-2" />
                Bulk Edit Expenses
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Edit estimated defaults or actual overrides for all properties at
              once. Individual property settings are on each property&apos;s detail
              page.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No sync jobs yet
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Records</th>
                    <th className="text-left p-3 font-medium">Started</th>
                    <th className="text-left p-3 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {syncJobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="p-3 capitalize">{job.syncType}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            job.status === "completed"
                              ? "default"
                              : job.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {job.status === "completed" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {job.status === "failed" && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {job.status === "running" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {job.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {job.recordsProcessed}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {job.startedAt
                          ? new Date(job.startedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-3 text-red-600 text-xs max-w-xs truncate">
                        {job.errorLog || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
