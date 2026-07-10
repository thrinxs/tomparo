"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import LockedFeature from "@/components/dashboard/LockedFeature";
import {
  MessageCircle,
  Send,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  User,
  Bot,
  MessageSquare,
  Upload,
  X,
} from "lucide-react";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

const SUGGESTED_PROMPTS = [
  "How can I switch from marketing to tech?",
  "What skills should I learn to become a senior developer?",
  "How do I ask for a raise?",
  "What's a good salary for my role in Nigeria?",
  "How do I improve my LinkedIn profile?",
  "Help me prepare for a behavioral interview",
];

export default function ChatPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium || false;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [cvContext, setCvContext] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isPremium) {
      loadConversations();
    }
  }, [isPremium]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setCurrentConvId(id);
        setMessages(data.conversation.messages);
      }
    } catch (error) {
      toast.error("Failed to load conversation");
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Optimistically add user message
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConvId,
          message: text,
          cvContext: cvContext || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Add AI response
      const aiMsg: Message = { role: "assistant", content: data.message };
      setMessages((prev) => [...prev, aiMsg]);

      // Update conversation ID if new
      if (!currentConvId && data.conversationId) {
        setCurrentConvId(data.conversationId);
        loadConversations();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
      toast.success("Conversation deleted");
      if (currentConvId === id) {
        startNewChat();
      }
      loadConversations();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isPremium) {
    return (
      <LockedFeature
        feature="AI Career Chat"
        description="Chat directly with AI about your career, get answers to your questions, and understand your analysis in detail."
        icon={MessageCircle}
        color="purple"
        benefits={[
          "Unlimited AI chat messages",
          "Ask anything about your career",
          "Get detailed explanations of your scores",
          "Understand your CV analysis better",
          "Get advice on specific job opportunities",
          "Explore skill development strategies",
          "Personalized career planning conversations",
          "AI remembers your CV and history",
        ]}
      />
    );
  }

  return (
    <div className="mx-auto h-[calc(100vh-8rem)] max-w-6xl">
      <Toaster position="top-right" />

      <div className="flex h-full gap-4">
        {/* Sidebar with conversations */}
        <div className="hidden w-72 flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl md:flex">
          <div className="border-b border-white/5 p-4">
            <button
              onClick={startNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-purple-700/25 transition hover:from-purple-500 hover:to-pink-500"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 rounded-xl p-3 transition ${
                      currentConvId === conv.id
                        ? "bg-purple-500/10 border border-purple-500/20"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <button
                      onClick={() => loadConversation(conv.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                        <p className="line-clamp-1 text-xs text-slate-300">
                          {conv.title}
                        </p>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      className="opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/20">
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">TomParo AI</h1>
                <p className="text-xs text-slate-400">
                  Your personal career coach
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCvUpload(!showCvUpload)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                cvContext
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Upload className="h-3 w-3" />
              {cvContext ? "CV Loaded" : "Add CV Context"}
            </button>
          </div>

          {/* CV Context Input */}
          {showCvUpload && (
            <div className="border-b border-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  CV Context (helps AI understand your background)
                </label>
                {cvContext && (
                  <button
                    onClick={() => setCvContext("")}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={cvContext}
                onChange={(e) => setCvContext(e.target.value)}
                placeholder="Paste your CV here..."
                className="h-24 w-full resize-none rounded-xl border border-white/10 bg-slate-900/50 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
              />
              <p className="mt-1 text-xs text-slate-500">
                {cvContext.length} characters
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/10 ring-1 ring-purple-500/20">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  How can I help you today?
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                  Ask me anything about your career, jobs, skills, or interviews.
                </p>

                <div className="mt-8 grid gap-2 md:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-sm text-slate-300 transition hover:border-purple-500/20 hover:bg-purple-500/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                        msg.role === "user"
                          ? "bg-cyan-500/10 ring-1 ring-cyan-500/20"
                          : "bg-purple-500/10 ring-1 ring-purple-500/20"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <Bot className="h-4 w-4 text-purple-400" />
                      )}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl border p-4 ${
                        msg.role === "user"
                          ? "border-cyan-500/20 bg-cyan-500/5"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="text-sm text-slate-100">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => (
        <h1 className="mb-3 mt-4 text-2xl font-bold text-purple-300">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-2 mt-4 text-xl font-bold text-purple-300">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-2 mt-3 text-lg font-semibold text-purple-300">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="mb-3 leading-relaxed">{children}</p>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-amber-400">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="italic text-blue-300">{children}</em>
      ),
      ul: ({ children }) => (
        <ul className="my-3 space-y-1.5 pl-4">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:font-bold marker:text-emerald-400">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="flex items-start gap-2 leading-relaxed">
          <span className="mt-1.5 text-purple-400">→</span>
          <span className="flex-1">{children}</span>
        </li>
      ),
      a: ({ children, href }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline decoration-blue-400/30 transition hover:text-blue-300 hover:decoration-blue-300"
        >
          {children}
        </a>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-3 rounded-lg border-l-4 border-purple-500 bg-purple-500/10 px-4 py-3 italic text-slate-300">
          {children}
        </blockquote>
      ),
      code: ({ children, className }) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code className="rounded border border-cyan-500/20 bg-slate-800 px-1.5 py-0.5 text-xs text-cyan-300">
              {children}
            </code>
          );
        }
        return (
          <code className="block overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs text-slate-200">
            {children}
          </code>
        );
      },
      pre: ({ children }) => (
        <pre className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-4">
          {children}
        </pre>
      ),
      table: ({ children }) => (
        <div className="my-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full border-collapse">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          {children}
        </thead>
      ),
      th: ({ children }) => (
        <th className="border-b border-white/10 px-4 py-3 text-left text-sm font-semibold text-purple-300">
          {children}
        </th>
      ),
      tr: ({ children }) => (
        <tr className="border-b border-white/5 transition hover:bg-white/5">
          {children}
        </tr>
      ),
      td: ({ children }) => (
        <td className="px-4 py-3 text-sm text-slate-200">{children}</td>
      ),
      hr: () => <hr className="my-6 border-white/10" />,
    }}
  >
    {msg.content}
  </ReactMarkdown>
</div>
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/20">
                      <Bot className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                        <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500 [animation-delay:200ms]" />
                        <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500 [animation-delay:400ms]" />
                        <span className="ml-2 text-xs text-slate-400">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/5 p-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift + Enter for new line)"
                disabled={sending}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 disabled:opacity-50"
                style={{ maxHeight: "150px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-700/25 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}