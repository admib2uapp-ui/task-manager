"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Reply, Heart, Send, AtSign } from "lucide-react";

interface CommentItem {
  id: string;
  author: { name: string; avatarUrl?: string | null };
  body: string;
  createdAt: string;
  reactions?: { emoji: string; count: number }[];
  replies?: CommentItem[];
}

interface PanelCommentsProps {
  comments: CommentItem[];
  onAddComment: (body: string) => void;
  onAddReply?: (parentId: string, body: string) => void;
  onReact?: (commentId: string, emoji: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentThread({
  comment,
  onReply,
  onReact,
  depth = 0,
}: {
  comment: CommentItem;
  onReply?: (parentId: string, body: string) => void;
  onReact?: (commentId: string, emoji: string) => void;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSendReply = useCallback(() => {
    if (!replyText.trim()) return;
    onReply?.(comment.id, replyText);
    setReplyText("");
    setShowReply(false);
  }, [comment.id, replyText, onReply]);

  const avatarColor = depth === 0
    ? "bg-indigo-600"
    : depth === 1
      ? "bg-emerald-600"
      : "bg-amber-600";

  return (
    <div className={`${depth > 0 ? "ml-5 pl-3 border-l border-white/8" : ""}`}>
      <div className="flex items-start gap-2 py-1.5">
        <div
          className={`mt-0.5 size-5 shrink-0 rounded-full ${avatarColor} flex items-center justify-center text-[8px] font-bold text-white`}
        >
          {comment.author.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-200">{comment.author.name}</span>
            <span className="text-[8px] text-slate-500">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">{comment.body}</p>

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onReact?.(comment.id, "❤️")}
              className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] text-slate-500 hover:text-red-400 transition"
            >
              <Heart className="size-2.5" />
              {comment.reactions?.find((r) => r.emoji === "❤️")?.count ?? 0}
            </button>
            {onReply && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] text-slate-500 hover:text-indigo-400 transition"
              >
                <Reply className="size-2.5" />
                Reply
              </button>
            )}
          </div>

          {/* Inline reply */}
          {showReply && (
            <div className="mt-1.5 flex items-center gap-1">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                placeholder="Write a reply..."
                className="flex-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-[9px] text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition"
                autoFocus
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition disabled:opacity-30"
              >
                <Send className="size-2.5" />
              </button>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies?.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onReact={onReact}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PanelComments({
  comments,
  onAddComment,
  onAddReply,
  onReact,
}: PanelCommentsProps) {
  const [newComment, setNewComment] = useState("");

  const handleSend = useCallback(() => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment("");
  }, [newComment, onAddComment]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="size-3 text-slate-400" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Comments</span>
        <span className="text-[9px] text-slate-500">({comments.length})</span>
      </div>

      {/* Comment input */}
      <div className="flex items-center gap-1.5">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[10px] text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition"
        />
        <button
          onClick={handleSend}
          disabled={!newComment.trim()}
          className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition disabled:opacity-30"
        >
          <Send className="size-3" />
        </button>
      </div>

      {/* Comments list */}
      {comments.length === 0 && (
        <p className="text-[9px] text-slate-500 py-2 text-center">No comments yet</p>
      )}
      <div className="space-y-0.5 max-h-32 overflow-y-auto scrollbar-thin">
        {comments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            onReply={onAddReply}
            onReact={onReact}
          />
        ))}
      </div>
    </div>
  );
}
