"use client";

import { FolderGit2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useConnectRepository } from "@/features/repositories/hooks/use-repositories";

interface RepositoryConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepositoryConnectDialog({
  open,
  onOpenChange,
}: RepositoryConnectDialogProps) {
  const connect = useConnectRepository();
  const { data: projects = [] } = useProjects({ includeArchived: true });

  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [projectId, setProjectId] = useState("none");
  const [accessToken, setAccessToken] = useState("");
  const [step, setStep] = useState<"repo" | "auth">("repo");

  async function handleConnect() {
    await connect.mutateAsync({
      githubOwner: owner.trim(),
      githubRepo: repo.trim(),
      projectId: projectId === "none" ? null : projectId,
      accessToken: accessToken.trim() || null,
    });
    reset();
    onOpenChange(false);
  }

  function reset() {
    setOwner("");
    setRepo("");
    setProjectId("none");
    setAccessToken("");
    setStep("repo");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect GitHub repository</DialogTitle>
          <DialogDescription>
            Link a GitHub repository to scan and analyze.
          </DialogDescription>
        </DialogHeader>

        {step === "repo" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Repository
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="owner"
                  className="h-10 flex-1"
                />
                <span className="text-muted-foreground text-sm">/</span>
                <Input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="repo"
                  className="h-10 flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Link to project (optional)
              </Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                className="w-full rounded-xl"
                onClick={() => setStep("auth")}
                disabled={!owner.trim() || !repo.trim()}
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                GitHub Personal Access Token
              </Label>
              <Input
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="h-10 font-mono text-sm"
              />
              <p className="text-muted-foreground text-[11px]">
                Create a fine-grained token with <strong>repo</strong> scope
                at GitHub Developer Settings.
              </p>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep("repo")}
              >
                Back
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => void handleConnect()}
                disabled={connect.isPending}
              >
                {connect.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Connect {owner}/{repo}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
