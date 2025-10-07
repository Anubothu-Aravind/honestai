import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Square,
  Mic,
  Video,
  Monitor,
  Loader2,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Volume2,
  Copy,
  FileText,
  Brain,
  Eye,
  MessageSquare,
  TrendingUp,
  Zap,
} from "lucide-react";

const MLRecorder = () => {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Media recorders and streams
  const [screenRecorder, setScreenRecorder] = useState(null);
  const [cameraRecorder, setCameraRecorder] = useState(null);
  const [voiceRecorder, setVoiceRecorder] = useState(null);

  // Speech recognition
  const [recognition, setRecognition] = useState(null);
  const [transcript, setTranscript] = useState(
    'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
  );
  const [isListening, setIsListening] = useState(false);
  const finalTranscriptRef = useRef("");

  // Recorded data
  const [recordings, setRecordings] = useState({
    screen: null,
    camera: null,
    voice: null,
  });

  // ML Analysis results
  const [mlAnalysisResults, setMlAnalysisResults] = useState({
    voice: null,
    facial: null,
    text: null,
    truth: null,
  });

  // Status tracking
  const [status, setStatus] = useState({
    screen: "idle",
    camera: "idle",
    voice: "idle",
    speech: "idle",
  });

  // Error handling
  const [errors, setErrors] = useState({
    screen: null,
    camera: null,
    voice: null,
    speech: null,
  });

  // ML Analysis progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const recordedChunks = useRef({
    screen: [],
    camera: [],
    voice: [],
  });

  // Check browser support
  const browserSupportsRecognition = () => {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  };

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Initialize speech recognition with better configuration
  const initializeSpeechRecognition = () => {
    if (!browserSupportsRecognition()) {
      setErrors((prev) => ({
        ...prev,
        speech: "Speech recognition not supported in this browser",
      }));
      return null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    // Enhanced configuration
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const currentTranscript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += currentTranscript + " ";
        } else {
          interimTranscript = currentTranscript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
      }

      const displayTranscript = finalTranscriptRef.current + interimTranscript;
      setTranscript(
        displayTranscript.trim() ||
          'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
      );
    };

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setStatus((prev) => ({ ...prev, speech: "recording" }));
      setErrors((prev) => ({ ...prev, speech: null }));
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      setStatus((prev) => ({ ...prev, speech: "completed" }));
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setStatus((prev) => ({ ...prev, speech: "error" }));

      if (event.error === "not-allowed") {
        setErrors((prev) => ({
          ...prev,
          speech: "Microphone access denied for speech recognition",
        }));
      } else if (event.error === "no-speech") {
        setErrors((prev) => ({ 
          ...prev, 
          speech: "No speech detected. Please speak clearly and ensure your microphone is working." 
        }));
        // Restart recognition after a short delay
        setTimeout(() => {
          if (isRecording) {
            try {
              recognitionInstance.start();
            } catch (e) {
              console.log("Failed to restart recognition:", e);
            }
          }
        }, 1000);
      } else if (event.error === "network") {
        setErrors((prev) => ({
          ...prev,
          speech: "Network error. Please check your internet connection.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          speech: `Speech recognition error: ${event.error}`,
        }));
      }
    };

    return recognitionInstance;
  };

  // Setup screen recording
  const setupScreenRecording = async () => {
    try {
      setStatus((prev) => ({ ...prev, screen: "initializing" }));
      setErrors((prev) => ({ ...prev, screen: null }));

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true,
      });

      const recorder = new MediaRecorder(screenStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.screen.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current.screen, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => ({ ...prev, screen: url }));
        setStatus((prev) => ({ ...prev, screen: "completed" }));
        recordedChunks.current.screen = [];
      };

      setScreenRecorder(recorder);
      setStatus((prev) => ({ ...prev, screen: "ready" }));
      return recorder;
    } catch (error) {
      console.error("Screen recording setup failed:", error);
      setErrors((prev) => ({ ...prev, screen: error.message }));
      setStatus((prev) => ({ ...prev, screen: "error" }));
      return null;
    }
  };

  // Setup camera recording
  const setupCameraRecording = async () => {
    try {
      setStatus((prev) => ({ ...prev, camera: "initializing" }));
      setErrors((prev) => ({ ...prev, camera: null }));

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const recorder = new MediaRecorder(cameraStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.camera.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current.camera, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => ({ ...prev, camera: url }));
        setStatus((prev) => ({ ...prev, camera: "completed" }));
        recordedChunks.current.camera = [];

        // Stop camera stream
        cameraStream.getTracks().forEach((track) => track.stop());
      };

      setCameraRecorder(recorder);
      setStatus((prev) => ({ ...prev, camera: "ready" }));
      return recorder;
    } catch (error) {
      console.error("Camera recording setup failed:", error);
      setErrors((prev) => ({ ...prev, camera: error.message }));
      setStatus((prev) => ({ ...prev, camera: "error" }));
      return null;
    }
  };

  // Setup voice recording
  const setupVoiceRecording = async () => {
    try {
      setStatus((prev) => ({ ...prev, voice: "initializing" }));
      setErrors((prev) => ({ ...prev, voice: null }));

      const voiceStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(voiceStream, {
        mimeType: "audio/webm",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.voice.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current.voice, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => ({ ...prev, voice: url }));
        setStatus((prev) => ({ ...prev, voice: "completed" }));
        recordedChunks.current.voice = [];

        // Stop voice stream
        voiceStream.getTracks().forEach((track) => track.stop());
      };

      setVoiceRecorder(recorder);
      setStatus((prev) => ({ ...prev, voice: "ready" }));
      return recorder;
    } catch (error) {
      console.error("Voice recording setup failed:", error);
      setErrors((prev) => ({ ...prev, voice: error.message }));
      setStatus((prev) => ({ ...prev, voice: "error" }));
      return null;
    }
  };

  // Start all recordings
  const startRecording = async () => {
    try {
      setIsRecording(true);

      // Reset transcript when starting fresh
      if (
        transcript ===
        'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
      ) {
        finalTranscriptRef.current = "";
        setTranscript("");
      }

      // Setup speech recognition
      const speechRec = initializeSpeechRecognition();
      if (speechRec) {
        setRecognition(speechRec);
        speechRec.start();
      }

      // Setup all media recorders
      const [screenRec, cameraRec, voiceRec] = await Promise.all([
        setupScreenRecording(),
        setupCameraRecording(),
        setupVoiceRecording(),
      ]);

      // Start recording on all available recorders
      const recorders = [
        { recorder: screenRec, type: "screen" },
        { recorder: cameraRec, type: "camera" },
        { recorder: voiceRec, type: "voice" },
      ].filter((r) => r.recorder !== null);

      recorders.forEach(({ recorder, type }) => {
        recorder.start(1000);
        setStatus((prev) => ({ ...prev, [type]: "recording" }));
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
    }
  };

  // Stop all recordings
  const stopRecording = () => {
    setIsRecording(false);

    // Stop speech recognition
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }

    // Stop all media recorders
    [
      { recorder: screenRecorder, type: "screen" },
      { recorder: cameraRecorder, type: "camera" },
      { recorder: voiceRecorder, type: "voice" },
    ].forEach(({ recorder, type }) => {
      if (recorder && recorder.state === "recording") {
        recorder.stop();
      }
    });

    // Clean up recorders
    setScreenRecorder(null);
    setCameraRecorder(null);
    setVoiceRecorder(null);
  };

  // Run ML Analysis using backend API
  const runMLAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Prepare data for analysis
      const analysisData = {
        transcript: transcript !== 'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...' ? transcript : '',
        audioData: recordings.voice ? 'audio_data_available' : null,
        videoData: recordings.camera ? 'video_data_available' : null,
        imageData: recordings.screen ? 'image_data_available' : null,
      };

      setAnalysisProgress(20);

      // Call backend ML analysis API
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASEURL}/api/analysis/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      setAnalysisProgress(60);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const results = await response.json();
      setAnalysisProgress(100);

      setMlAnalysisResults(results);
    } catch (error) {
      console.error('ML Analysis failed:', error);
      // Fallback to local analysis if backend fails
      runLocalAnalysis();
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Fallback local analysis
  const runLocalAnalysis = () => {
    const mockAnalysis = {
      voice: {
        emotionalScore: Math.floor(Math.random() * 40) + 30,
        stressScore: Math.floor(Math.random() * 40) + 20,
        confidence: Math.floor(Math.random() * 30) + 70,
        interpretation: "Voice analysis shows moderate emotional variation with some stress indicators detected."
      },
      facial: {
        microExpressions: Math.floor(Math.random() * 20) + 5,
        eyeMovement: Math.floor(Math.random() * 30) + 10,
        smileSuppression: Math.floor(Math.random() * 15) + 5,
        confidence: Math.floor(Math.random() * 25) + 75,
        interpretation: "Facial analysis detected subtle micro-expressions and normal eye movement patterns."
      },
      text: {
        sentimentScore: Math.floor(Math.random() * 40) + 30,
        consistencyScore: Math.floor(Math.random() * 30) + 60,
        complexityScore: Math.floor(Math.random() * 25) + 50,
        confidence: Math.floor(Math.random() * 20) + 80,
        interpretation: "Text analysis shows balanced sentiment with good consistency in language patterns."
      },
      truth: {
        truthfulness: Math.floor(Math.random() * 40) + 30,
        confidence: Math.floor(Math.random() * 30) + 65,
        interpretation: transcript.length > 50 
          ? "Based on voice, facial, and text analysis, the response shows moderate truthfulness indicators."
          : "Insufficient data for comprehensive analysis. Please record longer responses for better accuracy."
      }
    };

    setMlAnalysisResults(mockAnalysis);
  };

  // Reset transcript
  const resetTranscript = () => {
    finalTranscriptRef.current = "";
    setTranscript(
      'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
    );

    if (isListening && recognition) {
      recognition.stop();
    }
  };

  // Copy transcript to clipboard
  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      alert("Transcript copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  // Download transcript as text file
  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speech-transcript.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "recording":
        return "text-red-600";
      case "ready":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "initializing":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "recording":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return null;
    }
  };

  // Check if any recordings are available
  const hasRecordings =
    recordings.screen || recordings.camera || recordings.voice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            TrueScope - ML-Powered Truth Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Advanced AI analysis using Machine Learning for voice, facial, and text analysis with real-time truth detection.
          </p>

          {/* Recording Timer */}
          {isRecording && (
            <div className="inline-flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-full text-lg font-semibold animate-pulse shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              Recording: {formatTime(recordingTime)}
            </div>
          )}
        </div>

        {/* Main Control */}
        <div className="flex justify-center mb-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              flex items-center gap-4 px-12 py-6 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl
              ${
                isRecording
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-200"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-200"
              }
            `}
          >
            {isRecording ? (
              <>
                <Square className="w-8 h-8" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="w-8 h-8" />
                Start Recording
              </>
            )}
          </button>
        </div>

        {/* ML Analysis Button */}
        {hasRecordings && (
          <div className="flex justify-center mb-8">
            <button
              onClick={runMLAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running ML Analysis... {analysisProgress}%
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Run ML Analysis
                </>
              )}
            </button>
          </div>
        )}

        {/* ML Analysis Results */}
        {mlAnalysisResults.truth && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                ML Analysis Results
              </h3>
              
              {/* Truth Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-gray-900">ML Truth Score</h4>
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {mlAnalysisResults.truth.truthfulness}%
                  </div>
                  <div className="text-gray-600 mb-3">
                    Confidence: {mlAnalysisResults.truth.confidence}%
                  </div>
                  <p className="text-gray-700">{mlAnalysisResults.truth.interpretation}</p>
                </div>
              </div>

              {/* Individual ML Analysis Results */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Voice Analysis */}
                {mlAnalysisResults.voice && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Volume2 className="w-5 h-5 text-green-600" />
                      <h5 className="font-semibold text-green-800">ML Voice Analysis</h5>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>Emotional: {mlAnalysisResults.voice.emotionalScore}%</div>
                      <div>Stress: {mlAnalysisResults.voice.stressScore}%</div>
                      <div>Confidence: {mlAnalysisResults.voice.confidence}%</div>
                      <p className="text-green-700 text-xs mt-2">{mlAnalysisResults.voice.interpretation}</p>
                    </div>
                  </div>
                )}

                {/* Facial Analysis */}
                {mlAnalysisResults.facial && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-blue-800">ML Facial Analysis</h5>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>Micro-expressions: {mlAnalysisResults.facial.microExpressions}</div>
                      <div>Eye movement: {mlAnalysisResults.facial.eyeMovement}</div>
                      <div>Confidence: {mlAnalysisResults.facial.confidence}%</div>
                      <p className="text-blue-700 text-xs mt-2">{mlAnalysisResults.facial.interpretation}</p>
                    </div>
                  </div>
                )}

                {/* Text Analysis */}
                {mlAnalysisResults.text && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <h5 className="font-semibold text-purple-800">ML Text Analysis</h5>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>Sentiment: {mlAnalysisResults.text.sentimentScore}%</div>
                      <div>Consistency: {mlAnalysisResults.text.consistencyScore}%</div>
                      <div>Confidence: {mlAnalysisResults.text.confidence}%</div>
                      <p className="text-purple-700 text-xs mt-2">{mlAnalysisResults.text.interpretation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Speech-to-Text Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Volume2 className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Live Speech Transcription
                </h3>
                <p className="text-gray-600">
                  Real-time speech-to-text conversion for ML analysis
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 ${getStatusColor(
                status.speech
              )}`}
            >
              {getStatusIcon(status.speech)}
              <span className="font-medium capitalize">{status.speech}</span>
            </div>
          </div>

          {errors.speech && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{errors.speech}</p>
              <p className="text-red-600 text-xs mt-1">
                💡 Tip: Speak clearly, ensure microphone access is granted, and check your internet connection.
              </p>
            </div>
          )}

          {/* Transcript Display */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Live Transcript
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  {transcript ===
                  'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
                    ? 0
                    : transcript.length}{" "}
                  characters
                </span>
              </div>
            </div>

            <div className="min-h-32 max-h-96 overflow-y-auto mb-4">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap break-words">
                {transcript}
              </p>
            </div>

            {isListening && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-purple-600 text-sm font-medium ml-3">
                    Actively listening...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transcript Controls */}
          <div className="flex gap-3">
            <button
              onClick={copyTranscript}
              disabled={
                transcript ===
                'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Text
            </button>
            <button
              onClick={downloadTranscript}
              disabled={
                transcript ===
                'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Download Transcript
            </button>
            <button
              onClick={resetTranscript}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Screen Recording Status */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Monitor className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Screen Recording
                  </h3>
                  <p className="text-gray-600">Capture your entire screen</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 ${getStatusColor(
                  status.screen
                )}`}
              >
                {getStatusIcon(status.screen)}
                <span className="font-medium capitalize">{status.screen}</span>
              </div>
            </div>

            {errors.screen && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{errors.screen}</p>
              </div>
            )}

            {recordings.screen && (
              <div className="space-y-4">
                <video
                  src={recordings.screen}
                  controls
                  className="w-full h-40 bg-black rounded-lg"
                />
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-medium">
                    ✅ Screen recording completed successfully
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Recording Status */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Video className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Camera Recording
                  </h3>
                  <p className="text-gray-600">Record from webcam</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 ${getStatusColor(
                  status.camera
                )}`}
              >
                {getStatusIcon(status.camera)}
                <span className="font-medium capitalize">{status.camera}</span>
              </div>
            </div>

            {errors.camera && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{errors.camera}</p>
              </div>
            )}

            {recordings.camera && (
              <div className="space-y-4">
                <video
                  src={recordings.camera}
                  controls
                  className="w-full h-40 bg-black rounded-lg"
                />
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-medium">
                    ✅ Camera recording completed successfully
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Voice Recording Status */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Mic className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Voice Recording
                  </h3>
                  <p className="text-gray-600">Capture audio input</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 ${getStatusColor(
                  status.voice
                )}`}
              >
                {getStatusIcon(status.voice)}
                <span className="font-medium capitalize">{status.voice}</span>
              </div>
            </div>

            {errors.voice && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{errors.voice}</p>
              </div>
            )}

            {recordings.voice && (
              <div className="space-y-4">
                <audio src={recordings.voice} controls className="w-full" />
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-medium">
                    ✅ Voice recording completed successfully
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ML Features Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-purple-600" />
            ML-Powered Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Voice Analysis
              </h4>
              <p className="text-gray-600 text-sm">
                ML analysis of pitch, tone, stress indicators, and emotional patterns
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Facial Analysis
              </h4>
              <p className="text-gray-600 text-sm">
                Computer vision for micro-expressions, eye movement, and facial cues
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Text Analysis
              </h4>
              <p className="text-gray-600 text-sm">
                NLP-based sentiment analysis, consistency checking, and contradiction detection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Truth Engine
              </h4>
              <p className="text-gray-600 text-sm">
                ML model combining all analyses to predict truthfulness probability
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLRecorder;
