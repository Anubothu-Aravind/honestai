import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode"; // install: npm install jwt-decode
import { Landing } from "./components/Landing";
import Recorder from "./components/Recorder";
import UnifiedMediaRecorder from "./components/UnifiedMediaRecorder";
import Admin from "./components/Admin";
import Dashboard from "./components/Dashboard";
import AdminLogin from "./components/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import home from "./components/Home";
import Home from "./components/Home";

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "1033556695079-osn1ufaqhamij1uf30gfbairbbolb7l0.apps.googleusercontent.com";

  // Load user from localStorage on page refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsSignedIn(true);
    }
  }, []);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential); // decode JWT token
    setIsSignedIn(true);
    setUser(decoded);

    // save to localStorage
    localStorage.setItem("user", JSON.stringify(decoded));
  };

  const handleLogout = () => {
    setIsSignedIn(false);
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
          {!isSignedIn ? (
            // Show login screen first
            <div className="flex justify-center items-center h-screen">
              <div className="p-6 bg-white shadow-md rounded-xl text-center">
                <h1 className="text-2xl font-bold mb-4">
                  Welcome to TrueScope
                </h1>
                <p className="mb-6 text-gray-600">
                  AI-Powered Truth Analyzer for HR, interviews, and personal
                  analysis
                </p>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => {
                    console.log("Login Failed");
                  }}
                />
              </div>
            </div>
          ) : (
            // Show Navbar + Routes after login
            <>
              <Navbar user={user} onLogout={handleLogout} />
              <div className="pt-20 px-4">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/Recorder" element={<Recorder />} />
                  <Route
                    path="/UnifiedMediaRecorder"
                    element={<UnifiedMediaRecorder />}
                  />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </>
          )}
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
