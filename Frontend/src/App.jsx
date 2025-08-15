import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Landing } from "./components/Landing";
import Video from "./components/video";
import Voice from "./components/Voice";

function App() {
  return (
    <GoogleOAuthProvider clientId="1033556695079-osn1ufaqhamij1uf30gfbairbbolb7l0.apps.googleusercontent.com">
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/Video" element={<Video />} />
            <Route path="/Voice" element={<Voice />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
