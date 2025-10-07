import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Auto-redirect if already logged in (checks sessionStorage)
  useEffect(() => {
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    const adminKey = sessionStorage.getItem("adminKey");
    if (isAdmin && adminKey) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Restrict to only the allowed email
      if (email.trim().toLowerCase() !== "aanubothu@gmail.com") {
        setError("Access denied: only authorized admin can log in");
        return;
      }

      const backendUrl = "http://localhost:5001";

      // Send request to backend to validate the admin key (password)
      const res = await fetch(`${backendUrl}/api/sessions`, {
        headers: { "x-admin-key": password },
      });

      if (!res.ok) {
        throw new Error("Invalid admin password");
      }

      // **FIXED**: Save login info in sessionStorage to match the Dashboard
      sessionStorage.setItem("isAdmin", "true");
      sessionStorage.setItem("adminKey", password);
      sessionStorage.setItem("adminEmail", email);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Admin Login</h1>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
          <strong>Admin Email:</strong> aanubothu@gmail.com <br />
          <strong>Admin Password:</strong> 567890
        </div>

        {error && (
          <div className="mb-3 p-2 text-sm rounded bg-rose-50 text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <label className="block text-sm text-gray-700 mb-1">Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="Enter admin email"
            required
          />

          <label className="block text-sm text-gray-700 mb-1">Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="Enter admin password"
            required
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded px-3 py-2 hover:bg-indigo-700 transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}