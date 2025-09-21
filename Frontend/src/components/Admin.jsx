import React, { useEffect, useState } from "react";

const Admin = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_BASEURL;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/sessions`);
        const json = await res.json();
        setSessions(json.sessions || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [backendUrl]);

  const exportPdf = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/sessions/${id}/export`, { method: "POST" });
      const json = await res.json();
      if (json.pdfUrl) window.open(json.pdfUrl, "_blank");
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin - Sessions</h1>
      <div className="grid gap-3">
        {sessions.map((s) => (
          <div key={s._id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">Session {s._id}</div>
              <div className="text-sm text-gray-600">User: {s.userId || "-"} • {new Date(s.createdAt).toLocaleString()}</div>
              {s.truth && (
                <div className="text-sm">Truthfulness: {s.truth.truthfulness} • Confidence: {s.truth.confidence}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => exportPdf(s._id)}>Export PDF</button>
              {s.report?.exportedPdfUrl && (
                <a className="px-3 py-1 bg-gray-600 text-white rounded" href={s.report.exportedPdfUrl} target="_blank" rel="noreferrer">Open PDF</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin; 