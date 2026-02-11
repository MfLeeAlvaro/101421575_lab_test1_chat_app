// api.js - helper functions for calling the backend
// Jon Adrian Lee - 101421575

const API_BASE = "http://localhost:3000/api";

// signup - sends user info to backend
export async function signup({ username, firstname, lastname, password }) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, firstname, lastname, password }),
  });
  return res.json();
}

// login - check credentials and get token back
export async function login({ username, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return { status: res.status, data: await res.json() };
}

// get group messages for a specific room
export async function fetchGroupMessages(room) {
  const res = await fetch(
    `${API_BASE}/messages/group?room=${encodeURIComponent(room)}`
  );
  return res.json();
}

// get private messages between me and another user
export async function fetchPrivateMessages(me, other) {
  const res = await fetch(
    `${API_BASE}/messages/private?me=${encodeURIComponent(me)}&with=${encodeURIComponent(other)}`
  );
  return res.json();
}
