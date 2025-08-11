import React, { useState } from "react";
import { register, login, uploadFile, runAnalysis, getHistory, getAnalysisDetail } from "./api";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const handleRegister = async () => {
    if (!username || !password) return alert("Please enter username and password");
    try {
      await register(username, password);
      alert("Registration successful. Please log in.");
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    }
  };

  const handleLogin = async () => {
    if (!username || !password) return alert("Please enter username and password");
    try {
      await login(username, password);
      setIsLoggedIn(true);
      alert("Login successful");
    } catch (err) {
      alert(err.response?.data?.detail || "Login failed");
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return alert("Please select a file first");
    try {
      setLoading(true);
      const uploadRes = await uploadFile(file);
      const filename = uploadRes.data.filename;
      const analysisRes = await runAnalysis(filename);
      setAnalysis(analysisRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Upload/Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleHistory = async (pageNum = page, order = sortOrder) => {
    try {
      const res = await getHistory(pageNum * 5, 5, order); // skip, limit, sort
      setHistory(res.data);
      setPage(pageNum);
      setSortOrder(order);
    } catch (err) {
      alert("Failed to load history");
    }
  };

  const handleHistoryClick = async (id) => {
    try {
      const res = await getAnalysisDetail(id);
      setSelectedHistory(res.data);
    } catch (err) {
      alert("Failed to load analysis detail");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setAnalysis(null);
    setFile(null);
    setUsername("");
    setPassword("");
    setHistory([]);
    setSelectedHistory(null);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>HonestAI</h1>

      {!isLoggedIn ? (
        <section style={{ marginBottom: 20 }}>
          <h2>Register / Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginRight: 10 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginRight: 10 }}
          />
          <div style={{ marginTop: 10 }}>
            <button onClick={handleRegister} style={{ marginRight: 10 }}>
              Register
            </button>
            <button onClick={handleLogin}>Login</button>
          </div>
        </section>
      ) : (
        <>
          <button onClick={handleLogout} style={{ marginBottom: 20 }}>
            Logout
          </button>

          <section style={{ marginBottom: 20 }}>
            <h2>Upload & Analyze</h2>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button
              onClick={handleUploadAndAnalyze}
              disabled={loading}
              style={{ marginLeft: 10 }}
            >
              {loading ? "Processing..." : "Upload & Analyze"}
            </button>
          </section>

          {analysis && (
            <section>
              <h2>Latest Analysis Result</h2>
              <p><strong>Transcript:</strong> {analysis.speech_to_text}</p>
              <p><strong>Truth Score:</strong> {(analysis.truth_score * 100).toFixed(2)}%</p>
              {analysis.faces_detected !== null && (
                <p><strong>Faces Detected:</strong> {analysis.faces_detected}</p>
              )}
            </section>
          )}

<section style={{ marginTop: 20 }}>
  <h2>History</h2>
  <div style={{ marginBottom: 10 }}>
    <button onClick={() => handleHistory(0, sortOrder)}>First Page</button>
    <button onClick={() => handleHistory(Math.max(page - 1, 0), sortOrder)}>Prev</button>
    <button onClick={() => handleHistory(page + 1, sortOrder)}>Next</button>
    <select
      value={sortOrder}
      onChange={(e) => handleHistory(0, e.target.value)}
      style={{ marginLeft: 10 }}
    >
      <option value="desc">Newest First</option>
      <option value="asc">Oldest First</option>
    </select>
  </div>
  <ul>
    {history.map((h) => (
      <li
        key={h.id}
        style={{ cursor: "pointer", textDecoration: "underline" }}
        onClick={() => handleHistoryClick(h.id)}
      >
        {new Date(h.analyzed_at).toLocaleString()} — Truth Score: {(h.truth_score * 100).toFixed(1)}% — Faces: {h.faces_detected}
      </li>
    ))}
  </ul>
</section>

          {selectedHistory && (
            <section style={{ marginTop: 20 }}>
              <h2>Analysis Detail</h2>
              <p><strong>Transcript:</strong> {selectedHistory.transcript}</p>
              <p><strong>Truth Score:</strong> {(selectedHistory.truth_score * 100).toFixed(2)}%</p>
              {selectedHistory.faces_detected !== null && (
                <p><strong>Faces Detected:</strong> {selectedHistory.faces_detected}</p>
              )}
              <p><em>Analyzed at: {new Date(selectedHistory.analyzed_at).toLocaleString()}</em></p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
