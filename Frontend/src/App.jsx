import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Landing } from "./components/Landing";
import Recorder from "./components/Recorder"; 
import UnifiedMediaRecorder from "./components/UnifiedMediaRecorder";

function App() {
  return (
    <GoogleOAuthProvider clientId="1033556695079-osn1ufaqhamij1uf30gfbairbbolb7l0.apps.googleusercontent.com">
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/Recorder" element={<Recorder />} />
            <Route path="/UnifiedMediaRecorder" element={<UnifiedMediaRecorder />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
