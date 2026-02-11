// App.jsx - main router setup
// Jon Adrian Lee - 101421575

import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

// this protects the chat route - redirects to login if not logged in
function ProtectedRoute({ children }) {
  const username = localStorage.getItem("username");
  if (!username) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      {/* anything else goes to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
