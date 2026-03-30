"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Archive, ArchiveRestore } from "lucide-react";
import { setPropertyActive } from "@/lib/actions";
import type { Property } from "@prisma/client";

export function PropertyHeader({ property }: { property: Property }) {
  const [isPending, startTransition] = useTransition();

  const handleToggleArchive = () => {
    startTransition(async () => {
      await setPropertyActive(property.id, !property.active);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Link href="/properties">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {property.nickname}
          </h1>
          <Badge
            variant={
              property.businessModel === "commission" ? "secondary" : "outline"
            }
          >
            {property.businessModel === "commission"
              ? "Commission"
              : "Master Lease"}
          </Badge>
          {!property.active && (
            <Badge variant="destructive">Archived</Badge>
          )}
        </div>
        {property.title && property.title !== property.nickname && (
          <p className="text-muted-foreground">{property.title}</p>
        )}
      </div>
      <div className="ml-auto">
        <Button
          variant={property.active ? "outline" : "default"}
          size="sm"
          onClick={handleToggleArchive}
          disabled={isPending}
        >
          {property.active ? (
            <>
              <Archive className="h-4 w-4 mr-2" />
              {isPending ? "Archiving..." : "Archive"}
            </>
          ) : (
            <>
              <ArchiveRestore className="h-4 w-4 mr-2" />
              {isPending ? "Restoring..." : "Restore"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
