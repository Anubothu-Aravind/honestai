import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
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
  Upload,
} from "lucide-react";

const UnifiedMediaRecorder = () => {
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
  const [speechSupported, setSpeechSupported] = useState(false);
  const finalTranscriptRef = useRef("");

  // Recorded data
  const [recordings, setRecordings] = useState({
    screen: null,
    camera: null,
    voice: null,
  });

  // Upload states
  const [isUploading, setIsUploading] = useState({
    screen: false,
    camera: false,
    voice: false,
    all: false,
  });

  const [uploadUrls, setUploadUrls] = useState({
    screen: null,
    camera: null,
    voice: null,
  });

  // Analysis results
  const [analysisResults, setAnalysisResults] = useState({
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
    analysis: null,
  });

  // Analysis progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const recordedChunks = useRef({
    screen: [],
    camera: [],
    voice: [],
  });

  // Check browser support on mount
  useEffect(() => {
    const checkSpeechSupport = () => {
      const supported =
        "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      setSpeechSupported(supported);
      if (!supported) {
        setErrors((prev) => ({
          ...prev,
          speech:
            "Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.",
        }));
      }
    };
    checkSpeechSupport();
  }, []);

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

  // Initialize speech recognition with better error handling
  const initializeSpeechRecognition = async () => {
    if (!speechSupported) {
      setErrors((prev) => ({
        ...prev,
        speech: "Speech recognition not supported in this browser",
      }));
      return null;
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

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

        const displayTranscript =
          finalTranscriptRef.current + interimTranscript;
        setTranscript(
          displayTranscript.trim() ||
            'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
        );
      };

      recognitionInstance.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        setStatus((prev) => ({ ...prev, speech: "recording" }));
        setErrors((prev) => ({ ...prev, speech: null }));
      };

      recognitionInstance.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        setStatus((prev) => ({ ...prev, speech: "completed" }));
      };
      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setStatus((prev) => ({ ...prev, speech: "error" }));

        let errorMessage = "Speech recognition error";
        switch (event.error) {
          case "not-allowed":
            errorMessage =
              "Microphone access denied. Please allow microphone access and try again.";
            break;
          case "no-speech":
            errorMessage =
              "No speech detected. Please speak louder or closer to the microphone.";
            break;
          case "audio-capture":
            errorMessage =
              "No microphone found. Please check your microphone connection.";
            break;
          case "network":
            errorMessage =
              "Network error: Cannot connect to speech recognition service. Please check: 1) Internet connection is active, 2) You're using HTTPS or localhost (not IP address), 3) Disable VPN if active, 4) Use Chrome or Edge browser.";
            break;
          case "service-not-allowed":
            errorMessage =
              "Speech recognition service not allowed. Please check browser permissions.";
            break;
          case "aborted":
            errorMessage = "Speech recognition was aborted. Please try again.";
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}. Try refreshing the page or using Chrome/Edge browser.`;
        }

        setErrors((prev) => ({ ...prev, speech: errorMessage }));
      };

      return recognitionInstance;
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
      setErrors((prev) => ({
        ...prev,
        speech:
          "Failed to access microphone. Please allow microphone permissions.",
      }));
      return null;
    }
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

      // Setup speech recognition if supported
      if (speechSupported) {
        const speechRec = await initializeSpeechRecognition();
        if (speechRec) {
          setRecognition(speechRec);
          try {
            speechRec.start();
          } catch (error) {
            console.error("Failed to start speech recognition:", error);
            setErrors((prev) => ({
              ...prev,
              speech: "Failed to start speech recognition. Please try again.",
            }));
          }
        }
      }

      // Setup all media recorders
      const [screenRec, cameraRec, voiceRec] = await Promise.all([
        setupScreenRecording().catch(() => null),
        setupCameraRecording().catch(() => null),
        setupVoiceRecording().catch(() => null),
      ]);

      // Start recording on all available recorders
      const recorders = [
        { recorder: screenRec, type: "screen" },
        { recorder: cameraRec, type: "camera" },
        { recorder: voiceRec, type: "voice" },
      ].filter((r) => r.recorder !== null);

      recorders.forEach(({ recorder, type }) => {
        try {
          recorder.start(1000);
          setStatus((prev) => ({ ...prev, [type]: "recording" }));
        } catch (error) {
          console.error(`Failed to start ${type} recording:`, error);
          setErrors((prev) => ({
            ...prev,
            [type]: `Failed to start ${type} recording`,
          }));
        }
      });

      if (recorders.length === 0) {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to start any recordings. Please check permissions.",
        }));
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
    }
  };

  // Stop all recordings
  const stopRecording = () => {
    setIsRecording(false);

    // Stop speech recognition
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      setRecognition(null);
    }

    // Stop all media recorders
    [
      { recorder: screenRecorder, type: "screen" },
      { recorder: cameraRecorder, type: "camera" },
      { recorder: voiceRecorder, type: "voice" },
    ].forEach(({ recorder, type }) => {
      if (recorder && recorder.state === "recording") {
        try {
          recorder.stop();
        } catch (error) {
          console.error(`Error stopping ${type} recorder:`, error);
        }
      }
    });

    // Clean up recorders
    setScreenRecorder(null);
    setCameraRecorder(null);
    setVoiceRecorder(null);
  };

  // Test speech recognition
  const testSpeechRecognition = async () => {
    if (!speechSupported) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    try {
      const testRecognition = await initializeSpeechRecognition();
      if (testRecognition) {
        testRecognition.start();
        setTimeout(() => {
          if (testRecognition) {
            testRecognition.stop();
          }
        }, 3000);
        alert("Speech recognition test started. Speak for 3 seconds...");
      }
    } catch (error) {
      alert("Failed to test speech recognition: " + error.message);
    }
  };

  // Convert blob URL to File
  const urlToFile = async (url, filename, mimeType) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  };

  const uploadFile = async (type) => {
    try {
      const data = new FormData();
      let file, filename, preset, resourceType;

      if (type === "screen" && recordings.screen) {
        file = await urlToFile(
          recordings.screen,
          "screen-recording.webm",
          "video/webm"
        );
        filename = "screen-recording.webm";
        preset = "Screen_record";
        resourceType = "video";
      } else if (type === "camera" && recordings.camera) {
        file = await urlToFile(
          recordings.camera,
          "camera-recording.webm",
          "video/webm"
        );
        filename = "camera-recording.webm";
        preset = "video_preset";
        resourceType = "video";
      } else if (type === "voice" && recordings.voice) {
        file = await urlToFile(
          recordings.voice,
          "voice-recording.webm",
          "audio/webm"
        );
        filename = "voice-recording.webm";
        preset = "Audio_preset";
        resourceType = "video";
      }

      if (!file) throw new Error(`No ${type} recording available`);

      data.append("file", file);
      data.append("upload_preset", preset);

      const cloudName = "drxnwviii";
      const api = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const response = await fetch(api, {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (result.secure_url) {
        console.log(`${type} uploaded:`, result.secure_url);
        return result.secure_url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(`${type} upload error:`, error.message);
      throw error;
    }
  };

  // Handle single upload
  const handleSingleUpload = async (type) => {
    try {
      setIsUploading((prev) => ({ ...prev, [type]: true }));
      setErrors((prev) => ({ ...prev, upload: null }));

      const url = await uploadFile(type);
      setUploadUrls((prev) => ({ ...prev, [type]: url }));

      console.log(`${type} upload success!`);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        upload: `Failed to upload ${type}: ${error.message}`,
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Handle upload all
  const handleUploadAll = async () => {
    try {
      setIsUploading((prev) => ({ ...prev, all: true }));
      setErrors((prev) => ({ ...prev, upload: null }));

      // Upload all available recordings
      const uploadPromises = [];
      const types = [];

      if (recordings.screen) {
        uploadPromises.push(uploadFile("screen"));
        types.push("screen");
      }
      if (recordings.camera) {
        uploadPromises.push(uploadFile("camera"));
        types.push("camera");
      }
      if (recordings.voice) {
        uploadPromises.push(uploadFile("voice"));
        types.push("voice");
      }

      if (uploadPromises.length === 0) {
        throw new Error("No recordings available to upload");
      }

      const urls = await Promise.all(uploadPromises);

      // Update upload URLs
      const newUploadUrls = { ...uploadUrls };
      types.forEach((type, index) => {
        newUploadUrls[type] = urls[index];
      });
      setUploadUrls(newUploadUrls);

      // Send to backend API
      const backendUrl = "http://localhost:5001";
      await fetch(`${backendUrl}/api/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: newUploadUrls.voice,
          videoUrl: newUploadUrls.camera,
          screenUrl: newUploadUrls.screen,
        }),
      });

      console.log("All files uploaded successfully!");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        upload: `Failed to upload files: ${error.message}`,
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, all: false }));
    }
  };

  // Convert blob URL to base64 for backend processing
  const blobUrlToBase64 = async (blobUrl) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Run ML Analysis using backend API with session creation
  const runMLAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setErrors((prev) => ({ ...prev, analysis: null }));

    try {
      console.log("Starting ML Analysis...");

      // Prepare data for analysis
      const analysisData = {
        transcript:
          transcript !==
          'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
            ? transcript
            : "",
        audioData: null,
        videoData: null,
        imageData: null,
      };

      // Convert recorded media to base64 if available
      if (recordings.voice) {
        try {
          analysisData.audioData = await blobUrlToBase64(recordings.voice);
        } catch (e) {
          console.warn("Audio conversion failed:", e);
        }
      }
      setAnalysisProgress(25);

      if (recordings.camera) {
        try {
          analysisData.videoData = await blobUrlToBase64(recordings.camera);
        } catch (e) {
          console.warn("Camera conversion failed:", e);
        }
      }
      setAnalysisProgress(50);

      if (recordings.screen) {
        try {
          analysisData.imageData = await blobUrlToBase64(recordings.screen);
        } catch (e) {
          console.warn("Screen conversion failed:", e);
        }
      }
      setAnalysisProgress(70);

      console.log("Analysis data prepared", {
        hasAudio: !!analysisData.audioData,
        hasVideo: !!analysisData.videoData,
        hasImage: !!analysisData.imageData,
        transcriptLength: analysisData.transcript?.length || 0,
      });

      // Call backend ML analysis API
      const backendUrl = "http://localhost:5001";
      console.log("Calling backend:", `${backendUrl}/api/analysis/all`);

      const response = await fetch(`${backendUrl}/api/analysis/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisData),
      });

      console.log("Response status:", response.status);
      setAnalysisProgress(90);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const results = await response.json();
      console.log("Analysis results:", results);
      setAnalysisProgress(100);

      setAnalysisResults(results);

      // Create session with results
      try {
        const sessionData = {
          userId:
            JSON.parse(localStorage.getItem("userInfo") || "{}")?.sub ||
            "demo-user-123",
          type: "recorded",
          transcript: analysisData.transcript,
          voice: results.voice,
          facial: results.facial,
          text: results.text,
          truth: results.truth,
          report: {
            shareId: "analysis-" + Date.now(),
          },
        };

        const sessionResponse = await fetch(`${backendUrl}/api/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData),
        });

        if (sessionResponse.ok) {
          console.log("Session created successfully");
        }
      } catch (sessionError) {
        console.warn("Failed to create session:", sessionError);
      }
    } catch (error) {
      console.error("ML Analysis failed:", error);
      setErrors((prev) => ({
        ...prev,
        analysis: `Analysis failed: ${error.message}. Make sure backend is running on http://localhost:5001`,
      }));
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Reset transcript
  const resetAll = () => {
    setRecordings({ screen: null, camera: null, voice: null });
    setUploadUrls({ screen: null, camera: null, voice: null });
    setAnalysisResults({ voice: null, facial: null, text: null, truth: null });
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setErrors({
      screen: null,
      camera: null,
      voice: null,
      speech: null,
      analysis: null,
    });
    setStatus({
      screen: "idle",
      camera: "idle",
      voice: "idle",
      speech: "idle",
    });
    finalTranscriptRef.current = "";
    setTranscript(
      'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
    );
    if (isListening && recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
  };

  const resetTranscript = () => {
    finalTranscriptRef.current = "";
    setTranscript(
      'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
    );

    if (isListening && recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="relative mb-12">
          {/* New Recording Button - Fixed Position */}
          <div className="fixed top-20 right-15 z-50">
            <button
              onClick={resetAll}
              className="group flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
              <span>New Recording</span>
            </button>
          </div>

          {/* Main Title Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              ML-Powered Truth Analysis
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              TrueScope
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Record and analyze screen, camera, and voice with real-time
              transcription and advanced ML truth detection
            </p>

            {/* Speech Support Status Badge */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {speechSupported ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  Speech Recognition Ready
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium border border-amber-200">
                  <AlertCircle className="w-4 h-4" />
                  Speech Recognition Unavailable
                </div>
              )}
              <button
                onClick={testSpeechRecognition}
                disabled={!speechSupported}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Test Speech
              </button>
            </div>
          </div>
        </header>

        {/* Recording Timer - Floating Badge */}
        {isRecording && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40">
            <div className="flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-lg font-semibold tabular-nums">
                Recording: {formatTime(recordingTime)}
              </span>
            </div>
          </div>
        )}

        {/* Main Recording Control */}
        <section className="flex justify-center mb-10">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
          group relative flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
          ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
              : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
          }
        `}
          >
            <span className="relative">
              {isRecording ? (
                <Square className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </span>
            <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
          </button>
        </section>

        {/* Action Buttons Row */}
        {hasRecordings && (
          <section className="flex flex-wrap justify-center gap-4 mb-10">
            <button
              onClick={handleUploadAll}
              disabled={isUploading.all}
              className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isUploading.all ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading All...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload All Recordings</span>
                </>
              )}
            </button>

            <button
              onClick={runMLAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing... {analysisProgress}%</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Run ML Analysis</span>
                </>
              )}
            </button>
          </section>
        )}

        {/* Analysis Error Alert */}
        {errors.analysis && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errors.analysis}</p>
            </div>
          </div>
        )}

        {/* Analysis Progress Card */}
        {isAnalyzing && (
          <div className="max-w-3xl mx-auto mb-10">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  ML Analysis in Progress
                </h3>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  Processing voice patterns, facial expressions, and text
                  semantics...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysisResults.truth && (
          <section className="max-w-5xl mx-auto mb-10">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-6">
                <h3 className="text-2xl font-bold text-white">
                  ML Analysis Results
                </h3>
              </div>

              <div className="p-8">
                {/* Truth Score Hero */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-100">
                  <div className="text-center space-y-4">
                    <h4 className="text-lg font-medium text-slate-700">
                      Overall Truth Score
                    </h4>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${
                            (analysisResults.truth.truthfulness / 100) * 352
                          } 352`}
                          className="text-indigo-500 transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-indigo-600">
                          {analysisResults.truth.truthfulness}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">
                        Confidence: {analysisResults.truth.confidence}%
                      </div>
                      <p className="text-slate-700 max-w-md mx-auto">
                        {analysisResults.truth.interpretation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Analysis Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Voice Analysis */}
                  {analysisResults.voice && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Volume2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h5 className="font-semibold text-emerald-900">
                          Voice Analysis
                        </h5>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            label: "Emotional",
                            value: analysisResults.voice.emotionalScore,
                          },
                          {
                            label: "Stress",
                            value: analysisResults.voice.stressScore,
                          },
                          {
                            label: "Pitch",
                            value: analysisResults.voice.pitchScore,
                          },
                          {
                            label: "Tone",
                            value: analysisResults.voice.toneScore,
                          },
                          {
                            label: "Confidence",
                            value: analysisResults.voice.confidence,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-slate-600">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-emerald-100 rounded-full h-1.5">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${item.value}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700 w-10 text-right">
                                {item.value}%
                              </span>
                            </div>
                          </div>
                        ))}
                        <p className="text-emerald-700 text-xs mt-3 pt-3 border-t border-emerald-100">
                          {analysisResults.voice.interpretation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Facial Analysis */}
                  {analysisResults.facial && (
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <h5 className="font-semibold text-blue-900">
                          Facial Analysis
                        </h5>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Micro-expressions
                            </span>
                            <span className="font-medium text-slate-700">
                              {analysisResults.facial.microExpressions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Eye movement</span>
                            <span className="font-medium text-slate-700">
                              {analysisResults.facial.eyeMovement}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Head stability
                            </span>
                            <span className="font-medium text-slate-700">
                              {analysisResults.facial.headPoseStability}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Gaze stability
                            </span>
                            <span className="font-medium text-slate-700">
                              {analysisResults.facial.gazeStability}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Confidence</span>
                            <span className="font-medium text-slate-700">
                              {analysisResults.facial.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-blue-700 text-xs mt-3 pt-3 border-t border-blue-100">
                          {analysisResults.facial.interpretation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Text Analysis */}
                  {analysisResults.text && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <h5 className="font-semibold text-purple-900">
                          Text Analysis
                        </h5>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            label: "Sentiment",
                            value: analysisResults.text.sentimentScore,
                          },
                          {
                            label: "Consistency",
                            value: analysisResults.text.consistencyScore,
                          },
                          {
                            label: "Deception",
                            value: analysisResults.text.deceptionScore,
                          },
                          {
                            label: "Complexity",
                            value: analysisResults.text.complexityScore,
                          },
                          {
                            label: "Confidence",
                            value: analysisResults.text.confidence,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-slate-600">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-purple-100 rounded-full h-1.5">
                                <div
                                  className="bg-purple-500 h-1.5 rounded-full"
                                  style={{ width: `${item.value}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700 w-10 text-right">
                                {item.value}%
                              </span>
                            </div>
                          </div>
                        ))}
                        <p className="text-purple-700 text-xs mt-3 pt-3 border-t border-purple-100">
                          {analysisResults.text.interpretation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Live Transcription Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-10 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Live Speech Transcription
                  </h3>
                  <p className="text-purple-100 text-sm">
                    Real-time speech-to-text conversion
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur ${
                  status.speech === "active"
                    ? "text-emerald-100"
                    : status.speech === "error"
                    ? "text-red-100"
                    : "text-white/80"
                }`}
              >
                {getStatusIcon(status.speech)}
                <span className="text-sm font-medium capitalize">
                  {status.speech}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {errors.speech && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{errors.speech}</p>
              </div>
            )}

            {/* Transcript Display */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="px-6 py-4 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">
                    Live Transcript
                  </h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {transcript ===
                      'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
                        ? "0 characters"
                        : `${transcript.length} characters`}
                    </span>
                    {isListening && (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="text-sm text-purple-600 font-medium">
                          Listening
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="min-h-[120px] max-h-[400px] overflow-y-auto">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                    {transcript}
                  </p>
                </div>
              </div>
            </div>

            {/* Transcript Controls */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyTranscript}
                disabled={
                  transcript ===
                  'Click "Start Recording" to begin recording and see your speech transcribed here in real-time...'
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-lg font-medium transition-colors"
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
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-lg font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={resetTranscript}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Recording Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* Screen Recording Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Monitor className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Screen Recording
                    </h3>
                    <p className="text-sm text-slate-600">Desktop capture</p>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    status.screen === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : status.screen === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {status.screen}
                </div>
              </div>
            </div>

            <div className="p-6">
              {errors.screen && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-xs">{errors.screen}</p>
                </div>
              )}

              {recordings.screen && (
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                    <video
                      src={recordings.screen}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                  <button
                    onClick={() => handleSingleUpload("screen")}
                    disabled={isUploading.screen}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {isUploading.screen ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : uploadUrls.screen ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Screen
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Camera Recording Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Camera Recording
                    </h3>
                    <p className="text-sm text-slate-600">Webcam capture</p>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    status.camera === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : status.camera === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {status.camera}
                </div>
              </div>
            </div>

            <div className="p-6">
              {errors.camera && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-xs">{errors.camera}</p>
                </div>
              )}

              {recordings.camera && (
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                    <video
                      src={recordings.camera}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                  <button
                    onClick={() => handleSingleUpload("camera")}
                    disabled={isUploading.camera}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {isUploading.camera ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : uploadUrls.camera ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Camera
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Voice Recording Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Mic className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Voice Recording
                    </h3>
                    <p className="text-sm text-slate-600">Audio capture</p>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    status.voice === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : status.voice === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {status.voice}
                </div>
              </div>
            </div>

            <div className="p-6">
              {errors.voice && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-xs">{errors.voice}</p>
                </div>
              )}

              {recordings.voice && (
                <div className="space-y-4">
                  <audio src={recordings.voice} controls className="w-full" />
                  <button
                    onClick={() => handleSingleUpload("voice")}
                    disabled={isUploading.voice}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    {isUploading.voice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : uploadUrls.voice ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Voice
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMediaRecorder;
