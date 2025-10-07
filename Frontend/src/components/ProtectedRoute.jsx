import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  if (typeof window === "undefined") return <Navigate to="/admin-login" replace />;

  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const adminEmail = localStorage.getItem("adminEmail");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Ensure admin is logged in and the Google user email matches adminEmail
  if (isAdmin && adminEmail && user.email && user.email === adminEmail) {
    return children;
  }

  // If checks fail, redirect to login
  return <Navigate to="/admin-login" replace />;
}
