"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function MessagesContent() {
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(withUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeUserId) loadMessages(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      const all = new Map<string, any>();
      data.sent?.forEach((m: any) => { if (!all.has(m.receiver.id.toString())) all.set(m.receiver.id.toString(), { user: m.receiver }); });
      data.received?.forEach((m: any) => { if (!all.has(m.sender.id.toString())) all.set(m.sender.id.toString(), { user: m.sender }); });
      setConversations(Array.from(all.values()));
    }
  }

  async function loadMessages(userId: string) {
    const res = await fetch(`/api/messages?with=${userId}`);
    if (res.ok) setMessages(await res.json());
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeUserId, message: newMessage }),
    });
    setNewMessage("");
    setSending(false);
    await loadMessages(activeUserId);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Dashboard</Link>
        </nav>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex gap-6" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <div className="w-72 bg-white border rounded-xl flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b">
            <p className="font-semibold text-gray-900">Messages</p>
          </div>
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.user.id}
                onClick={() => setActiveUserId(c.user.id.toString())}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${activeUserId === c.user.id.toString() ? "bg-blue-50 border-l-2 border-l-blue-600" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {c.user.fullName?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{c.user.fullName}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white border rounded-xl flex flex-col">
          {activeUserId ? (
            <>
              <div className="p-4 border-b">
                <p className="font-semibold text-gray-900">
                  {conversations.find((c) => c.user.id.toString() === activeUserId)?.user.fullName ?? "Conversation"}
                </p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: "60vh" }}>
                {messages.map((m) => {
                  const isMine = m.sender?.id?.toString() !== activeUserId;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t flex gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Select a conversation to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading…</p></div>}>
      <MessagesContent />
    </Suspense>
  );
}
