// RoomPicker - dropdown to pick and join a chat room
// Jon Adrian Lee - 101421575

import { useState } from "react";

// these are the predefined rooms from the lab requirements
const ROOMS = ["devops", "cloud computing", "covid19", "sports", "nodeJS"];

export default function RoomPicker({ currentRoom, onJoin, onLeave }) {
  const [selected, setSelected] = useState(ROOMS[0]);

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-gray-700">Room:</label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {ROOMS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <button
        onClick={() => onJoin(selected)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition"
      >
        Join Room
      </button>

      {/* only show leave button if we're in a room */}
      {currentRoom && (
        <>
          <span className="text-sm text-gray-600">
            Current: <strong className="text-blue-600">{currentRoom}</strong>
          </span>
          <button
            onClick={onLeave}
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md transition"
          >
            Leave Room
          </button>
        </>
      )}
    </div>
  );
}
