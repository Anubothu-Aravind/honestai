import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  if (typeof window === "undefined") return <Navigate to="/admin-login" replace />;

  // Use the same sessionStorage flags set by AdminLogin and expected by Dashboard
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";
  const adminKey = sessionStorage.getItem("adminKey");

  if (isAdmin && adminKey) {
    return children;
  }

  // If checks fail, redirect to login
  return <Navigate to="/admin-login" replace />;
}
