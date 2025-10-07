import React from "react";
import {
  Mic,
  Video,
  FileText,
  Target,
  FileBarChart,
  Users,
  ArrowRight,
  Shield,
  Clock,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom"; // ✅ import Link for routing

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Truth Analysis
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Advanced speech, facial expression, and text analysis to estimate
            truthfulness. Perfect for HR screening, coaching sessions, and
            personal development.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/Recorder" // ✅ plain routing link
              className="group bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2 text-lg font-semibold transform hover:scale-105"
            >
              Start Analysis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>2 min setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Real-time results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Comprehensive Analysis Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Multi-modal AI technology combining voice, facial, and text
              analysis for accurate insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice Analysis"
              desc="Advanced pitch, tone, and hesitation detection. Identifies stress patterns and emotional states through sophisticated audio processing."
              color="indigo"
            />
            <FeatureCard
              icon={<Video className="w-6 h-6" />}
              title="Facial Analysis"
              desc="Real-time detection of micro-expressions, blink rates, and eye movement patterns using computer vision technology."
              color="purple"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Text Analysis"
              desc="NLP-powered sentiment analysis detecting inconsistencies, emotional tone shifts, and linguistic patterns in responses."
              color="blue"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Truth Score Engine"
              desc="Proprietary AI model combining multi-modal inputs to generate accuracy-weighted truthfulness probability scores."
              color="pink"
            />
            <FeatureCard
              icon={<FileBarChart className="w-6 h-6" />}
              title="Session Reports"
              desc="Comprehensive PDF reports with historical tracking, trend analysis, and actionable insights for continuous improvement."
              color="green"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Admin Dashboard"
              desc="Enterprise-grade user management, custom test creation, and organization-wide analytics with role-based access."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Simple 3-Step Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessStep
              number="1"
              title="Record Session"
              desc="Start recording with audio and video enabled. Answer questions naturally while our AI captures all data points."
            />
            <ProcessStep
              number="2"
              title="AI Analysis"
              desc="Our advanced algorithms process voice patterns, facial cues, and text responses in real-time with multi-factor analysis."
            />
            <ProcessStep
              number="3"
              title="Get Insights"
              desc="Receive detailed truth score, comprehensive breakdown, and actionable recommendations within seconds."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Discover the Truth?
          </h2>
          <p className="text-xl mb-10 text-indigo-100">
            Join thousands of professionals using AI-powered credibility
            analysis
          </p>
          <button className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-5 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg font-semibold transform hover:scale-105">
            Sign In with Google
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
            <TrustBadge number="99.2%" label="Accuracy Rate" />
            <TrustBadge number="500+" label="Organizations" />
            <TrustBadge number="50K+" label="Sessions Analyzed" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold text-white mb-2">TrueScope</p>
              <p className="text-sm">
                © {new Date().getFullYear()} TrueScope. Not a legal polygraph.
              </p>
              <p className="text-sm">
                For HR, coaching & personal development only.
              </p>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, desc, color }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    pink: "from-pink-500 to-pink-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="group p-8 bg-white border border-gray-200 rounded-3xl hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-2">
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorMap[color]} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

// Process Step Component
function ProcessStep({ number, title, desc }) {
  return (
    <div className="relative text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
        {number}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

// Trust Badge Component
function TrustBadge({ number, label }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold mb-2">{number}</div>
      <div className="text-sm text-indigo-200">{label}</div>
    </div>
  );
}
