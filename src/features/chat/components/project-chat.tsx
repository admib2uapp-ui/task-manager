"use client";

import { useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChatHeader } from "@/features/chat/components/chat-header";
import { ChatMessageList } from "@/features/chat/components/chat-message-list";
import { ChatInput } from "@/features/chat/components/chat-input";
import { ChatThread } from "@/features/chat/components/chat-thread";
import { useChatMessages } from "@/features/chat/hooks/use-chat-messages";
import { useChatRealtime } from "@/features/chat/hooks/use-chat-realtime";
import { useChatTyping } from "@/features/chat/hooks/use-chat-typing";
import { useChatPresence } from "@/features/chat/hooks/use-chat-presence";
import {
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useToggleReaction,
  usePinMessage,
  useUnpinMessage,
  useUploadFile,
} from "@/features/chat/hooks/use-chat-mutations";
import { useChatUIStore } from "@/features/chat/stores/chat-ui-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useWorkspaceMembers } from "@/features/users/hooks/use-users";

export function ProjectChat({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: messagesData, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChatMessages(projectId);
  const { data: usersData } = useWorkspaceMembers();
  const currentUser = useAuthStore((s) => s.user);
  const sendMessage = useSendMessage(projectId);
  const editMessage = useEditMessage(projectId);
  const deleteMessage = useDeleteMessage(projectId);
  const toggleReaction = useToggleReaction(projectId);
  const pinMessage = usePinMessage(projectId);
  const unpinMessage = useUnpinMessage(projectId);
  const uploadFile = useUploadFile(projectId);
  const { setReplyingTo, setEditingMessage, setActiveThread } = useChatUIStore();

  const projectMembers = useMemo(() => usersData ?? [], [usersData]);

  const chatId = messagesData?.pages?.[0]?.chatId;
  useChatRealtime(projectId, chatId);
  const { typingUsers, broadcastTyping } = useChatTyping(chatId);
  const { onlineUserIds } = useChatPresence(chatId);

  const allMessages = useMemo(
    () => messagesData?.pages.flatMap((p) => p.messages) ?? [],
    [messagesData],
  );

  const allPins = useMemo(
    () => messagesData?.pages?.[0]?.pins ?? [],
    [messagesData],
  );

  const onlineUsers = useMemo(
    () => projectMembers.filter((u) => onlineUserIds.has(u.id)),
    [projectMembers, onlineUserIds],
  );

  const canModerate = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.workspaceRole;
    return role === "owner" || role === "senior";
  }, [currentUser]);

  const handleSend = useCallback(
    (body: string, mentionIds: string[]) => {
      sendMessage.mutate({ body, mentionIds });
    },
    [sendMessage],
  );

  const handleEdit = useCallback(
    (messageId: string, body: string) => {
      editMessage.mutate({ messageId, body });
    },
    [editMessage],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      deleteMessage.mutate(messageId);
    },
    [deleteMessage],
  );

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      toggleReaction.mutate({ messageId, emoji });
    },
    [toggleReaction],
  );

  const handlePin = useCallback(
    (messageId: string) => {
      const isPinned = allPins.some((p) => p.messageId === messageId);
      if (isPinned) {
        unpinMessage.mutate(messageId);
      } else {
        pinMessage.mutate(messageId);
      }
    },
    [allPins, pinMessage, unpinMessage],
  );

  const handleCopy = useCallback((body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  }, []);

  const handleUpload = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        try {
          const result = await uploadFile.mutateAsync({ file });
          const isImage = result.mimeType.startsWith("image/");
          const body = isImage
            ? `[${result.fileName}](${result.fileUrl})`
            : `📎 ${result.fileName}\n${result.fileUrl}`;
          sendMessage.mutate({ body, mentionIds: [] });
        } catch {
          // error already handled by useUploadFile toast
        }
      }
    },
    [uploadFile, sendMessage],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          projectId={projectId}
          projectName={project?.name ?? "Project"}
          onlineCount={onlineUsers.length}
          totalMembers={projectMembers.length}
          onlineUsers={onlineUsers}
        />
        <ChatMessageList
          messages={allMessages}
          pins={allPins}
          hasMore={hasNextPage ?? false}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          currentUserId={currentUser?.id ?? ""}
          canModerate={canModerate}
          projectId={projectId}
          onReply={setReplyingTo}
          onDelete={handleDelete}
          onEdit={setEditingMessage}
          onReact={handleReact}
          onPin={handlePin}
          onOpenThread={setActiveThread}
          onCopy={handleCopy}
        />
        {typingUsers.length > 0 && (
          <div className="px-4 pb-1">
            <p className="text-muted-foreground animate-pulse text-xs">
              {typingUsers.map((u) => u.name).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </p>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          onEdit={handleEdit}
          onUpload={handleUpload}
          isSending={sendMessage.isPending}
          projectMembers={projectMembers}
          broadcastTyping={broadcastTyping}
        />
      </div>
      <ChatThread projectId={projectId} />
    </div>
  );
}
