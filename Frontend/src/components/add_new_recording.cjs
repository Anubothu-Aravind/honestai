const fs = require('fs');
const content = fs.readFileSync('Recorder.jsx', 'utf8');

// Add Plus import
const newContent = content.replace(
  'import { Play,',
  'import { Play, Plus,'
);

// Add reset all function
const resetFunction = `
  const resetAll = () => {
    setRecordings({ screen: null, camera: null, voice: null });
    setUploadUrls({ screen: null, camera: null, voice: null });
    setAnalysisResults({ voice: null, facial: null, text: null, truth: null });
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setErrors({ screen: null, camera: null, voice: null, speech: null, analysis: null });
    setStatus({ screen: "idle", camera: "idle", voice: "idle", speech: "idle" });
    finalTranscriptRef.current = "";
    setTranscript('Click "Start Recording" to begin recording and see your speech transcribed here in real-time...');
    if (isListening && recognition) {
      recognition.stop();
    }
  };
`;

const withReset = newContent.replace(
  'const resetTranscript = () => {',
  resetFunction + '  const resetTranscript = () => {'
);

// Add new recording button
const withButton = withReset.replace(
  '        {/* Header */}',
  `        {/* Header */}
        {/* New Recording Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Recording
          </button>
        </div>`
);

fs.writeFileSync('Recorder.jsx', withButton);
console.log('New Recording button added successfully!');
