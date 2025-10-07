import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const StatCard = ({ title, value, subtitle, trend }) => (
  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          {title}
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-1">{value}</div>
        {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
      </div>
      {trend && (
        <div className="ml-4 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors">
          <span className="text-2xl">{trend}</span>
        </div>
      )}
    </div>
  </div>
);

const ProgressBar = ({ percent, color = "bg-green-500" }) => {
  const safePercent = Math.max(0, Math.min(100, percent || 0));
  return (
    <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${safePercent}%` }}
      >
        <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
      </div>
    </div>
  );
};

const percentColor = (p) => {
  if (p >= 70) return "bg-emerald-500";
  if (p >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const isAdmin =
    typeof window !== "undefined" &&
    sessionStorage.getItem("isAdmin") === "true";
  const adminKey =
    typeof window !== "undefined" && sessionStorage.getItem("adminKey");

  useEffect(() => {
    const fetchSessions = async () => {
      if (!isAdmin || !adminKey) return;
      setLoading(true);
      setError(null);
      try {
        const backendUrl = "http://localhost:5001";
        const headers = { "x-admin-key": adminKey };
        const res = await fetch(`${backendUrl}/api/sessions`, { headers });
        if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
        const json = await res.json();
        setSessions(Array.isArray(json.sessions) ? json.sessions : []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, adminKey]);

  const kpis = useMemo(() => {
    if (!sessions.length) return { count: 0, avgTruth: 0, avgConfidence: 0 };
    const truths = sessions
      .map((s) => s.truth?.truthfulness)
      .filter((v) => typeof v === "number");
    const confs = sessions
      .map((s) => s.truth?.confidence)
      .filter((v) => typeof v === "number");
    const avg = (arr) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    return {
      count: sessions.length,
      avgTruth: avg(truths),
      avgConfidence: avg(confs),
    };
  }, [sessions]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // PDF document loading handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfLoading(false);
    setPdfError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF loading error:", error);
    setPdfError(`Error loading PDF: ${error.message || "Unknown error"}`);
    setPdfLoading(false);
  };

  // Page navigation
  const goToNextPage = () => {
    setPageNumber((prevPage) => Math.min(prevPage + 1, numPages));
  };

  const goToPreviousPage = () => {
    setPageNumber((prevPage) => Math.max(prevPage - 1, 1));
  };

  // Close PDF viewer
  const closePdfViewer = () => {
    setIsPdfModalOpen(false);
    setPdfUrl(null);
    setNumPages(null);
    setPageNumber(1);
    setPdfError(null);
  };

  // Export PDF function modified to use react-pdf
  const exportPdf = async (id) => {
    try {
      setPdfLoading(true);
      setPdfError(null);
      setIsPdfModalOpen(true);

      const backendUrl = "http://localhost:5001";
      const res = await fetch(`${backendUrl}/api/sessions/${id}/export`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const json = await res.json();

      if (json.originalUrl || json.pdfUrl) {
        const viewUrl = json.originalUrl || json.pdfUrl;

        // Ensure URLs are absolute
        const fullViewUrl = viewUrl.startsWith("http")
          ? viewUrl
          : `${backendUrl}${viewUrl.startsWith("/") ? "" : "/"}${viewUrl}`;

        // Set the PDF URL to display in the viewer
        setPdfUrl(fullViewUrl);
      } else {
        setPdfError(
          "PDF export completed but no URL was returned. Please try again."
        );
        setPdfLoading(false);
      }
    } catch (e) {
      console.error("PDF export error:", e);
      setPdfError(`Error exporting PDF: ${e.message}`);
      setPdfLoading(false);
    }
  };
  // PDF Modal component
  const PdfViewerModal = () => {
    if (!isPdfModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Session Report
            </h3>
            <button
              onClick={closePdfViewer}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-grow overflow-auto p-4 flex flex-col items-center">
            {pdfLoading && !pdfUrl && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            )}

            {pdfError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4 w-full">
                <p className="text-rose-700 font-medium">{pdfError}</p>
                <p className="text-rose-600 text-sm mt-2">
                  Try downloading the file directly instead.
                </p>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download
                    className="mt-3 inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            )}

            {pdfUrl && !pdfError && (
              <div className="w-full flex flex-col items-center">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex flex-col items-center justify-center p-8">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">Loading document...</p>
                    </div>
                  }
                  error={
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg my-4">
                      <p className="text-rose-700">
                        Failed to load PDF. Please try again.
                      </p>
                    </div>
                  }
                  className="pdf-document shadow-lg border border-gray-200 rounded-lg"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={1.2}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page"
                  />
                </Document>

                {numPages > 0 && (
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={goToPreviousPage}
                      disabled={pageNumber <= 1}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <p className="text-gray-700">
                      Page <span className="font-medium">{pageNumber}</span> of{" "}
                      <span className="font-medium">{numPages}</span>
                    </p>
                    <button
                      onClick={goToNextPage}
                      disabled={pageNumber >= numPages}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Download button */}
                <a
                  href={pdfUrl}
                  download
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Download PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isAdmin || !adminKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Admin Access Required
          </h1>
          <p className="text-gray-600 mb-8">
            Please authenticate to access the dashboard and view session
            analytics.
          </p>
          <button
            className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={() => navigate("/admin-login")}
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time session monitoring and analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2.5 rounded-xl bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 font-medium text-sm text-gray-700 hover:text-indigo-700 flex items-center gap-2 shadow-sm hover:shadow"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                <span className={loading ? "animate-spin" : ""}>↻</span>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Sessions"
            value={kpis.count}
            subtitle="All time"
            trend="📊"
          />
          <StatCard
            title="Avg Truthfulness"
            value={`${kpis.avgTruth}%`}
            subtitle="Across all sessions"
            trend="✓"
          />
          <StatCard
            title="Avg Confidence"
            value={`${kpis.avgConfidence}%`}
            subtitle="Analysis reliability"
            trend="🎯"
          />
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-rose-900">
                Error Loading Sessions
              </p>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="font-semibold text-indigo-900">Loading Sessions</p>
              <p className="text-sm text-indigo-700 mt-1">
                Fetching latest data...
              </p>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Latest truth analysis results
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Timestamp
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Truthfulness
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Confidence
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sessions.map((s) => {
                  const truth =
                    typeof s.truth?.truthfulness === "number"
                      ? s.truth.truthfulness
                      : null;
                  const conf =
                    typeof s.truth?.confidence === "number"
                      ? s.truth.confidence
                      : null;
                  const badgeVariant =
                    truth >= 70
                      ? "success"
                      : truth >= 40
                      ? "warning"
                      : "danger";

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(
                            s.createdAt || s.startedAt
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            s.createdAt || s.startedAt
                          ).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-32">
                            <ProgressBar
                              percent={truth ?? 0}
                              color={percentColor(truth ?? 0)}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                            {truth != null ? `${truth}%` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-24">
                            <ProgressBar
                              percent={conf ?? 0}
                              color="bg-indigo-500"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">
                            {conf != null ? `${conf}%` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badgeVariant}>
                          {s.type || "recorded"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-150"
                            onClick={() =>
                              copyToClipboard(s._id, `id-${s._id}`)
                            }
                          >
                            {copiedId === `id-${s._id}` ? "✓ Copied" : "ID"}
                          </button>
                          <button
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-150"
                            onClick={() =>
                              copyToClipboard(
                                s.report?.shareId || "",
                                `share-${s._id}`
                              )
                            }
                          >
                            {copiedId === `share-${s._id}`
                              ? "✓ Copied"
                              : "Share"}
                          </button>
                          <button
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-150 shadow-sm hover:shadow"
                            onClick={() => exportPdf(s._id)}
                          >
                            Export
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sessions.length === 0 && !loading && (
                  <tr>
                    <td
                      className="px-6 py-12 text-center text-gray-500"
                      colSpan={5}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-5xl opacity-50">📭</span>
                        <p className="text-lg font-medium">No sessions found</p>
                        <p className="text-sm">
                          Sessions will appear here once they're created
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Auto-refreshes every 30 seconds • Last updated:{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal />
    </div>
  );
}
