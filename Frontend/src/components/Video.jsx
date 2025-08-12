import React from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import {
  Monitor,
  Video as VideoIcon,
  Square,
  Play,
  Download,
  Loader2,
} from "lucide-react";

export default function Video() {
  const {
    status: screenStatus,
    startRecording: startScreenRecording,
    stopRecording: stopScreenRecording,
    mediaBlobUrl: screenBlobUrl,
  } = useReactMediaRecorder({
    screen: true,
    audio: true,
    video: true,
  });

  const {
    status: camStatus,
    startRecording: startCamRecording,
    stopRecording: stopCamRecording,
    mediaBlobUrl: camBlobUrl,
  } = useReactMediaRecorder({
    video: true,
    audio: true,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "recording":
        return "text-red-500";
      case "idle":
        return "text-gray-500";
      case "stopped":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses =
      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "recording":
        return `${baseClasses} bg-red-100 text-red-800 animate-pulse`;
      case "idle":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "stopped":
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const downloadVideo = (blobUrl, filename) => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const RecordingCard = ({
    title,
    icon: Icon,
    status,
    startRecording,
    stopRecording,
    blobUrl,
    filename,
  }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icon size={24} />
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
          <div className={getStatusBadge(status)}>
            {status === "recording" && (
              <Loader2 size={12} className="animate-spin" />
            )}
            <span className="capitalize">{status}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          {status === "recording" ? (
            <button
              onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <Square size={18} />
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 hover:scale-105 transform"
            >
              <Play size={18} />
              Start Recording
            </button>
          )}
        </div>

        {blobUrl && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <video
                src={blobUrl}
                controls
                className="w-full h-48 object-cover"
                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNsaWNrIHRvIHBsYXk8L3RleHQ+PC9zdmc+"
              />
            </div>
            <button
              onClick={() => downloadVideo(blobUrl, filename)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <Download size={16} />
              Download Recording
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Video Recorder
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Record your screen or webcam with high-quality output. Perfect for
            tutorials, presentations, and video calls.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <RecordingCard
            title="Screen Recording"
            icon={Monitor}
            status={screenStatus}
            startRecording={startScreenRecording}
            stopRecording={stopScreenRecording}
            blobUrl={screenBlobUrl}
            filename="screen-recording.webm"
          />

          <RecordingCard
            title="Webcam Recording"
            icon={VideoIcon}
            status={camStatus}
            startRecording={startCamRecording}
            stopRecording={stopCamRecording}
            blobUrl={camBlobUrl}
            filename="webcam-recording.webm"
          />
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Monitor size={20} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Screen Capture</h4>
                <p className="text-sm text-gray-600">
                  Record your entire screen or specific applications
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <VideoIcon size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Webcam Recording</h4>
                <p className="text-sm text-gray-600">
                  High-quality video recording from your camera
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Easy Download</h4>
                <p className="text-sm text-gray-600">
                  Download your recordings instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
