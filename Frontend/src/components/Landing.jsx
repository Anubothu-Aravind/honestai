import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to TrueScope
        </h1>

        <p className="text-gray-600 mb-8">
          AI-Powered Truth Analyzer for HR, interviews, and personal analysis
        </p>

        {/* Google Login only */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              console.log("Raw Google Response:", credentialResponse);

              if (credentialResponse.credential) {
                const decoded = jwtDecode(credentialResponse.credential);
                console.log("Decoded JWT:", decoded);

                localStorage.setItem("userInfo", JSON.stringify(decoded));
                navigate("/Recorder");
              } else {
                console.error("No credential found in Google response");
              }
            }}
            onError={(error) => {
              console.error("Google Login Failed:", error);
              alert(
                "Google OAuth not configured correctly. Please check Authorized JavaScript origins and redirect URIs in Google Cloud Console."
              );
            }}
            theme="outline"
            size="large"
          />
        </div>

        <div className="mt-6 text-xs text-gray-500">
          By signing in, you agree to our terms of service
        </div>

        {/* OAuth Configuration Help */}
        {/* <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-left">
          <h4 className="font-semibold text-yellow-800 mb-2">OAuth Setup Required:</h4>
          <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Go to Google Cloud Console</li>
            <li>APIs & Services → Credentials</li>
            <li>Edit OAuth 2.0 Client ID</li>
            <li>Add Authorized origins: http://localhost:5173</li>
            <li>Add Redirect URIs: http://localhost:5173</li>
          </ol>
        </div> */}
      </div>
    </div>
  );
}
