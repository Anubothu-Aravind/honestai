import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Play,
  Square,
  Upload,
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
    upload: null,
  });

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

  // Initialize speech recognition
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
        setErrors((prev) => ({ ...prev, speech: "No speech detected" }));
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
        preset = "Screen_record"; // ✅ your Cloudinary preset
        resourceType = "video";
      } else if (type === "camera" && recordings.camera) {
        file = await urlToFile(
          recordings.camera,
          "camera-recording.webm",
          "video/webm"
        );
        filename = "camera-recording.webm";
        preset = "video_preset"; // ✅ your Cloudinary preset
        resourceType = "video";
      } else if (type === "voice" && recordings.voice) {
        file = await urlToFile(
          recordings.voice,
          "voice-recording.webm",
          "audio/webm"
        );
        filename = "voice-recording.webm";
        preset = "Audio_preset"; // ✅ your Cloudinary preset
        resourceType = "video"; // ✅ audio goes under video
      }

      if (!file) throw new Error(`No ${type} recording available`);

      data.append("file", file);
      data.append("upload_preset", preset);

      const cloudName = "drxnwviii";
      const api = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const response = await axios.post(api, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.secure_url) {
        console.log(`${type} uploaded:`, response.data.secure_url);
        return response.data.secure_url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(
        `${type} upload error:`,
        error.response?.data || error.message
      );
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
      const backendUrl = "http://localhost:5000"; // You need to set this
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
            All-in-One Media Recorder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Record screen, camera, and voice with real-time speech-to-text
            transcription. Upload all recordings to cloud storage.
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

        {/* Upload All Button */}
        {hasRecordings && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleUploadAll}
              disabled={isUploading.all}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg"
            >
              {isUploading.all ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading All...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload All Recordings
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Error */}
        {errors.upload && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.upload}</p>
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
                  Real-time speech-to-text conversion
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
                <button
                  onClick={() => handleSingleUpload("screen")}
                  disabled={isUploading.screen}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  {isUploading.screen ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadUrls.screen ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Uploaded Successfully
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Screen Recording
                    </>
                  )}
                </button>
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
                <button
                  onClick={() => handleSingleUpload("camera")}
                  disabled={isUploading.camera}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  {isUploading.camera ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadUrls.camera ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Uploaded Successfully
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Camera Recording
                    </>
                  )}
                </button>
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
                <button
                  onClick={() => handleSingleUpload("voice")}
                  disabled={isUploading.voice}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  {isUploading.voice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadUrls.voice ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Uploaded Successfully
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Voice Recording
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Status Section */}
        {(uploadUrls.screen || uploadUrls.camera || uploadUrls.voice) && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Upload Status
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {uploadUrls.screen && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Screen Recording
                    </h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Successfully uploaded to cloud
                  </p>
                  <p className="text-green-600 text-xs mt-1 truncate">
                    {uploadUrls.screen}
                  </p>
                </div>
              )}
              {uploadUrls.camera && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Camera Recording
                    </h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Successfully uploaded to cloud
                  </p>
                  <p className="text-green-600 text-xs mt-1 truncate">
                    {uploadUrls.camera}
                  </p>
                </div>
              )}
              {uploadUrls.voice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Mic className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Voice Recording
                    </h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Successfully uploaded to cloud
                  </p>
                  <p className="text-green-600 text-xs mt-1 truncate">
                    {uploadUrls.voice}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Tips for Best Results
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Clear Speech
              </h4>
              <p className="text-gray-600 text-sm">
                Speak clearly and at normal pace for better transcription
                accuracy
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Quiet Environment
              </h4>
              <p className="text-gray-600 text-sm">
                Use in quiet spaces to minimize background noise interference
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Screen Sharing
              </h4>
              <p className="text-gray-600 text-sm">
                Select the right screen or application to share for recording
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Cloud Upload
              </h4>
              <p className="text-gray-600 text-sm">
                Upload recordings to cloud storage for easy access and sharing
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                Configuration Required
              </h4>
              <p className="text-yellow-700 text-sm mb-3">
                To enable cloud uploads, please configure the following in your
                code:
              </p>
              <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                <li>
                  Replace "your_cloudinary_cloud_name" with your actual
                  Cloudinary cloud name
                </li>
                <li>
                  Set up upload presets: "audio_preset", "videos_preset",
                  "screen_preset"
                </li>
                <li>
                  Replace "your_backend_url" with your actual backend API URL
                </li>
                <li>
                  Ensure your backend API accepts POST requests to
                  "/api/uploads"
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMediaRecorder;
