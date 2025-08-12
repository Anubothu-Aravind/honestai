import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Video Recorder
        </h1>
        <p className="text-gray-600 mb-8">
          Sign in with Google to start recording professional videos
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              console.log(credentialResponse);
              const decoded = jwtDecode(credentialResponse.credential);
              console.log(decoded);
              // Store user info if needed
              localStorage.setItem("userInfo", JSON.stringify(decoded));
              navigate("/video");
            }}
            onError={(error) => {
              console.log("Login failed:", error);
            }}
            useOneTap
            theme="outline"
            size="large"
          />
        </div>

        <div className="mt-6 text-xs text-gray-500">
          By signing in, you agree to our terms of service
        </div>
      </div>
    </div>
  );
}
