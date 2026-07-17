"use client";

import {
  GitBranch,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDisconnectRepository,
  useTriggerScan,
} from "@/features/repositories/hooks/use-repositories";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RepositoryConnection } from "@/features/repositories/api/repositories-api";

interface RepositoryCardProps {
  connection: RepositoryConnection;
}

export function RepositoryCard({ connection }: RepositoryCardProps) {
  const triggerScan = useTriggerScan();
  const disconnect = useDisconnectRepository();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const meta = connection.repoInfo as Record<string, unknown> | null;
  const stars = (meta?.stars as number) ?? 0;
  const description = (meta?.description as string) ?? null;
  const language = (meta?.language as string) ?? null;
  const isPrivate = (meta?.isPrivate as boolean) ?? false;

  return (
    <>
      <Card className="border-border bg-card shadow-soft hover:border-muted-foreground/30 rounded-2xl transition-colors">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <GitBranch className="text-muted-foreground size-4 shrink-0" />
              <Link
                href={`/repositories/${connection.id}`}
                className="truncate text-sm font-semibold hover:underline"
              >
                {connection.githubOwner}/{connection.githubRepo}
              </Link>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  isPrivate
                    ? "bg-muted text-muted-foreground"
                    : "bg-success/10 text-success",
                )}
              >
                {isPrivate ? "Private" : "Public"}
              </span>
            </div>
            {description && (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                {description}
              </p>
            )}
            <div className="text-muted-foreground mt-1.5 flex items-center gap-3 text-xs">
              {language && (
                <span className="flex items-center gap-1">
                  <span className="bg-primary size-2 rounded-full" />
                  {language}
                </span>
              )}
              {stars > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-3" /> {stars}
                </span>
              )}
              {connection.lastSyncedAt && (
                <span>
                  Scanned {formatRelative(connection.lastSyncedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg text-xs"
              onClick={() =>
                triggerScan.mutate({ connectionId: connection.id })
              }
              disabled={triggerScan.isPending}
            >
              {triggerScan.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Scan
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8 rounded-lg"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection and all associated scan data
              for{" "}
              <strong>
                {connection.githubOwner}/{connection.githubRepo}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnect.mutate(connection.id)}
              className="bg-danger hover:bg-danger/80"
            >
              {disconnect.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
