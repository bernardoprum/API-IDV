"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  XCircle,
  Upload,
  RotateCcw,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Settings,
  Zap,
} from "lucide-react";
import FileUpload from "@/components/file-upload";
import VerificationResult from "@/components/verification-result";

interface UploadedFiles {
  frontLicense: File | null;
  backLicense: File | null;
  selfie: File | null;
}

interface VerificationData {
  id: string; // Renamed from sessionId
  status: "approved" | "declined" | "resubmission_requested"; // Renamed from decision
  reason?: string; // Added from the decision response
  reasonCode?: number; // Added from the decision response
  riskLabels?: { label: string; category: string; sessionIds: string[] }[]; // Changed to array of objects
  person?: {
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    idNumber: string | null;
    addresses: { fullAddress: string }[];
    citizenship: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    yearOfBirth: number | null;
    placeOfBirth: string | null;
    pepSanctionMatch: string | null;
  };
  document?: {
    type: string | null;
    state: string | null;
    number: string | null;
    country: string | null;
    validFrom: string | null;
    validUntil: string | null;
  };
  faceMatch?: {
    confidence: number;
    isMatch: boolean;
  };
  checks?: {
    documentAuthenticity: boolean;
    faceMatchCheck: boolean;
    documentDataExtraction: boolean;
  };
  apiDemo?: {
    apiKeyProvided: boolean;
    hmacGenerated: boolean;
    realApiReady: boolean;
  };
  attemptId?: string;
  endUserId?: string | null;
  vendorData?: string | null;
  decisionTime?: string;
  acceptanceTime?: string;
  additionalVerifiedData?: Record<string, any>;
}

