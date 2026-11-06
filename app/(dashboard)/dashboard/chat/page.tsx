"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, FileText, Download, Wand2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";


interface CvData {
  id: string;
  title: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isCvCard?: boolean;
  cvData?: CvData;
}

const SUGGESTED = [
  "Generate a professional CV for me",
  "How can I improve my resume?",
  "What skills are in demand for software engineers?",
  "Help me write a cover letter",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I am your **TomParo AI Career Assistant**. I can give career advice, review your resume, or generate a professional CV from your profile. What would you like to do?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateCvSilently = async () => {
    try {
      const res = await fetch("/api/cv-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: "Professional",
          company: "",
        }),
      });
      if (!res.ok) throw new Error("CV generation failed");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "✅ Your CV has been generated! You can download it below or open it in the builder to customise further.",
          isCvCard: true,
          cvData: data,
        },
      ]);
    } catch {
      console.error("Could not auto-generate CV");
    }
  };

  const handleSend = async (text?: string) => {
    const userMsg = text || input;
    if (!userMsg.trim() || isLoading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      if (!res.ok) throw new Error("Chat error");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.hasCvIntent) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⏳ Generating your CV from your profile and resume...",
          },
        ]);
        await generateCvSilently();
      }
    } catch {
      console.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (id: string, format: "docx" | "pdf") => {
    window.open(`/api/cv-builder/${id}/download?format=${format}`, "_blank");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg">TomParo AI</h1>
          <p className="text-xs text-slate-500">Career Assistant · Always online</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">Active</Badge>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
              }`}
            >
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              {m.isCvCard && m.cvData && (
                <Card className="mt-3 p-4 bg-blue-50 border-2 border-dashed border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      <span className="font-semibold text-blue-800 text-sm">
                        {m.cvData.title}
                      </span>
                    </div>
                    <Badge className="bg-blue-600 text-white text-xs">
                      Generated on TomParo
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadFile(m.cvData!.id, "docx")}
                      className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Download size={14} /> Download .DOCX
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadFile(m.cvData!.id, "pdf")}
                      className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Download size={14} /> Download .PDF
                    </Button>
                    <Button
                      className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white mt-1"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/dashboard/cv-builder?edit=${m.cvData!.id}`)
                      }
                    >
                      <Wand2 size={14} className="mr-2" /> View & Edit in Builder
                    </Button>
                  </div>
                </Card>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts — only show if no user message yet */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-left text-xs bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-3 py-2 text-slate-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for career advice or say: Generate my CV..."
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
