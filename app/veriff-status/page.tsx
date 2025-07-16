"use client";

import { useState } from "react";
import VerificationResult from "@/components/verification-result";

export default function VeriffStatusPage() {
  const [sessionId, setSessionId] = useState("");
  const [statusResult, setStatusResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    if (!sessionId.trim()) {
      alert("Please enter a session ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/veriff-status?sessionId=${encodeURIComponent(sessionId.trim())}`
      );
      const data = await response.json();
      setStatusResult(data);
    } catch (error) {
      console.error("Error checking status:", error);
      setStatusResult({
        success: false,
        error: "Failed to check status",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Veriff Session Status Checker</h1>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter Veriff session ID"
            className="flex-1 p-3 border border-gray-300 rounded-md"
          />
          <button
            onClick={checkStatus}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Enter a session ID from your Veriff verification logs
        </p>
      </div>

      {statusResult && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Status Results</h2>
          {statusResult.success ? (
            <VerificationResult data={statusResult.verification} />
          ) : (
            <p className="text-red-500">
              Error: {statusResult.error || "Unknown error"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
