"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Hash, Plus, Send, Loader2, Pin, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function ConferenceRoomPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadRooms = async () => {
    try {
      const res = await fetch("/api/recruiter/team/rooms");
      const data = await res.json();
      setRooms(data.rooms || []);
      if (!activeRoom && data.rooms?.length > 0) {
        setActiveRoom(data.rooms[0]);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/recruiter/team/rooms/${roomId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {}
  };

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    if (!activeRoom) return;
    loadMessages(activeRoom.id);
    pollRef.current = setInterval(() => loadMessages(activeRoom.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRoom?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeRoom) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");
    try {
      const res = await fetch(`/api/recruiter/team/rooms/${activeRoom.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [...prev, data.message]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { toast.error("Failed to send message"); setNewMessage(content); }
    finally { setSending(false); }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreatingRoom(true);
    try {
      const res = await fetch("/api/recruiter/team/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRooms((prev) => [...prev, data.room]);
      setActiveRoom(data.room);
      setNewRoomName("");
      setShowNewRoom(false);
      toast.success("Channel created!");
    } catch (err: any) { toast.error(err.message || "Failed to create channel"); }
    finally { setCreatingRoom(false); }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groupedMessages.push({ date, messages: [msg] });
  });

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-white/10 overflow-hidden">

      {/* Sidebar — channels */}
      <div className="w-56 shrink-0 bg-slate-900/50 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {rooms.map((room) => (
            <button key={room.id} onClick={() => setActiveRoom(room)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition text-sm ${
                activeRoom?.id === room.id ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}>
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{room.name}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/5">
          {showNewRoom ? (
            <div className="space-y-2">
              <input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                placeholder="Channel name..." autoFocus
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50" />
              <div className="flex gap-1">
                <button onClick={handleCreateRoom} disabled={creatingRoom}
                  className="flex-1 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition disabled:opacity-50">
                  {creatingRoom ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowNewRoom(false)} className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewRoom(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition text-sm">
              <Plus className="w-3.5 h-3.5" />New Channel
            </button>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-[#0a0a0f]">
        {/* Room header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-semibold text-white">{activeRoom?.name || "Select a channel"}</p>
          {activeRoom?.description && <p className="text-xs text-slate-500 ml-2">{activeRoom.description}</p>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <p className="text-[10px] text-slate-600 font-medium">{group.date}</p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              {group.messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                const showAvatar = i === 0 || group.messages[i - 1]?.senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        {msg.sender?.image
                          ? <img src={msg.sender.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                          : <span className="text-purple-400 text-xs font-bold">{(msg.sender?.name || "?")[0].toUpperCase()}</span>}
                      </div>
                    ) : <div className="w-8 shrink-0" />}
                    <div className={`max-w-[70%] space-y-0.5 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                          <p className="text-xs font-semibold text-white">{isMe ? "You" : (msg.sender?.name || msg.sender?.email)}</p>
                          <p className="text-[10px] text-slate-600">{formatTime(msg.createdAt)}</p>
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-purple-600 text-white rounded-tr-sm"
                          : "bg-white/[0.06] text-slate-200 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Message #${activeRoom?.name || "channel"}...`}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            <button onClick={handleSend} disabled={sending || !newMessage.trim()}
              className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition disabled:opacity-40">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
