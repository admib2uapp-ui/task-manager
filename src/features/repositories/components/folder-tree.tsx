"use client";

import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { FileTreeItem } from "@/features/repositories/api/repositories-api";

interface TreeNode {
  name: string;
  path: string;
  type: "tree" | "blob";
  size: number;
  children: TreeNode[];
}

function buildTree(items: FileTreeItem[]): TreeNode[] {
  const seen = new Map<string, FileTreeItem>();
  for (const item of items) {
    const existing = seen.get(item.path);
    if (!existing || item.type === "tree") {
      seen.set(item.path, item);
    }
  }
  const deduped = [...seen.values()];

  const root: TreeNode[] = [];
  const dirMap = new Map<string, TreeNode>();

  for (const item of deduped) {
    const parts = item.path.split("/");
    let currentChildren = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (isLast) {
        const node: TreeNode = {
          name: part,
          path: item.path,
          type: item.type,
          size: item.size,
          children: [],
        };
        currentChildren.push(node);
        if (item.type === "tree") {
          dirMap.set(currentPath, node);
        }
      } else {
        let dir = dirMap.get(currentPath);
        if (!dir) {
          dir = {
            name: part,
            path: currentPath,
            type: "tree",
            size: 0,
            children: [],
          };
          currentChildren.push(dir);
          dirMap.set(currentPath, dir);
        }
        currentChildren = dir.children;
      }
    }
  }

  return root;
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    tsx: "⚛️",
    jsx: "⚛️",
    ts: "🔷",
    js: "🟨",
    css: "🎨",
    scss: "🎨",
    json: "📋",
    yaml: "📋",
    yml: "📋",
    md: "📝",
    mdx: "📝",
    svg: "🖼️",
    png: "🖼️",
    jpg: "🖼️",
    py: "🐍",
    go: "🔵",
    rs: "🦀",
    sql: "🗄️",
    sh: "⚡",
    bash: "⚡",
  };
  return iconMap[ext ?? ""] ?? "📄";
}

interface FolderTreeItemProps {
  node: TreeNode;
  depth: number;
}

function FolderTreeItem({ node, depth }: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const sorted = useMemo(() => sortNodes(node.children), [node.children]);

  if (node.type === "blob") {
    return (
      <div
        className="hover:bg-muted/50 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        title={node.path}
      >
        <span className="text-xs">{getFileIcon(node.name)}</span>
        <span className="text-muted-foreground flex-1 truncate">
          {node.name}
        </span>
        {node.size > 0 && (
          <span className="text-muted-foreground/60 shrink-0 text-[10px]">
            {node.size < 1024
              ? `${node.size}B`
              : node.size < 1024 * 1024
                ? `${(node.size / 1024).toFixed(1)}KB`
                : `${(node.size / (1024 * 1024)).toFixed(1)}MB`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        className="hover:bg-muted/50 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={cn(
            "text-muted-foreground size-3.5 shrink-0 transition-transform",
            expanded && "rotate-90",
          )}
        />
        {expanded ? (
          <FolderOpen className="size-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="size-4 shrink-0 text-amber-500" />
        )}
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {expanded && (
        <div>
          {sorted.map((child) => (
            <FolderTreeItem
              key={`${child.path}-${child.type}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  items: FileTreeItem[];
  className?: string;
}

export function FolderTree({ items, className }: FolderTreeProps) {
  const tree = useMemo(() => sortNodes(buildTree(items)), [items]);

  if (tree.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        No files found in this repository.
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <div className="max-h-[600px] overflow-y-auto py-2">
        {tree.map((node) => (
          <FolderTreeItem
            key={`${node.path}-${node.type}`}
            node={node}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
