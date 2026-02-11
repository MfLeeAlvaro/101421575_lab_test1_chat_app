// ChatWindow component - shows the messages and input for group chat
// Jon Adrian Lee - 101421575

import { useState, useEffect, useRef } from "react";
import { fetchGroupMessages } from "../api";

export default function ChatWindow({
  room,
  messages,
  username,
  typingUser,
  onSend,
  onTyping,
}) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // load old messages from the database when we join a room
  useEffect(() => {
    let cancelled = false;
    fetchGroupMessages(room).then((data) => {
      if (!cancelled) setHistory(data);
    });
    return () => {
      cancelled = true;
    };
  }, [room]);

  // scroll to bottom whenever new messages come in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, messages]);

  // combine history from db + new messages from socket
  const allMessages = [...history, ...messages];

  // remove duplicates (same message might come from db and socket)
  const seen = new Set();
  const unique = allMessages.filter((m) => {
    if (!m._id) return true;
    if (seen.has(m._id.toString())) return false;
    seen.add(m._id.toString());
    return true;
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  // handle typing - emit event but debounce so we dont spam the server
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!typingTimeout.current) {
      onTyping();
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = null;
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[500px]">
      {/* messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {unique.map((msg, i) => {
          // system messages (join/leave notifications)
          if (msg.system) {
            return (
              <div key={msg._id || i} className="text-center text-xs text-gray-400 italic">
                {msg.message}
              </div>
            );
          }

          const isMe = msg.from_user === username;
          return (
            <div
              key={msg._id || i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  isMe
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {/* show username for other peoples messages */}
                {!isMe && (
                  <div className="text-xs font-semibold mb-1 text-blue-700">
                    {msg.from_user}
                  </div>
                )}
                <div>{msg.message}</div>
                <div
                  className={`text-xs mt-1 ${
                    isMe ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {msg.date_sent
                    ? new Date(msg.date_sent).toLocaleTimeString()
                    : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* typing indicator */}
      {typingUser && typingUser !== username && (
        <div className="px-4 py-2 text-sm text-blue-600 italic bg-blue-50 border-t border-blue-100 animate-pulse">
          {typingUser} is typing...
        </div>
      )}

      {/* message input */}
      <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