export default function VerificationPortal() {
  const [mode, setMode] = useState<"demo" | "production">("demo");
  const [files, setFiles] = useState<UploadedFiles>({
    frontLicense: null,
    backLicense: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState({
    frontLicense: null,
    backLicense: null,
    selfie: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    apiKey: "",
    privateKey: "",
    showPrivateKey: false,
  });
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
  });

  // Simple crypto function for demo HMAC generation
  const generateDemoHMAC = async (payload: string, secretKey: string) => {
    if (!secretKey)
      return "demo_signature_" + Math.random().toString(36).substring(7);

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secretKey);
      const messageData = encoder.encode(payload);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await window.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData
      );
      const hashArray = Array.from(new Uint8Array(signature));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      return "hmac_generation_error";
    }
  };

  const handleFileChange = (type: keyof UploadedFiles, file: File | null) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
    setError(null);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const target = e.target as FileReader;
        if (target && target.result) {
          setPreviews((prev) => ({ ...prev, [type]: target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({ ...prev, [type]: null }));
    }
  };

  const isFormValid = files.frontLicense && files.backLicense && files.selfie && personalInfo.firstName && personalInfo.lastName;

  const handleDemoSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      console.log("🚀 Starting Veriff Demo Process...");

      // Step 1: Demo Session Creation
      console.log("📝 Creating demo session...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProgress(20);

      const sessionId =
        "demo-session-" + Math.random().toString(36).substring(2, 15);
      console.log("✅ Session created:", sessionId);

      // Step 2: Demo HMAC Generation (if keys provided)
      if (apiKeys.apiKey && apiKeys.privateKey) {
        console.log("🔐 Generating real HMAC signatures...");

        const frontHMAC = await generateDemoHMAC(sessionId, apiKeys.privateKey);
        const backHMAC = await generateDemoHMAC(sessionId, apiKeys.privateKey);
        const selfieHMAC = await generateDemoHMAC(
          sessionId,
          apiKeys.privateKey
        );

        console.log(
          "✅ HMAC for DOCUMENT_FRONT:",
          frontHMAC.substring(0, 16) + "..."
        );
        console.log(
          "✅ HMAC for DOCUMENT_BACK:",
          backHMAC.substring(0, 16) + "..."
        );
        console.log("✅ HMAC for FACE:", selfieHMAC.substring(0, 16) + "...");

        console.log("📡 Demo API Headers:");
        console.log(
          "   X-AUTH-CLIENT:",
          apiKeys.apiKey.substring(0, 8) + "..."
        );
        console.log("   X-HMAC-SIGNATURE:", frontHMAC.substring(0, 16) + "...");
      }

      setProgress(50);

      // Step 3: Demo File Processing
      console.log("📤 Processing uploaded files...");
      console.log(
        `   Front: ${files.frontLicense!.name} (${
          files.frontLicense!.size
        } bytes)`
      );
      console.log(
        `   Back: ${files.backLicense!.name} (${files.backLicense!.size} bytes)`
      );
      console.log(
        `   Selfie: ${files.selfie!.name} (${files.selfie!.size} bytes)`
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setProgress(80);

      // Step 4: Demo Results
      console.log("🔍 Simulating Veriff analysis...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const decisions = ["approved", "declined", "resubmission_requested"];
      const weights = [0.7, 0.2, 0.1]; // 70% approved, 20% declined, 10% resubmission

      let decision = decisions[0];
      const rand = Math.random();
      let cumWeight = 0;
      for (let i = 0; i < decisions.length; i++) {
        cumWeight += weights[i];
        if (rand <= cumWeight) {
          decision = decisions[i];
          break;
        }
      }

      const mockResults: VerificationData = {
        id: sessionId,
        status: decision as any,
        document: {
          type: "DRIVERS_LICENSE",
          number: "DL" + Math.random().toString().substring(2, 11),
          country: "US",
          state: "CA",
          validFrom: "2022-09-02",
          validUntil: "2029-09-02",
        },
        faceMatch: {
          confidence:
            decision === "approved"
              ? 80 + Math.random() * 15
              : 30 + Math.random() * 40,
          isMatch: decision === "approved",
        },
        checks: {
          documentAuthenticity: decision === "approved",
          faceMatchCheck: decision === "approved",
          documentDataExtraction: true,
        },
        apiDemo: {
          apiKeyProvided: !!apiKeys.apiKey,
          hmacGenerated: !!(apiKeys.apiKey && apiKeys.privateKey),
          realApiReady: !!(apiKeys.apiKey && apiKeys.privateKey),
        },
        // Add riskLabels to mockResults if needed for testing specific scenarios
        riskLabels:
          decision === "declined"
            ? [
                {
                  label:
                    "session_vendor_provided_name_not_matching_with_name_on_the_document",
                  category: "client_data_mismatch",
                  sessionIds: [],
                },
                {
                  label:
                    "session_vendor_provided_name_not_similar_with_name_on_the_document",
                  category: "client_data_mismatch",
                  sessionIds: [],
                },
                {
                  label: "potential_document_user_age_mismatch",
                  category: "person",
                  sessionIds: [],
                },
              ]
            : [],
      };

      setProgress(100);
      console.log("✅ Demo verification completed:", decision);
      setResult(mockResults);
    } catch (err) {
      console.error("❌ Demo error:", err);
      setError("Demo processing failed: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleProductionSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("frontLicense", files.frontLicense!);
      formData.append("backLicense", files.backLicense!);
      formData.append("selfie", files.selfie!);
      formData.append("firstName", personalInfo.firstName);
      formData.append("lastName", personalInfo.lastName);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch("/api/veriff-submit", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || "Verification failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleSubmit =
    mode === "demo" ? handleDemoSubmit : handleProductionSubmit;

  const handleReset = () => {
    setFiles({
      frontLicense: null,
      backLicense: null,
      selfie: null,
    });
    setPreviews({
      frontLicense: null,
      backLicense: null,
      selfie: null,
    });
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Identity Verification Portal
          </h1>
          <p className="text-lg text-gray-600">
            Secure document verification powered by Veriff
          </p>

          {/* Mode Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setMode("demo")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  mode === "demo"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Zap className="h-4 w-4" />
                Demo Mode
              </button>
              <button
                onClick={() => setMode("production")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  mode === "production"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Settings className="h-4 w-4" />
                Production Mode
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 bg-white rounded-lg p-3 border">
            {mode === "demo" ? (
              <>
                <strong>🎯 Demo Mode:</strong> Upload any images to see the
                verification flow. Optionally add your Veriff API keys to test
                real authentication logic.
                <br />
                <strong>📝 Ready for Testing:</strong> Check console logs to see
                exactly how real Veriff integration works.
              </>
            ) : (
              <>
                <strong>🚀 Production Mode:</strong> Uses real Veriff API with
                your configured environment variables.
                <br />
                <strong>⚡ Live Integration:</strong> Actual verification
                results from Veriff servers.
              </>
            )}
          </div>
        </div>

        {/* Personal Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>
              Please enter your name as it appears on your driver's license
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) =>
                    setPersonalInfo((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) =>
                    setPersonalInfo((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section (Demo Mode Only) */}
        {mode === "demo" && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Optional: Test with Your Veriff API Keys
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showApiKeys ? "Hide" : "Show"} API Keys
                </Button>
              </div>
            </CardHeader>
            {showApiKeys && (
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    API Key (X-AUTH-CLIENT)
                  </label>
                  <input
                    type="text"
                    value={apiKeys.apiKey}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        apiKey: e.target.value,
                      }))
                    }
                    className="w-full text-xs border border-blue-300 rounded px-2 py-1"
                    placeholder="Your Veriff publishable key"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Private Key (Shared Secret)
                  </label>
                  <div className="relative">
                    <input
                      type={apiKeys.showPrivateKey ? "text" : "password"}
                      value={apiKeys.privateKey}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          privateKey: e.target.value,
                        }))
                      }
                      className="w-full text-xs border border-blue-300 rounded px-2 py-1 pr-8"
                      placeholder="Your Veriff private key"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setApiKeys((prev) => ({
                          ...prev,
                          showPrivateKey: !prev.showPrivateKey,
                        }))
                      }
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      {apiKeys.showPrivateKey ? (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      ) : (
                        <Eye className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-600">
                  {apiKeys.apiKey && apiKeys.privateKey ? (
                    <>
                      ✅ Keys provided - Demo will generate real HMAC signatures
                    </>
                  ) : (
                    <>ℹ️ Keys optional - Demo works without them</>
                  )}
                </p>
              </CardContent>
            )}
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload
              <Badge variant={mode === "demo" ? "secondary" : "default"}>
                {mode === "demo" ? "Demo" : "Live"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Please upload clear photos of your driver's license (front and
              back) and a selfie photo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <FileUpload
                label="Driver's License (Front)"
                description="Upload the front of your driver's license"
                file={files.frontLicense}
                onFileChange={(file) => handleFileChange("frontLicense", file)}
                accept="image/jpeg,image/png"
                disabled={isSubmitting}
              />
              <FileUpload
                label="Driver's License (Back)"
                description="Upload the back of your driver's license"
                file={files.backLicense}
                onFileChange={(file) => handleFileChange("backLicense", file)}
                accept="image/jpeg,image/png"
                disabled={isSubmitting}
              />
              <FileUpload
                label="Selfie Photo"
                description="Upload a clear selfie photo"
                file={files.selfie}
                onFileChange={(file) => handleFileChange("selfie", file)}
                accept="image/jpeg,image/png"
                disabled={isSubmitting}
              />
            </div>

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {mode === "demo"
                      ? "Processing demo..."
                      : "Processing verification..."}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {mode === "demo" && (
                  <p className="text-xs text-blue-600 text-center">
                    Check browser console for detailed logs
                  </p>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    {mode === "demo" ? "Processing Demo..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    {mode === "demo"
                      ? "Start Demo Verification"
                      : "Start Verification"}
                  </>
                )}
              </Button>
              {(result || error) && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {result && <VerificationResult data={result} />}
      </div>
    </div>
  );
}
