import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  User,
  FileText,
} from "lucide-react";

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
  // Add other properties from the new decision response here if necessary for display
  attemptId?: string;
  endUserId?: string | null;
  vendorData?: string | null;
  decisionTime?: string;
  acceptanceTime?: string;
  additionalVerifiedData?: Record<string, any>;
}

interface VerificationResultProps {
  data: VerificationData;
}

export default function VerificationResult({ data }: VerificationResultProps) {
  const getDecisionIcon = () => {
    switch (data.status) {
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "declined":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "resubmission_requested":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getDecisionBadge = () => {
    switch (data.status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "resubmission_requested":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Resubmission Required
          </Badge>
        );
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {getDecisionIcon()}
          Verification Results
          {getDecisionBadge()}
        </CardTitle>
        <CardDescription>Session ID: {data.id}</CardDescription>
        {data.reason && (
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Verification Details
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reason:</span>
                <span className="text-sm font-medium">{data.reason}</span>
              </div>
              {data.reasonCode && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reason Code:</span>
                  <span className="text-sm font-medium">{data.reasonCode}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {data.apiDemo && (
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h3 className="font-medium text-blue-900 mb-2">
              API Integration Status
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                {data.apiDemo.apiKeyProvided ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span>API Key Provided</span>
              </div>
              <div className="flex items-center space-x-2">
                {data.apiDemo.hmacGenerated ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span>HMAC Signatures Generated</span>
              </div>
              <div className="flex items-center space-x-2">
                {data.apiDemo.realApiReady ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>
                  {data.apiDemo.realApiReady
                    ? "Ready for Real API"
                    : "Demo Mode Only"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {data.riskLabels && data.riskLabels.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4 mt-4">
            <h3 className="font-medium text-red-900 mb-2">Risk Labels</h3>
            <ul className="list-disc pl-5 text-sm text-red-800">
              {data.riskLabels.map((labelObj, index) => (
                <li key={index}>{labelObj.label}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Document Validation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.document ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium">
                      {data.document.type || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Number:</span>
                    <span className="text-sm font-medium">
                      {data.document.number || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Country:</span>
                    <span className="text-sm font-medium">
                      {data.document.country || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valid From:</span>
                    <span className="text-sm font-medium">
                      {data.document.validFrom
                        ? new Date(data.document.validFrom).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valid Until:</span>
                    <span className="text-sm font-medium">
                      {data.document.validUntil
                        ? new Date(
                            data.document.validUntil
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No document data available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Person Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Person Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.person ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">First Name:</span>
                    <span className="text-sm font-medium">
                      {data.person.firstName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Name:</span>
                    <span className="text-sm font-medium">
                      {data.person.lastName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gender:</span>
                    <span className="text-sm font-medium">
                      {data.person.gender || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Date of Birth:
                    </span>
                    <span className="text-sm font-medium">
                      {data.person.dateOfBirth || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Address:</span>
                    <span className="text-sm font-medium">
                      {data.person.addresses && data.person.addresses.length > 0
                        ? data.person.addresses[0].fullAddress
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ID Number:</span>
                    <span className="text-sm font-medium">
                      {data.person.idNumber || "N/A"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No person details available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Face Match */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Face Match
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.faceMatch ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Match Status:</span>
                    <span
                      className={`text-sm font-medium ${
                        data.faceMatch.isMatch
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {data.faceMatch.isMatch ? "Match" : "No Match"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span
                      className={`text-sm font-medium ${getConfidenceColor(
                        data.faceMatch.confidence
                      )}`}
                    >
                      {data.faceMatch.confidence.toFixed(2)}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No face match data available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Checks Summary */}
        {data.checks && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Overall Checks Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Document Authenticity:
                </span>
                <span
                  className={`text-sm font-medium ${
                    data.checks.documentAuthenticity
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {data.checks.documentAuthenticity ? "Passed" : "Failed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Face Match Check:</span>
                <span
                  className={`text-sm font-medium ${
                    data.checks.faceMatchCheck
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {data.checks.faceMatchCheck ? "Passed" : "Failed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Document Data Extraction:
                </span>
                <span
                  className={`text-sm font-medium ${
                    data.checks.documentDataExtraction
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {data.checks.documentDataExtraction ? "Passed" : "Failed"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
