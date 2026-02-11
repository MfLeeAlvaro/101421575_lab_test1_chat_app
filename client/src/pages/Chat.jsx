// Chat page - main screen after login
// handles room chat, private chat, socket connection etc
// Jon Adrian Lee - 101421575

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import RoomPicker from "../components/RoomPicker";
import ChatWindow from "../components/ChatWindow";
import PrivateChat from "../components/PrivateChat";

const SOCKET_URL = "http://localhost:3000";

export default function Chat() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const socketRef = useRef(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [showPrivate, setShowPrivate] = useState(false);
  const typingTimerRef = useRef(null);

  // connect to socket when component loads
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      // just storing username on socket for reference
      socket.data = { username };
    });

    // listen for group messages
    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // system messages like "user joined" etc
    socket.on("systemMessage", (msg) => {
      setMessages((prev) => [
        ...prev,
        { _id: Date.now(), from_user: "SYSTEM", message: msg.message, system: true },
      ]);
    });

    // update online users list
    socket.on("roomUsers", (users) => {
      setRoomUsers(users);
    });

    // typing indicator - listen for userTyping from server
    socket.on("userTyping", (data) => {
      console.log("received userTyping event:", data);
      setTypingUser(data.username);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingUser("");
        typingTimerRef.current = null;
      }, 3000);
    });

    return () => {
      socket.disconnect();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // join a room
  const handleJoinRoom = (room) => {
    // leave current room first if we're in one
    if (currentRoom) {
      socketRef.current.emit("leaveRoom", { room: currentRoom, username });
    }
    setMessages([]);
    setRoomUsers([]);
    setTypingUser("");
    setCurrentRoom(room);
    socketRef.current.emit("joinRoom", { room, username });
  };

  // leave current room
  const handleLeaveRoom = () => {
    if (currentRoom) {
      socketRef.current.emit("leaveRoom", { room: currentRoom, username });
      setCurrentRoom(null);
      setMessages([]);
      setRoomUsers([]);
      setTypingUser("");
    }
  };

  // send a message to the current room
  const handleSendMessage = (text) => {
    if (!currentRoom || !text.trim()) return;
    socketRef.current.emit("chatMessage", {
      from_user: username,
      room: currentRoom,
      message: text.trim(),
    });
  };

  // emit typing event
  const handleTyping = () => {
    if (currentRoom) {
      console.log("emitting typing event for room:", currentRoom);
      socketRef.current.emit("typing", { room: currentRoom, username });
    }
  };

  // logout - clear localstorage and go back to login
  const handleLogout = () => {
    if (currentRoom) {
      socketRef.current.emit("leaveRoom", { room: currentRoom, username });
    }
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* top navbar */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <h1 className="text-lg font-bold">Chat App</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            Logged in as <strong>{username}</strong>
          </span>
          <button
            onClick={() => setShowPrivate(!showPrivate)}
            className="bg-blue-500 hover:bg-blue-400 text-white text-sm px-3 py-1 rounded transition"
          >
            {showPrivate ? "Group Chat" : "Private Chat"}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4">
        {showPrivate ? (
          // private chat mode
          <PrivateChat socket={socketRef.current} username={username} />
        ) : (
          <>
            {/* room selector */}
            <RoomPicker
              currentRoom={currentRoom}
              onJoin={handleJoinRoom}
              onLeave={handleLeaveRoom}
            />

            {/* show chat if we're in a room, otherwise show message */}
            {currentRoom ? (
              <div className="mt-4 flex gap-4">
                {/* chat window */}
                <div className="flex-1">
                  <ChatWindow
                    room={currentRoom}
                    messages={messages}
                    username={username}
                    typingUser={typingUser}
                    onSend={handleSendMessage}
                    onTyping={handleTyping}
                  />
                </div>

                {/* sidebar - who's online */}
                <div className="w-48 bg-white rounded-lg shadow p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Online in Room ({roomUsers.length})
                  </h3>
                  <ul className="space-y-1">
                    {roomUsers.map((u) => (
                      <li
                        key={u}
                        className="text-sm text-gray-600 flex items-center gap-1"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        {u}
                        {u === username && (
                          <span className="text-xs text-gray-400">(you)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-gray-500">
                Select a room to start chatting
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
