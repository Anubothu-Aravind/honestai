import React, { useState, useRef } from "react";
import { Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";

const Voice = () => {
  const [transcript, setTranscript] = useState(
    "Click Start to begin voice recognition and see your words appear here..."
  );
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const finalTranscriptRef = useRef("");

  const browserSupportsRecognition = () => {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  };

  const initializeRecognition = () => {
    if (!browserSupportsRecognition()) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      // Process results from the last result index to avoid duplicates
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const currentTranscript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += currentTranscript + " ";
        } else {
          interimTranscript = currentTranscript; // Only keep the latest interim result
        }
      }

      // Update final transcript reference
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
      }

      // Update display transcript
      const displayTranscript = finalTranscriptRef.current + interimTranscript;

      setTranscript((prev) => {
        if (displayTranscript.trim() === "") {
          return "Click Start to begin voice recognition and see your words appear here...";
        }
        return displayTranscript.trim();
      });
    };

    recognitionInstance.onstart = () => {
      setListening(true);
      console.log("Speech recognition started");
    };

    recognitionInstance.onend = () => {
      setListening(false);
      console.log("Speech recognition ended");
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);

      // Handle specific errors
      if (event.error === "not-allowed") {
        alert(
          "Microphone access denied. Please allow microphone access and try again."
        );
      } else if (event.error === "no-speech") {
        console.log(
          "No speech detected. Try speaking closer to the microphone."
        );
      }
    };

    // Handle audio start/end events for better feedback
    recognitionInstance.onaudiostart = () => {
      console.log("Audio capturing started");
    };

    recognitionInstance.onaudioend = () => {
      console.log("Audio capturing ended");
    };

    recognitionInstance.onspeechstart = () => {
      console.log("Speech detected");
    };

    recognitionInstance.onspeechend = () => {
      console.log("Speech ended");
    };

    return recognitionInstance;
  };

  const startListening = () => {
    if (!browserSupportsRecognition()) {
      alert("Speech recognition not supported in your browser");
      return;
    }

    // Reset transcript when starting fresh
    if (
      transcript ===
      "Click Start to begin voice recognition and see your words appear here..."
    ) {
      finalTranscriptRef.current = "";
      setTranscript("");
    }

    const newRecognition = initializeRecognition();
    if (newRecognition) {
      setRecognition(newRecognition);
      try {
        newRecognition.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
  };

  const resetTranscript = () => {
    finalTranscriptRef.current = "";
    setTranscript(
      "Click Start to begin voice recognition and see your words appear here..."
    );

    // Stop current recognition if active
    if (listening && recognition) {
      recognition.stop();
    }
  };

  if (!browserSupportsRecognition()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MicOff className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Not Supported
            </h2>
            <p className="text-gray-600">
              Your browser does not support speech recognition. Please try using
              Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Voice Recognition
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Click the microphone to start speaking. Your words will appear in
            real-time below with improved accuracy.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Status Bar */}
          <div
            className={`px-8 py-6 ${
              listening
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-gray-500 to-slate-500"
            } transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    listening ? "bg-white animate-pulse" : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-white font-semibold text-lg">
                  Microphone: {listening ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-white" />
                <span className="text-white text-sm">
                  {listening ? "Listening..." : "Ready to listen"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 py-8">
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <button
                onClick={startListening}
                disabled={listening}
                className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg transform hover:scale-105 ${
                  listening
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-200"
                }`}
              >
                <Mic className="w-6 h-6" />
                <span>Start Listening</span>
              </button>

              <button
                onClick={stopListening}
                disabled={!listening}
                className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg transform hover:scale-105 ${
                  !listening
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-red-200"
                }`}
              >
                <MicOff className="w-6 h-6" />
                <span>Stop Listening</span>
              </button>

              <button
                onClick={resetTranscript}
                className="flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg transform hover:scale-105 shadow-purple-200"
              >
                <RotateCcw className="w-6 h-6" />
                <span>Reset</span>
              </button>
            </div>

            {/* Transcript Display */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Transcript
                </h3>
                <div className="text-sm text-gray-500">
                  {transcript ===
                  "Click Start to begin voice recognition and see your words appear here..."
                    ? 0
                    : transcript.length}{" "}
                  characters
                </div>
              </div>

              <div className="min-h-32 max-h-96 overflow-y-auto">
                {transcript ? (
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap break-words">
                    {transcript}
                  </p>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Mic className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-lg">
                        Start speaking to see your words appear here...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {listening && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-green-600 text-sm font-medium ml-3">
                      Actively listening...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Tips for Better Recognition
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  Speak Clearly & Steadily
                </h4>
                <p className="text-gray-600">
                  Use a normal speaking pace and enunciate your words clearly.
                  Avoid mumbling or speaking too fast.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  Quiet Environment
                </h4>
                <p className="text-gray-600">
                  Use in a quiet space to minimize background noise, echo, and
                  interference for better accuracy.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-purple-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  Microphone Permission
                </h4>
                <p className="text-gray-600">
                  Make sure to allow microphone access when prompted. Position
                  yourself 6-12 inches from the mic.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-orange-600 font-semibold text-sm">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  Natural Pauses
                </h4>
                <p className="text-gray-600">
                  Brief pauses between sentences help the system process speech
                  and improve final accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voice;
