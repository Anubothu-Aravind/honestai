# Honest AI - All-in-One Media Recorder

A comprehensive full-stack application that provides unified media recording capabilities including screen recording, camera recording, voice recording, and real-time speech-to-text transcription with cloud storage integration.

## 🚀 Features

### Core Recording Capabilities
- **Screen Recording**: Capture your entire screen or specific applications
- **Camera Recording**: Record from webcam with audio
- **Voice Recording**: High-quality audio recording from microphone
- **Unified Recording**: Record all three simultaneously with synchronized timing

### Advanced Features
- **Real-time Speech-to-Text**: Live transcription during recording using Web Speech API
- **Cloud Storage Integration**: Upload recordings to Cloudinary with organized presets
- **Google OAuth Integration**: Secure user authentication
- **Google Drive Integration**: Direct upload to Google Drive
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **Real-time Status Tracking**: Live status updates for all recording processes

### Speech Transcription Features
- Live speech-to-text conversion
- Copy transcript to clipboard
- Download transcript as text file
- Reset and manage transcriptions
- Support for continuous speech recognition

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Cloudinary** - Cloud-based media management
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Key Libraries
- **react-media-recorder** - Media recording functionality
- **react-speech-recognition** - Speech-to-text capabilities
- **@react-oauth/google** - Google OAuth integration
- **react-google-drive-picker** - Google Drive integration
- **jwt-decode** - JWT token handling

## 📁 Project Structure

```
honest-ai/
├── Frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx      # Landing page component
│   │   │   ├── Recorder.jsx     # Basic recorder component
│   │   │   └── UnifiedMediaRecorder.jsx  # Main recording interface
│   │   ├── App.jsx              # Main app component with routing
│   │   └── main.jsx             # Application entry point
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
│
├── Backend/                     # Node.js backend API
│   ├── controllers/             # Request handlers
│   │   ├── audio.js             # Audio recording logic
│   │   ├── video.js             # Video recording logic
│   │   ├── screen.js            # Screen recording logic
│   │   └── sign-upload.js       # Upload signature generation
│   ├── models/                  # Database models
│   │   ├── Audio.js             # Audio recording model
│   │   ├── Video.js             # Video recording model
│   │   └── screen_recorder.js   # Screen recording model
│   ├── Routes/                  # API routes
│   │   ├── audio.js             # Audio endpoints
│   │   ├── video.js             # Video endpoints
│   │   ├── screen.js            # Screen recording endpoints
│   │   ├── upload.js            # File upload endpoints
│   │   └── uploads.js           # Batch upload endpoints
│   ├── config/
│   │   └── db.js                # Database connection
│   ├── middlewares/
│   │   └── error.js             # Error handling middleware
│   ├── server.js                # Express server setup
│   └── package.json             # Backend dependencies
│
└── README.md                    # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Cloudinary Account** (for media storage)
- **Google OAuth Credentials** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd honest-ai
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../Frontend
   npm install
   ```

### Environment Configuration

#### Backend Environment Variables
Create a `.env` file in the `Backend` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/honest-ai
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/honest-ai

# Server Configuration
PORT=5000
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret (if using authentication)
JWT_SECRET=your_jwt_secret_key
```

#### Frontend Environment Variables
Create a `.env` file in the `Frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary (for direct uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Cloudinary Setup

1. **Create a Cloudinary account** at [cloudinary.com](https://cloudinary.com)

2. **Set up Upload Presets**:
   - `Screen_record` - for screen recordings
   - `video_preset` - for camera recordings  
   - `Audio_preset` - for voice recordings

3. **Configure Upload Presets**:
   - Go to Settings → Upload
   - Create unsigned upload presets
   - Set appropriate folder structures and transformations

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm run dev
   # or
   npm start
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd Frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the Application**
   Open your browser and navigate to `http://localhost:5173`

## 📖 Usage Guide

### Basic Recording Workflow

1. **Navigate to the Application**
   - Visit the landing page
   - Choose between basic recorder or unified media recorder

2. **Start Recording**
   - Click "Start Recording" to begin all recording types simultaneously
   - Grant necessary permissions for camera, microphone, and screen sharing
   - Monitor real-time status for each recording type

3. **Speech Transcription**
   - Speech-to-text transcription starts automatically
   - View live transcript in the dedicated section
   - Copy or download transcript as needed

4. **Stop Recording**
   - Click "Stop Recording" to end all recordings
   - Preview recorded media in their respective sections

5. **Upload to Cloud**
   - Upload individual recordings or all at once
   - Monitor upload progress and status
   - Access cloud URLs for sharing

### API Endpoints

#### Recording Endpoints
- `GET /api/videos` - Retrieve video recordings
- `POST /api/videos` - Create new video recording
- `GET /api/audios` - Retrieve audio recordings
- `POST /api/audios` - Create new audio recording
- `GET /api/screens` - Retrieve screen recordings
- `POST /api/screens` - Create new screen recording

#### Upload Endpoints
- `POST /api/upload` - Single file upload
- `POST /api/uploads` - Batch file upload

#### Example API Usage
```javascript
// Upload all recordings
const response = await fetch('http://localhost:5000/api/uploads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audioUrl: 'cloudinary_audio_url',
    videoUrl: 'cloudinary_video_url',
    screenUrl: 'cloudinary_screen_url'
  })
});
```

## 🔧 Configuration

### Browser Permissions
The application requires the following browser permissions:
- **Camera Access** - for video recording
- **Microphone Access** - for audio recording and speech recognition
- **Screen Sharing** - for screen recording

### Supported Browsers
- **Chrome** (recommended) - Full feature support
- **Firefox** - Full feature support
- **Safari** - Limited speech recognition support
- **Edge** - Full feature support

### Media Format Support
- **Video**: WebM with VP9 codec
- **Audio**: WebM audio format
- **Screen**: WebM with VP9 codec

## 🚨 Troubleshooting

### Common Issues

1. **Speech Recognition Not Working**
   - Ensure you're using a supported browser (Chrome/Firefox recommended)
   - Check microphone permissions
   - Verify HTTPS connection (required for speech recognition)

2. **Recording Permissions Denied**
   - Check browser permissions for camera/microphone
   - Ensure secure context (HTTPS or localhost)
   - Try refreshing the page and granting permissions again

3. **Upload Failures**
   - Verify Cloudinary configuration
   - Check upload preset settings
   - Ensure file size limits are appropriate

4. **Database Connection Issues**
   - Verify MongoDB is running
   - Check connection string in environment variables
   - Ensure database permissions are correct

### Performance Optimization

1. **Large File Handling**
   - Consider implementing chunked uploads for large recordings
   - Set appropriate timeout values for uploads
   - Monitor memory usage during long recordings

2. **Browser Performance**
   - Close unnecessary tabs during recording
   - Ensure sufficient system resources
   - Use hardware acceleration when available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add appropriate error handling
- Include comments for complex logic
- Test thoroughly across different browsers
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Web Speech API** for speech recognition capabilities
- **MediaRecorder API** for recording functionality
- **Cloudinary** for cloud storage solutions
- **React Community** for excellent libraries and tools
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using React, Node.js, and modern web technologies**
# TrueScope---AI-Powered-Truth-Analyzer
# honest-ai
