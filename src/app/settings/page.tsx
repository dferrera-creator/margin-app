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
import { RefreshCw, Database, CheckCircle2, XCircle, Clock } from "lucide-react";

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
      const res = await fetch("/api/sync/guesty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setSyncResult(
        data.error
          ? `Error: ${data.error}`
          : `${type} sync completed. ${data.recordsProcessed} records processed.`
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
              <Button
                onClick={() => handleSync("reservations")}
                disabled={isPending}
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                Sync Reservations
              </Button>
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
              <span>SQLite (dev.db)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guesty API</span>
              <Badge variant={process.env.NEXT_PUBLIC_GUESTY_CONFIGURED === "true" ? "default" : "secondary"}>
                {process.env.NEXT_PUBLIC_GUESTY_CONFIGURED === "true" ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Property-level expense defaults and business model settings can be
              configured on each property&apos;s detail page under Settings tab.
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
