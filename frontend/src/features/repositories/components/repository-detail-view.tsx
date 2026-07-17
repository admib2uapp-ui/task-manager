"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  FileCode,
  FileText,
  FolderTree,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FolderTree as FolderTreeComponent } from "@/features/repositories/components/folder-tree";
import {
  repoQueryKeys,
  useAIReports,
  useCodeIssues,
  useFileTree,
  useRepoLanguages,
  useRepository,
  useRepositoryScore,
  useRepositoryScans,
  useTriggerScan,
} from "@/features/repositories/hooks/use-repositories";
import { cn } from "@/lib/utils";
import type { CodeIssue } from "@/features/repositories/api/repositories-api";

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "high":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "medium":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "low":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{Math.round(value)}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

interface RepositoryDetailViewProps {
  connectionId: string;
}

export function RepositoryDetailView({ connectionId }: RepositoryDetailViewProps) {
  const { data: conn, isLoading: connLoading } = useRepository(connectionId);
  const { data: languages } = useRepoLanguages(connectionId);
  const { data: scans } = useRepositoryScans(connectionId);
  const { data: fileTree } = useFileTree(connectionId);
  const { data: issues } = useCodeIssues(connectionId);
  const { data: reports } = useAIReports(connectionId);
  const { data: score } = useRepositoryScore(connectionId);
  const triggerScan = useTriggerScan();
  const queryClient = useQueryClient();

  const [issueFilter, setIssueFilter] = useState<string | null>(null);

  const latestScan = scans?.[0];

  useEffect(() => {
    if (
      latestScan?.status === "completed" ||
      latestScan?.status === "failed"
    ) {
      queryClient.invalidateQueries({ queryKey: repoQueryKeys.issues(connectionId) });
      queryClient.invalidateQueries({ queryKey: repoQueryKeys.reports(connectionId) });
      queryClient.invalidateQueries({ queryKey: repoQueryKeys.score(connectionId) });
      queryClient.invalidateQueries({ queryKey: repoQueryKeys.fileTree(connectionId) });
    }
  }, [latestScan?.status, connectionId, queryClient]);

  if (connLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!conn) {
    return (
      <div className="p-6">
        <Link
          href="/repositories"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to repositories
        </Link>
        <Card className="border-destructive/30 bg-destructive/5 rounded-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Repository not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = conn.repoInfo as Record<string, unknown> | null;
  const stars = (meta?.stars as number) ?? 0;
  const description = (meta?.description as string) ?? null;
  const isPrivate = (meta?.isPrivate as boolean) ?? false;
  const isScanning = latestScan?.status === "pending" || latestScan?.status === "running";

  const filteredIssues = issueFilter
    ? (issues ?? []).filter((i) => i.severity === issueFilter)
    : (issues ?? []);

  const aiReports = (reports ?? []).filter(
    (r) => r.reportType === "executive" || r.reportType === "architecture",
  );
  const execReport = aiReports.find((r) => r.reportType === "executive");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/repositories"
            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {conn.githubOwner}/{conn.githubRepo}
            </h1>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                isPrivate
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
              )}
            >
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        <Button
          className="gap-1.5 rounded-xl"
          onClick={() =>
            triggerScan.mutate({ connectionId })
          }
          disabled={triggerScan.isPending || isScanning}
        >
          {triggerScan.isPending || isScanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {isScanning ? "Scanning..." : "Scan & Analyze"}
        </Button>
      </div>

      {isScanning && (
        <Card className="border-primary/30 bg-primary/5 rounded-2xl">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="text-primary size-5 animate-spin" />
            <div>
              <p className="text-sm font-medium">Scan in progress...</p>
              <p className="text-muted-foreground text-xs">
                Fetching files and running AI analysis. This may take a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {latestScan?.status === "failed" && (
        <Card className="border-destructive/30 bg-destructive/5 rounded-2xl">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-destructive">
                Scan failed
              </p>
              <p className="text-muted-foreground mt-1 text-xs break-all">
                {latestScan.errorMessage || "Unknown error. Check the backend terminal for details."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 p-3">
            <Star className="text-amber-500 size-4" />
            <div>
              <p className="text-lg font-semibold tabular-nums">{stars}</p>
              <p className="text-muted-foreground text-[10px]">Stars</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 p-3">
            <FileCode className="text-blue-400 size-4" />
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {fileTree?.length ?? "-"}
              </p>
              <p className="text-muted-foreground text-[10px]">Files</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 p-3">
            <Bug className="text-red-400 size-4" />
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {issues?.length ?? "-"}
              </p>
              <p className="text-muted-foreground text-[10px]">Issues</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="text-purple-400 size-4" />
            <div>
              <p className="text-lg font-semibold tabular-nums">
                {aiReports.length || "-"}
              </p>
              <p className="text-muted-foreground text-[10px]">Reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line" className="mb-6 gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <FileText className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-1.5">
            <Bug className="size-4" /> Errors & Bugs
            {issues && issues.length > 0 && (
              <span className="bg-destructive/20 text-destructive ml-1 rounded-full px-1.5 text-[10px]">
                {issues.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-1.5">
            <FolderTree className="size-4" /> Folder Structure
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <Sparkles className="size-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {score && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Quality Scores</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <ScoreBar label="Overall" value={score.overall} />
                <ScoreBar label="Architecture" value={score.architecture} />
                <ScoreBar label="Code Quality" value={score.codeQuality} />
                <ScoreBar label="Security" value={score.security} />
                <ScoreBar label="Performance" value={score.performance} />
                <ScoreBar label="Testing" value={score.testing} />
                <ScoreBar label="Documentation" value={score.documentation} />
                <ScoreBar label="Maintainability" value={score.maintainability} />
                <ScoreBar label="Tech Debt" value={score.technicalDebt} />
                <ScoreBar label="Complexity" value={score.complexity} />
                <ScoreBar label="DX Score" value={score.dxScore} />
              </CardContent>
            </Card>
          )}

          {execReport?.scores && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="text-purple-400 size-4" />
                  AI Project Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {String((execReport.scores as Record<string, unknown>).description ?? execReport.summary ?? "")}
                  </ReactMarkdown>
                </div>

                {Boolean((execReport.scores as Record<string, unknown>).techStack) && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        (execReport.scores as Record<string, unknown>).techStack as string[]
                      )?.map((tech: string) => (
                        <Badge key={tech} variant="secondary" className="text-[10px]">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {Boolean((execReport.scores as Record<string, unknown>).strengths) && (
                  <div>
                    <h4 className="text-success mb-2 text-xs font-medium">Strengths</h4>
                    <ul className="text-muted-foreground ml-4 list-disc space-y-1 text-xs">
                      {(
                        (execReport.scores as Record<string, unknown>).strengths as string[]
                      )?.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Boolean((execReport.scores as Record<string, unknown>).weaknesses) && (
                  <div>
                    <h4 className="text-destructive mb-2 text-xs font-medium">
                      Areas to Improve
                    </h4>
                    <ul className="text-muted-foreground ml-4 list-disc space-y-1 text-xs">
                      {(
                        (execReport.scores as Record<string, unknown>).weaknesses as string[]
                      )?.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!score && !execReport && !isScanning && (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                <Sparkles className="text-muted-foreground size-8" />
                <div>
                  <p className="font-medium">No AI analysis yet</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Click &quot;Scan &amp; Analyze&quot; to generate AI-powered insights
                    about this repository.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {languages && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(languages.languages)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, bytes]) => (
                      <Badge key={lang} variant="outline" className="gap-1">
                        <span className="bg-primary size-2 rounded-full" />
                        {lang}
                        <span className="text-muted-foreground ml-1 text-[10px]">
                          {((bytes / languages.totalBytes) * 100).toFixed(1)}%
                        </span>
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="issues">
          {issues && issues.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={!issueFilter ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIssueFilter(null)}
                >
                  All ({issues.length})
                </Button>
                {["critical", "high", "medium", "low"].map((sev) => {
                  const count = issues.filter((i) => i.severity === sev).length;
                  if (count === 0) return null;
                  return (
                    <Button
                      key={sev}
                      variant={issueFilter === sev ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setIssueFilter(sev)}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)} ({count})
                    </Button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {filteredIssues.map((issue: CodeIssue) => (
                  <Card
                    key={issue.id}
                    className="hover:border-muted-foreground/30 rounded-xl transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {issue.issueType === "bug" || issue.issueType === "security" ? (
                            <Shield className="text-destructive size-4" />
                          ) : issue.issueType === "performance" ? (
                            <Zap className="text-yellow-400 size-4" />
                          ) : (
                            <AlertTriangle className="text-muted-foreground size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{issue.title}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border text-[10px]",
                                severityColor(issue.severity),
                              )}
                            >
                              {issue.severity}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {issue.category}
                            </Badge>
                          </div>
                          {issue.message && (
                            <p className="text-muted-foreground text-xs">
                              {issue.message}
                            </p>
                          )}
                          {issue.suggestion && (
                            <div className="bg-muted/50 rounded-lg border p-2.5">
                              <p className="text-xs">
                                <span className="text-success font-medium">
                                  Suggestion:
                                </span>{" "}
                                {issue.suggestion}
                              </p>
                            </div>
                          )}
                          <div className="text-muted-foreground flex items-center gap-3 text-[10px]">
                            <span className="font-mono">{issue.filePath}</span>
                            {issue.lineStart && (
                              <span>
                                L{issue.lineStart}
                                {issue.lineEnd && `-L${issue.lineEnd}`}
                              </span>
                            )}
                            {issue.language && <span>{issue.language}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                <Info className="text-muted-foreground size-8" />
                <div>
                  <p className="font-medium">No issues found</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Run a scan to detect errors, bugs, and code quality issues
                    with AI.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="structure">
          {fileTree ? (
            <FolderTreeComponent items={fileTree} />
          ) : (
            <Skeleton className="h-64 rounded-2xl" />
          )}
        </TabsContent>

        <TabsContent value="reports">
          {aiReports.length > 0 ? (
            <div className="space-y-4">
              {aiReports.map((report) => (
                <Card key={report.id} className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="text-purple-400 size-4" />
                      {report.title}
                    </CardTitle>
                    {report.generatedBy && (
                      <p className="text-muted-foreground text-xs">
                        Generated by {report.generatedBy}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {report.fullContent ?? report.summary ?? ""}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                <FileText className="text-muted-foreground size-8" />
                <div>
                  <p className="font-medium">No reports generated</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    AI-generated reports will appear here after running a scan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
