import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function generateHMACSignature(payload: string, secretKey: string): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");
}

async function getVerificationDecision(sessionId: string) {
  if (!sessionId || sessionId.length !== 36) {
    throw new Error(`Invalid session ID: ${sessionId}`);
  }

  const signature = generateHMACSignature(
    sessionId,
    process.env.VERIFF_PRIVATE_KEY!
  );
  
  const url = `https://stationapi.veriff.com/v1/sessions/${sessionId}/decision`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
      "X-HMAC-SIGNATURE": signature,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    if (response.status === 404) {
      return { status: "pending", message: "Decision not ready yet" };
    }
    throw new Error(`Decision fetch failed: ${response.status} ${responseText}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  if (result.status === "success") {
    if (result.verification === null) {
      return { status: "pending", message: "Decision processing not complete" };
    }
    if (result.verification) {
      return result.verification;
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.VERIFF_API_KEY || !process.env.VERIFF_PRIVATE_KEY) {
      throw new Error("Veriff credentials not configured");
    }

    const decision = await getVerificationDecision(sessionId.trim());

    if (decision.status === "pending") {
      return NextResponse.json({
        success: true,
        status: "pending",
        message: decision.message,
        data: { sessionId }
      });
    }

    if (decision.status === "approved" || decision.status === "declined" || decision.status === "resubmission_requested") {
      const verificationData = {
        sessionId,
        decision: decision.status,
        code: decision.code,
        reason: decision.reason,
        decisionTime: decision.decisionTime,
        acceptanceTime: decision.acceptanceTime,
        documentValidation: {
          documentType: decision.document?.type || "Unknown",
          documentNumber: decision.document?.number || "N/A",
          isValid: decision.status === "approved",
          country: decision.document?.country,
          validFrom: decision.document?.validFrom,
          validUntil: decision.document?.validUntil,
        },
        person: {
          firstName: decision.person?.firstName,
          lastName: decision.person?.lastName,
          dateOfBirth: decision.person?.dateOfBirth,
          nationality: decision.person?.nationality,
          idNumber: decision.person?.idNumber,
        },
        riskLabels: decision.riskLabels || [],
        reasonCode: decision.reasonCode,
      };

      return NextResponse.json({
        success: true,
        status: "completed",
        data: verificationData,
      });
    }

    return NextResponse.json({
      success: true,
      status: "unknown",
      message: "Verification status unknown",
      data: { sessionId, rawResponse: decision }
    });

  } catch (error) {
    console.error("Veriff status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}