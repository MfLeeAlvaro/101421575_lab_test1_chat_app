/*
 * COMP3133 - Lab Test 1
 * Student: Jon Adrian Lee
 * Student ID: 101421575
 * 
 * Main server file - sets up express, socket.io and connects to mongodb
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const User = require("./models/User");
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const app = express();
const server = http.createServer(app);

// set up socket io with cors so the react app can connect
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// routes
app.use("/api", authRoutes);

// get all users (dont return passwords obviously)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).lean();
    res.json(users);
  } catch (err) {
    console.log("error fetching users:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// get group messages for a room
app.get("/api/messages/group", async (req, res) => {
  try {
    const { room } = req.query;
    if (!room) return res.status(400).json({ error: "room query param required" });

    // find messages for that room, sort by date
    const messages = await GroupMessage.find({ room })
      .sort({ date_sent: 1 })
      .limit(200)
      .lean();
    res.json(messages);
  } catch (err) {
    console.log("error fetching group msgs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// get private messages between two users
app.get("/api/messages/private", async (req, res) => {
  try {
    const { with: other, me } = req.query;
    if (!other || !me)
      return res.status(400).json({ error: "with and me query params required" });

    // need to get messages in both directions
    const messages = await PrivateMessage.find({
      $or: [
        { from_user: me, to_user: other },
        { from_user: other, to_user: me },
      ],
    })
      .sort({ date_sent: 1 })
      .limit(200)
      .lean();
    res.json(messages);
  } catch (err) {
    console.log("error fetching private msgs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// keep track of who is in each room
const roomUsers = {}; // { roomName: Set of usernames }

function getRoomUsers(room) {
  if (roomUsers[room]) {
    return Array.from(roomUsers[room]);
  }
  return [];
}

// -------- socket.io stuff --------
io.on("connection", (socket) => {
  console.log("new socket connected:", socket.id);

  // when user joins a room
  socket.on("joinRoom", ({ room, username }) => {
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    // add to room users tracking
    if (!roomUsers[room]) roomUsers[room] = new Set();
    roomUsers[room].add(username);

    // tell everyone in the room about updated user list
    io.to(room).emit("roomUsers", getRoomUsers(room));
    socket.to(room).emit("systemMessage", {
      message: `${username} has joined the room.`,
      room,
    });
  });

  // when user leaves a room
  socket.on("leaveRoom", ({ room, username }) => {
    socket.leave(room);

    // remove from tracking
    if (roomUsers[room]) {
      roomUsers[room].delete(username);
      if (roomUsers[room].size === 0) delete roomUsers[room];
    }

    io.to(room).emit("roomUsers", getRoomUsers(room));
    socket.to(room).emit("systemMessage", {
      message: `${username} has left the room.`,
      room,
    });
    socket.data.room = null;
  });

  // group chat message - save to db then broadcast
  socket.on("chatMessage", async ({ from_user, room, message }) => {
    try {
      const msg = await GroupMessage.create({ from_user, room, message });
      io.to(room).emit("chatMessage", {
        _id: msg._id,
        from_user: msg.from_user,
        room: msg.room,
        message: msg.message,
        date_sent: msg.date_sent,
      });
    } catch (err) {
      console.error("couldnt save group message:", err.message);
    }
  });

  // private message - save to db then send to both users
  socket.on("privateMessage", async ({ from_user, to_user, message }) => {
    try {
      const msg = await PrivateMessage.create({ from_user, to_user, message });

      const payload = {
        _id: msg._id,
        from_user: msg.from_user,
        to_user: msg.to_user,
        message: msg.message,
        date_sent: msg.date_sent,
      };

      // loop through all connected sockets to find the two users
      const sockets = await io.fetchSockets();
      for (const s of sockets) {
        if (s.data.username === to_user || s.data.username === from_user) {
          s.emit("privateMessage", payload);
        }
      }
    } catch (err) {
      console.error("couldnt save private message:", err.message);
    }
  });

  // typing indicators - use io.to instead of socket.to for reliability
  socket.on("typing", ({ room, username }) => {
    console.log(`typing event from ${username} in room ${room}`);
    io.to(room).emit("userTyping", { room, username });
  });

  socket.on("typingPrivate", async ({ from_user, to_user }) => {
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      if (s.data.username === to_user) {
        s.emit("typingPrivate", { from_user, to_user });
      }
    }
  });

  // handle disconnect - clean up room users
  socket.on("disconnect", () => {
    const { username, room } = socket.data;
    if (room && username && roomUsers[room]) {
      roomUsers[room].delete(username);
      if (roomUsers[room].size === 0) delete roomUsers[room];
      io.to(room).emit("roomUsers", getRoomUsers(room));
      socket.to(room).emit("systemMessage", {
        message: `${username} has disconnected.`,
        room,
      });
    }
    console.log("socket disconnected:", socket.id);
  });
});

// connect to mongodb and start server
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chatApp";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
