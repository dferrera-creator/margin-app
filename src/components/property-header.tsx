import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Property } from "@prisma/client";

export function PropertyHeader({ property }: { property: Property }) {
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
        </div>
        {property.title && property.title !== property.nickname && (
          <p className="text-muted-foreground">{property.title}</p>
        )}
      </div>
    </div>
  );
}
