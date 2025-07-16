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
  riskLabels?: string[]; // Added from the decision response
  person?: {
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    idNumber: string | null;
    addresses: any[];
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
                  {/* Note: isValid and confidence are not directly available in the provided document object, 
                       so we'll omit them or use placeholder/derived values if needed later. */}
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
                  {data.person.gender && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gender:</span>
                      <span className="text-sm font-medium">
                        {data.person.gender}
                      </span>
                    </div>
                  )}
                  {data.person.dateOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Date of Birth:
                      </span>
                      <span className="text-sm font-medium">
                        {new Date(data.person.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {data.person.nationality && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Nationality:
                      </span>
                      <span className="text-sm font-medium">
                        {data.person.nationality}
                      </span>
                    </div>
                  )}
                  {data.person.citizenship && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Citizenship:
                      </span>
                      <span className="text-sm font-medium">
                        {data.person.citizenship}
                      </span>
                    </div>
                  )}
                  {data.person.placeOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Place of Birth:
                      </span>
                      <span className="text-sm font-medium">
                        {data.person.placeOfBirth}
                      </span>
                    </div>
                  )}
                  {data.person.idNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID Number:</span>
                      <span className="text-sm font-medium">
                        {data.person.idNumber}
                      </span>
                    </div>
                  )}
                  {data.person.pepSanctionMatch && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        PEP/Sanction Match:
                      </span>
                      <span className="text-sm font-medium">
                        {data.person.pepSanctionMatch}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No person data available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Face Match */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Face Match
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.faceMatch ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Match:</span>
                    <Badge
                      variant={
                        data.faceMatch.isMatch ? "default" : "destructive"
                      }
                    >
                      {data.faceMatch.isMatch ? "Match" : "No Match"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span
                      className={`text-sm font-medium ${getConfidenceColor(
                        data.faceMatch.confidence
                      )}`}
                    >
                      {data.faceMatch.confidence}%
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

          {/* Security Checks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.checks ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Authenticity:</span>
                    <Badge
                      variant={
                        data.checks.documentAuthenticity
                          ? "default"
                          : "destructive"
                      }
                    >
                      {data.checks.documentAuthenticity ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Face Check:</span>
                    <Badge
                      variant={
                        data.checks.faceMatchCheck ? "default" : "destructive"
                      }
                    >
                      {data.checks.faceMatchCheck ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Data Extraction:
                    </span>
                    <Badge
                      variant={
                        data.checks.documentDataExtraction
                          ? "default"
                          : "destructive"
                      }
                    >
                      {data.checks.documentDataExtraction ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No security checks data available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {data.status === "resubmission_requested" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  Resubmission Required
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {data.reason ||
                    "Please review your documents and submit clearer images. Ensure all text is readable and the photos are well-lit."}
                </p>
              </div>
            </div>
          </div>
        )}

        {data.status === "declined" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">
                  Verification Declined
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {data.reason ||
                    "The verification could not be completed successfully. Please contact support if you believe this is an error."}
                </p>
              </div>
            </div>
          </div>
        )}

        {data.riskLabels && data.riskLabels.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Risk Labels</h4>
                <ul className="list-disc list-inside text-sm text-orange-700 mt-1">
                  {data.riskLabels.map((label, index) => (
                    <li key={index}>{label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
