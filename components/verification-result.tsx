import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Shield, User, FileText } from "lucide-react"

interface VerificationData {
  sessionId: string
  decision: "approved" | "declined" | "resubmission_requested"
  documentValidation: {
    documentType: string
    documentNumber: string
    isValid: boolean
    confidence: number
  }
  faceMatch: {
    confidence: number
    isMatch: boolean
  }
  checks: {
    documentAuthenticity: boolean
    faceMatchCheck: boolean
    documentDataExtraction: boolean
  }
  apiDemo?: {
    apiKeyProvided: boolean
    hmacGenerated: boolean
    realApiReady: boolean
  }
}

interface VerificationResultProps {
  data: VerificationData
}

export default function VerificationResult({ data }: VerificationResultProps) {
  const getDecisionIcon = () => {
    switch (data.decision) {
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case "declined":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "resubmission_requested":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />
    }
  }

  const getDecisionBadge = () => {
    switch (data.decision) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "declined":
        return <Badge variant="destructive">Declined</Badge>
      case "resubmission_requested":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Resubmission Required
          </Badge>
        )
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {getDecisionIcon()}
          Verification Results
          {getDecisionBadge()}
        </CardTitle>
        <CardDescription>Session ID: {data.sessionId}</CardDescription>
        {data.apiDemo && (
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h3 className="font-medium text-blue-900 mb-2">API Integration Status</h3>
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
                <span>{data.apiDemo.realApiReady ? "Ready for Real API" : "Demo Mode Only"}</span>
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
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant={data.documentValidation.isValid ? "default" : "destructive"}>
                  {data.documentValidation.isValid ? "Valid" : "Invalid"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium">{data.documentValidation.documentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Number:</span>
                <span className="text-sm font-medium">{data.documentValidation.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className={`text-sm font-medium ${getConfidenceColor(data.documentValidation.confidence)}`}>
                  {data.documentValidation.confidence}%
                </span>
              </div>
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
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Match:</span>
                <Badge variant={data.faceMatch.isMatch ? "default" : "destructive"}>
                  {data.faceMatch.isMatch ? "Match" : "No Match"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className={`text-sm font-medium ${getConfidenceColor(data.faceMatch.confidence)}`}>
                  {data.faceMatch.confidence}%
                </span>
              </div>
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
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Authenticity:</span>
                <Badge variant={data.checks.documentAuthenticity ? "default" : "destructive"}>
                  {data.checks.documentAuthenticity ? "Pass" : "Fail"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Face Check:</span>
                <Badge variant={data.checks.faceMatchCheck ? "default" : "destructive"}>
                  {data.checks.faceMatchCheck ? "Pass" : "Fail"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Extraction:</span>
                <Badge variant={data.checks.documentDataExtraction ? "default" : "destructive"}>
                  {data.checks.documentDataExtraction ? "Pass" : "Fail"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.decision === "resubmission_requested" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Resubmission Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Please review your documents and submit clearer images. Ensure all text is readable and the photos are
                  well-lit.
                </p>
              </div>
            </div>
          </div>
        )}

        {data.decision === "declined" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Verification Declined</h4>
                <p className="text-sm text-red-700 mt-1">
                  The verification could not be completed successfully. Please contact support if you believe this is an
                  error.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
