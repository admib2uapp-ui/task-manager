"use client";

import {
  ExternalLink,
  FolderGit2,
  GitBranch,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth-storage";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { githubApi } from "@/features/github/api/github-api";
import {
  useDisconnectGithub,
  useGithubStatus,
  useQuickConnect,
} from "@/features/github/hooks/use-github";
import { useRepositories } from "@/features/repositories/hooks/use-repositories";
import { useTriggerScan } from "@/features/repositories/hooks/use-repositories";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import type { GithubRepo } from "@/features/github/api/github-api";
import type { Project, Task } from "@/types/domain";

function GithubLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof GitBranch;
  label: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="border-border text-muted-foreground hover:border-primary/40 hover:text-primary inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors"
    >
      <Icon className="size-3.5" /> {label}
      <ExternalLink className="size-3" />
    </span>
  );
}

function LinkedProjects({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="border-border bg-card shadow-soft hover:border-muted-foreground/30 rounded-2xl transition-colors">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </p>
              </div>
              {project.repositoryUrl && (
                <GithubLink
                  href={project.repositoryUrl}
                  icon={GitBranch}
                  label="Repo"
                />
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function LinkedTasks({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="border-border bg-card shadow-soft hover:border-muted-foreground/30 rounded-2xl transition-colors"
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{task.title}</p>
              {task.project && (
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  {task.project.name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {task.githubRepoUrl && (
                <GithubLink
                  href={task.githubRepoUrl}
                  icon={GitBranch}
                  label="Repo"
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GitHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useGithubStatus();
  const { data: connections = [], isLoading: connsLoading } = useRepositories();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects({
    includeArchived: true,
  });
  const disconnect = useDisconnectGithub();
  const quickConnect = useQuickConnect();
  const triggerScan = useTriggerScan();

  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [connectingRepo, setConnectingRepo] = useState<string | null>(null);

  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (connectedParam === "1") {
      refetchStatus();
    }
  }, [connectedParam, refetchStatus]);

  useEffect(() => {
    if (errorParam) {
      const messages: Record<string, string> = {
        github_connect: "Failed to connect GitHub account. Please try again.",
        user_not_found: "User account not found. Please log in again.",
      };
      const msg = messages[errorParam] || "An error occurred.";
      toast.error(msg);
    }
  }, [errorParam]);

  useEffect(() => {
    if (status?.connected) {
      setReposLoading(true);
      githubApi
        .repos(searchQuery || undefined)
        .then((data) => setRepos(data))
        .catch(() => setRepos([]))
        .finally(() => setReposLoading(false));
    }
  }, [status?.connected, searchQuery]);

  const handleConnectRepo = async (owner: string, repo: string) => {
    setConnectingRepo(`${owner}/${repo}`);
    try {
      const result: unknown = await quickConnect.mutateAsync({ owner, repo });
      const conn = result as { id: string };
      triggerScan.mutate({ connectionId: conn.id });
      router.push(`/repositories/${conn.id}`);
    } catch {
      setConnectingRepo(null);
    }
  };

  const linkedTasks = (tasks ?? []).filter(
    (t: Task) =>
      t.githubRepoUrl || t.githubIssueUrl || t.githubPrUrl || t.githubBranch,
  );
  const linkedProjects = (projects ?? []).filter(
    (p: Project) => p.repositoryUrl,
  );
  const connectedRepoNames = new Set(
    connections.map((c) => `${c.githubOwner}/${c.githubRepo}`),
  );

  const isLoading = statusLoading;

  return (
    <PageContainer>
      <PageHeader
        title="GitHub"
        description={
          status?.connected
            ? `Connected as ${status.login}`
            : "Connect your GitHub account to browse and analyze repositories."
        }
        actions={
          status?.connected && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg text-xs"
              onClick={() => setDisconnectOpen(true)}
            >
              <LogOut className="size-3.5" /> Disconnect
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !status?.connected ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="bg-muted text-muted-foreground grid size-16 place-items-center rounded-2xl">
              <FolderGit2 className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Connect GitHub Account</h3>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Authorize Orbit to access your public repositories. You&apos;ll be
                able to browse, connect, and AI-analyze repos directly from here.
              </p>
            </div>
            <button
              onClick={() => {
                window.location.href = `${githubApi.connectUrl()}?token=${getAccessToken()}`;
              }}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
            >
              <FolderGit2 className="size-4" />
              Connect GitHub Account
            </button>
            <p className="text-muted-foreground text-xs">
              Only <code className="bg-muted rounded px-1">public_repo</code>{" "}
              access is requested. We never store your code — only metadata and
              analysis results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="repos" className="w-full">
          <TabsList variant="line" className="mb-6 gap-1">
            <TabsTrigger value="repos" className="gap-1.5">
              <FolderGit2 className="size-4" /> My Repos
              {repos.length > 0 && (
                <span className="bg-muted text-muted-foreground ml-1 rounded-full px-1.5 text-[10px]">
                  {repos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analyzed" className="gap-1.5">
              <Sparkles className="size-4" /> Analyzed
              {connections.length > 0 && (
                <span className="bg-primary/20 text-primary ml-1 rounded-full px-1.5 text-[10px]">
                  {connections.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="linked" className="gap-1.5">
              <GitBranch className="size-4" /> Linked
              {(linkedProjects.length + linkedTasks.length) > 0 && (
                <span className="bg-muted text-muted-foreground ml-1 rounded-full px-1.5 text-[10px]">
                  {linkedProjects.length + linkedTasks.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repos">
            <div className="mb-4">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            {reposLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : repos.length > 0 ? (
              <div className="space-y-3">
                {repos.map((repo) => {
                  const isConnected = connectedRepoNames.has(repo.fullName);
                  return (
                    <Card
                      key={repo.id}
                      className="border-border bg-card shadow-soft hover:border-muted-foreground/30 rounded-2xl transition-colors"
                    >
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FolderGit2 className="text-muted-foreground size-4 shrink-0" />
                            <span className="truncate text-sm font-semibold">
                              {repo.fullName}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                repo.isPrivate
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-emerald-500/10 text-emerald-400",
                              )}
                            >
                              {repo.isPrivate ? "Private" : "Public"}
                            </span>
                          </div>
                          {repo.description && (
                            <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                              {repo.description}
                            </p>
                          )}
                          <div className="text-muted-foreground mt-1.5 flex items-center gap-3 text-xs">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span className="bg-primary size-2 rounded-full" />
                                {repo.language}
                              </span>
                            )}
                            {repo.stars > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="size-3" /> {repo.stars}
                              </span>
                            )}
                            {repo.updatedAt && (
                              <span>
                                Updated {formatRelative(repo.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isConnected ? (
                            <Link href={`/repositories/${connections.find((c) => c.githubOwner + "/" + c.githubRepo === repo.fullName)?.id ?? ""}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 rounded-lg text-xs"
                              >
                                <Sparkles className="size-3.5" /> View Analysis
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 rounded-lg text-xs"
                              onClick={() =>
                                handleConnectRepo(repo.owner, repo.name)
                              }
                              disabled={connectingRepo === `${repo.owner}/${repo.name}`}
                            >
                              {connectingRepo === `${repo.owner}/${repo.name}` ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />{" "}
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Zap className="size-3.5" /> Connect & Analyze
                                </>
                              )}
                            </Button>
                          )}
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="No repositories found"
                description="Try a different search term."
              />
            )}
          </TabsContent>

          <TabsContent value="analyzed">
            {connsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-3">
                {connections.map((conn) => {
                  const meta = conn.repoInfo as Record<string, unknown> | null;
                  const stars = (meta?.stars as number) ?? 0;
                  const description = (meta?.description as string) ?? null;
                  const language = (meta?.language as string) ?? null;
                  return (
                    <Link
                      key={conn.id}
                      href={`/repositories/${conn.id}`}
                    >
                      <Card className="border-border bg-card shadow-soft hover:border-muted-foreground/30 rounded-2xl transition-colors">
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Sparkles className="text-purple-400 size-4 shrink-0" />
                              <span className="truncate text-sm font-semibold">
                                {conn.githubOwner}/{conn.githubRepo}
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
                              {conn.lastSyncedAt && (
                                <span>
                                  Scanned {formatRelative(conn.lastSyncedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 rounded-lg text-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                triggerScan.mutate({ connectionId: conn.id });
                              }}
                            >
                              <RefreshCw className="size-3.5" /> Re-scan
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No analyzed repositories"
                description="Browse 'My Repos', pick one, and click 'Connect & Analyze' to get AI insights."
              />
            )}
          </TabsContent>

          <TabsContent value="linked">
            {tasksLoading || projectsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : linkedProjects.length > 0 || linkedTasks.length > 0 ? (
              <div className="space-y-8">
                {linkedProjects.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-muted-foreground text-sm font-medium">
                      Projects
                    </h2>
                    <LinkedProjects projects={linkedProjects} />
                  </div>
                )}
                {linkedTasks.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-muted-foreground text-sm font-medium">
                      Tasks
                    </h2>
                    <LinkedTasks tasks={linkedTasks} />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={GitBranch}
                title="No linked projects or tasks"
                description="Add a repository URL to a project, or link a GitHub issue/PR to any task."
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your GitHub connection. Previously connected
              repositories will keep their existing analysis data, but you won&apos;t
              be able to connect new ones until you re-authorize.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                disconnect.mutate();
                setRepos([]);
              }}
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
    </PageContainer>
  );
}
