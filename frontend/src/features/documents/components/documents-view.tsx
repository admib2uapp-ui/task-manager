"use client";

import { Eye, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/features/documents/components/markdown-preview";
import {
  useCreateNote,
  useDeleteNote,
  useNote,
  useNotes,
  useUpdateNote,
} from "@/features/documents/hooks/use-notes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

function Editor({ noteId }: { noteId: string }) {
  const { data: note } = useNote(noteId);
  const update = useUpdateNote();
  const remove = useDeleteNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setDirty(false);
    }
  }, [note]);

  const debouncedTitle = useDebouncedValue(title, 700);
  const debouncedContent = useDebouncedValue(content, 700);

  useEffect(() => {
    if (!note || !dirty) return;
    if (debouncedTitle === note.title && debouncedContent === note.content)
      return;
    update.mutate({
      id: note.id,
      payload: {
        title: debouncedTitle || "Untitled",
        content: debouncedContent,
      },
    });
  }, [debouncedTitle, debouncedContent, dirty, note, update]);

  if (!note) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-2 border-b px-4 py-2.5">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Untitled"
          className="h-9 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <span className="text-muted-foreground shrink-0 text-xs">
          {update.isPending ? "Saving…" : "Saved"}
        </span>
        <div className="border-border flex rounded-lg border p-0.5">
          <button
            onClick={() => setMode("write")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              mode === "write"
                ? "bg-accent text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Pencil className="size-3.5" /> Write
          </button>
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              mode === "preview"
                ? "bg-accent text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Eye className="size-3.5" /> Preview
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-9 rounded-lg"
          onClick={() => remove.mutate(note.id)}
          aria-label="Delete note"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {mode === "write" ? (
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          placeholder="Start writing… Markdown supported (# headings, **bold**, tables, code, - [ ] checklists)."
          className="flex-1 resize-none rounded-none border-0 bg-transparent px-5 py-4 font-mono text-sm shadow-none focus-visible:ring-0"
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="px-5 py-4">
            <MarkdownPreview content={content || "*Nothing to preview yet.*"} />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export function DocumentsView() {
  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && notes.length > 0) setSelectedId(notes[0].id);
  }, [notes, selectedId]);

  async function handleCreate() {
    const note = await createNote.mutateAsync();
    setSelectedId(note.id);
  }

  return (
    <PageContainer
      fluid
      className="flex h-[calc(100dvh-4rem)] max-w-none flex-col p-0"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar list */}
        <div className="border-border flex w-72 shrink-0 flex-col border-r">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h1 className="text-sm font-semibold">Documents</h1>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 rounded-lg"
              onClick={() => void handleCreate()}
              disabled={createNote.isPending}
              aria-label="New note"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="text-muted-foreground flex justify-center py-8">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : notes.length > 0 ? (
              <div className="p-2">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedId(note.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition-colors",
                      selectedId === note.id
                        ? "bg-accent"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <span className="truncate text-sm font-medium">
                      {note.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatRelative(note.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                No documents yet.
              </p>
            )}
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="min-w-0 flex-1">
          {selectedId ? (
            <Editor key={selectedId} noteId={selectedId} />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState
                icon={FileText}
                title="No document selected"
                description="Create a document to capture notes, specs and research."
                action={
                  <Button
                    className="gap-1.5 rounded-xl"
                    onClick={() => void handleCreate()}
                  >
                    <Plus className="size-4" /> New document
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
