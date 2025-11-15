import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Mic, LayoutDashboard, LogOut, User } from "lucide-react";

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [storedUser, setStoredUser] = useState({});

  useEffect(() => {
    const parseJson = (v) => {
      try {
        return JSON.parse(v);
      } catch {
        return {};
      }
    };

    const checkAuth = () => {
      // prefer sessionStorage as the single source of truth for admin/session
      const sessionUserInfo = sessionStorage.getItem("userInfo");
      const localUserInfo = localStorage.getItem("userInfo");

      // isAuthenticated true if a user prop exists or any userInfo exists (session first)
      const auth =
        !!user ||
        !!sessionUserInfo ||
        !!localUserInfo; // fallback to localStorage if app still uses it elsewhere
      setIsAuthenticated(!!auth);

      // storedUser may be held in sessionStorage or localStorage depending on your app.
      // Prefer sessionStorage, fallback to localStorage.
      const rawStoredUser =
        sessionStorage.getItem("user") || localStorage.getItem("user") || "{}";
      const parsedUser = parseJson(rawStoredUser);
      setStoredUser(parsedUser);

      // Admin flags (single source = sessionStorage)
      const adminEmail = sessionStorage.getItem("adminEmail");
      const isAdminFlag = sessionStorage.getItem("isAdmin") === "true";

      // Only flag as admin if the stored user's email matches the adminEmail and flag is true
      setIsAdmin(isAdminFlag && parsedUser.email === adminEmail);
    };

    checkAuth();

    // Re-check when other tabs change localStorage (storage event) OR when we dispatch authStateChange in same tab
    const handleStorage = () => checkAuth();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("authStateChange", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("authStateChange", handleStorage);
    };
  }, [user]);

  const isActive = (path) => location.pathname === path;

  // Don't show navbar on landing page if not authenticated
  if (location.pathname === "/" && !isAuthenticated) return null;
  if (!isAuthenticated) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="font-semibold text-gray-800 text-lg hidden sm:block">
              Recorder
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive("/")
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-gray-700 hover:bg-gray-100/80 hover:text-indigo-600"
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline font-medium">Home</span>
            </Link>

            <Link
              to="/Recorder"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive("/Recorder")
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-gray-700 hover:bg-gray-100/80 hover:text-indigo-600"
              }`}
            >
              <Mic size={18} />
              <span className="hidden sm:inline font-medium">Recorder</span>
            </Link>

            {/* Dashboard link - disabled if not admin */}
            <Link
              to={isAdmin ? "/dashboard" : "#"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive("/dashboard")
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : isAdmin
                  ? "text-gray-700 hover:bg-gray-100/80 hover:text-indigo-600"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!isAdmin) e.preventDefault();
              }}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline font-medium">Dashboard</span>
            </Link>

            {/* User Profile and Logout */}
            {(user || storedUser.email) && (
              <div className="flex items-center ml-4">
                <div className="flex items-center mr-3">
                  {user?.picture || storedUser.picture ? (
                    <img
                      src={user?.picture || storedUser.picture}
                      alt={user?.name || storedUser.name || "User"}
                      className="w-8 h-8 rounded-full border-2 border-indigo-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User size={16} className="text-indigo-600" />
                    </div>
                  )}
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                    {user?.name || storedUser.name || "User"}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
