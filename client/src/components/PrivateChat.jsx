// PrivateChat component - for sending DMs to another user
// Jon Adrian Lee - 101421575

import { useState, useEffect, useRef } from "react";
import { fetchPrivateMessages } from "../api";

export default function PrivateChat({ socket, username }) {
  const [targetUser, setTargetUser] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingFrom, setTypingFrom] = useState("");
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const typingTimerRef = useRef(null);

  // listen for private messages coming in through socket
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = (msg) => {
      setMessages((prev) => {
        // only add if this message is relevant to us
        const relevantUsers = [msg.from_user, msg.to_user];
        if (relevantUsers.includes(username)) {
          return [...prev, msg];
        }
        return prev;
      });
    };

    const handleTypingPrivate = ({ from_user }) => {
      if (from_user !== username) {
        setTypingFrom(from_user);
        // clear old timeout before making a new one
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          setTypingFrom("");
          typingTimerRef.current = null;
        }, 3000);
      }
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("typingPrivate", handleTypingPrivate);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("typingPrivate", handleTypingPrivate);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [socket, username]);

  // auto scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // start chatting with someone - load old messages
  const startChat = async () => {
    if (!targetUser.trim() || targetUser.trim() === username) return;
    const trimmed = targetUser.trim();
    setActiveChat(trimmed);
    setMessages([]);

    // fetch message history from the api
    const history = await fetchPrivateMessages(username, trimmed);
    setMessages(history);
  };

  // deduplicate messages (same issue as group chat)
  const seen = new Set();
  const unique = messages.filter((m) => {
    if (!m._id) return true;
    const key = m._id.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // only show messages between me and the active user
  const filtered = activeChat
    ? unique.filter(
        (m) =>
          (m.from_user === username && m.to_user === activeChat) ||
          (m.from_user === activeChat && m.to_user === username)
      )
    : [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;
    socket.emit("privateMessage", {
      from_user: username,
      to_user: activeChat,
      message: input.trim(),
    });
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // typing indicator - debounced
    if (!typingTimeout.current && activeChat) {
      socket.emit("typingPrivate", { from_user: username, to_user: activeChat });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = null;
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Private Messages
      </h2>

      {/* type in who you want to chat with */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={targetUser}
          onChange={(e) => setTargetUser(e.target.value)}
          placeholder="Enter username to chat with..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={startChat}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition"
        >
          Open Chat
        </button>
      </div>

      {activeChat ? (
        <div className="flex flex-col h-[430px]">
          <div className="bg-gray-50 px-3 py-2 rounded-t-lg border-b text-sm text-gray-700">
            Chatting with <strong className="text-blue-600">{activeChat}</strong>
          </div>

          {/* message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-sm">
                No messages yet. Say hello!
              </p>
            )}
            {filtered.map((msg, i) => {
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

          {/* typing indicator for private chat */}
          {typingFrom === activeChat && (
            <div className="px-4 py-2 text-sm text-blue-600 italic bg-blue-50 border-t border-blue-100 animate-pulse">
              {typingFrom} is typing...
            </div>
          )}

          {/* input for private messages */}
          <form
            onSubmit={handleSend}
            className="border-t p-3 flex gap-2 bg-white rounded-b-lg"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a private message..."
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
      ) : (
        <div className="text-center text-gray-400 py-12">
          Enter a username above to start a private conversation
        </div>
      )}
    </div>
  );
}
