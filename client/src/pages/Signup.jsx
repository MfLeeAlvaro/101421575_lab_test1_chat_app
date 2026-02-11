// Signup page component
// Jon Adrian Lee - 101421575

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api";

export default function Signup() {
  const navigate = useNavigate();

  // form state for all the fields
  const [form, setForm] = useState({
    username: "",
    firstname: "",
    lastname: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // update form when user types
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // basic validation - make sure nothing is empty
    if (!form.username || !form.firstname || !form.lastname || !form.password) {
      setError("All fields are required");
      return;
    }

    const data = await signup(form);

    if (data.error) {
      setError(data.error);
    } else {
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Sign Up
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose a unique username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstname"
              value={form.firstname}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastname"
              value={form.lastname}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Last name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create a password"
            />
          </div>

          {/* show error or success message */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-sm bg-green-50 p-2 rounded">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
