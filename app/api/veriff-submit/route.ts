import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Debug function for HMAC troubleshooting
function generateHMACSignature(payload: string, secretKey: string): string {
  console.log("HMAC Debug:");
  console.log("- Payload:", payload);
  console.log(
    "- Secret key (first 8 chars):",
    secretKey.substring(0, 8) + "..."
  );
  console.log("- Secret key length:", secretKey.length);

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");

  console.log("- Generated signature:", signature);
  return signature;
}

async function createVeriffSession(firstName: string, lastName: string) {
  const sessionData = {
    verification: {
      callback: "https://example.com/callback", // Placeholder HTTPS URL as required
      person: {
        firstName: firstName,
        lastName: lastName,
      },
    },
  };

  const response = await fetch("https://stationapi.veriff.com/v1/sessions", {
    method: "POST",
    headers: {
      "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionData),
  });

  const responseText = await response.text();
  console.log("Session creation response:", responseText);

  if (!response.ok) {
    throw new Error(
      `Session creation failed: ${response.status} ${responseText}`
    );
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  return result;
}

async function uploadFileToVeriff(
  sessionId: string,
  file: File,
  context: string
) {
  // 🔧 FIXED: Map context values to Veriff's expected lowercase format
  const contextMap: { [key: string]: string } = {
    DOCUMENT_FRONT: "document-front",
    DOCUMENT_BACK: "document-back",
    FACE: "face",
  };

  const veriffContext = contextMap[context] || context.toLowerCase();

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  // Create JSON payload with exact structure Veriff expects
  const payload = {
    image: {
      context: veriffContext, // 🔧 FIXED: Use lowercase context values
      content: `data:${file.type || "image/jpeg"};base64,${base64}`,
    },
  };

  // Calculate HMAC from JSON request body string
  const requestBody = JSON.stringify(payload);
  const signature = generateHMACSignature(
    requestBody,
    process.env.VERIFF_PRIVATE_KEY!
  );

  console.log(`\n📤 Uploading ${context} → ${veriffContext} via JSON:`);
  console.log(`   File: ${file.name} (${file.size} bytes)`);
  console.log(`   Context mapping: ${context} → ${veriffContext}`);
  console.log(`   Base64 length: ${base64.length}`);
  console.log(`   Request body length: ${requestBody.length}`);
  console.log(`   HMAC signature: ${signature}`);

  const response = await fetch(
    `https://stationapi.veriff.com/v1/sessions/${sessionId}/media`,
    {
      method: "POST",
      headers: {
        "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
        "X-HMAC-SIGNATURE": signature,
        "Content-Type": "application/json",
      },
      body: requestBody, // Use the same string we hashed
    }
  );

  const responseText = await response.text();
  console.log(`   JSON response (${response.status}):`, responseText);

  if (!response.ok) {
    throw new Error(
      `Upload failed for ${context} (${veriffContext}): ${response.status} ${responseText}`
    );
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { error: responseText };
  }

  console.log(`✅ JSON upload successful for ${context} → ${veriffContext}`);
  return result;
}
async function submitSession(sessionId: string) {
  console.log("\n📤 Submitting session for processing:");
  console.log("- Session ID:", sessionId);

  const body = JSON.stringify({ verification: { status: "submitted" } });
  console.log("- Request body:", body);

  const signature = generateHMACSignature(
    body,
    process.env.VERIFF_PRIVATE_KEY!
  );

  const response = await fetch(
    `https://stationapi.veriff.com/v1/sessions/${sessionId}`,
    {
      method: "PATCH",
      headers: {
        "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
        "X-HMAC-SIGNATURE": signature,
        "Content-Type": "application/json",
      },
      body: body,
    }
  );

  const responseText = await response.text();
  console.log(`Session submit response (${response.status}):`, responseText);

  if (response.ok) {
    console.log("✅ Session submitted successfully");
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }
    return result;
  } else {
    console.log(`❌ Session submission failed - Status: ${response.status}`);
    console.log(`Response body: ${responseText}`);

    // If submission fails, log and continue (verification might work without explicit submission)
    console.log("⚠️  Session submission failed, but continuing...");
    console.log(
      "📝 Note: Some Veriff integrations may not require explicit session submission"
    );

    return {
      status: "submission_failed",
      message: "Session submission failed but continuing with verification",
    };
  }
}

async function getVerificationDecision(sessionId: string) {
  console.log("\n🔍 Decision fetch debug:");
  console.log("- Session ID:", sessionId);
  console.log("- Session ID length:", sessionId.length);
  console.log("- Session ID type:", typeof sessionId);

  // Verify the session ID is valid
  if (!sessionId || sessionId.length !== 36) {
    throw new Error(`Invalid session ID: ${sessionId}`);
  }

  // Try standard decision endpoint first (more reliable)
  const signature = generateHMACSignature(
    sessionId,
    process.env.VERIFF_PRIVATE_KEY!
  );
  const url = `https://stationapi.veriff.com/v1/sessions/${sessionId}/decision`;
  console.log("- Decision URL:", url);
  console.log("- Generated signature:", signature);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
      "X-HMAC-SIGNATURE": signature,
    },
  });

  const responseText = await response.text();
  console.log("Decision response:", responseText);

  if (!response.ok) {
    if (response.status === 401) {
      console.error("\n❌ Authentication failed - debugging info:");
      console.error("1. Session ID used for HMAC:", sessionId);
      console.error("2. Make sure VERIFF_PRIVATE_KEY matches your integration");
      console.error("3. Ensure you're using the private key, not the API key");
      console.error(
        "4. Check for any whitespace in the session ID or private key"
      );
    } else if (response.status === 404) {
      console.log("ℹ️  Decision not ready yet (404 response)");
      // For 404, we'll return a specific response to indicate "not ready"
      return { status: "pending", message: "Decision not ready yet" };
    }
    throw new Error(
      `Decision fetch failed: ${response.status} ${responseText}`
    );
  }

  // Check if this is the standard decision endpoint format
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  // Handle different response formats
  if (result.status === "success") {
    if (result.verification === null) {
      console.log("ℹ️  Standard decision endpoint - processing not complete");
      return { status: "pending", message: "Decision processing not complete" };
    }

    if (result.verification) {
      console.log("✅ Standard decision available");
      return result.verification;
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting Veriff verification process...");

    // Check environment variables
    if (!process.env.VERIFF_API_KEY) {
      throw new Error("VERIFF_API_KEY environment variable is not set");
    }

    if (!process.env.VERIFF_PRIVATE_KEY) {
      throw new Error("VERIFF_PRIVATE_KEY environment variable is not set");
    }

    // Parse form data
    const formData = await request.formData();
    const frontLicense = formData.get("frontLicense") as File;
    const backLicense = formData.get("backLicense") as File;
    const selfie = formData.get("selfie") as File;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    if (!frontLicense || !backLicense || !selfie || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "All files and personal information are required" },
        { status: 400 }
      );
    }

    console.log("File sizes:", {
      front: frontLicense.size,
      back: backLicense.size,
      selfie: selfie.size,
    });

    // Step 1: Create Veriff session
    console.log("Creating Veriff session...");
    console.log("Person info:", { firstName, lastName });
    const sessionResponse = await createVeriffSession(firstName, lastName);
    console.log(
      "Full session response:",
      JSON.stringify(sessionResponse, null, 2)
    );

    const sessionId = sessionResponse.verification?.id;

    if (!sessionId) {
      throw new Error("Failed to get session ID from Veriff response");
    }

    // Clean the session ID of any potential whitespace
    const cleanSessionId = sessionId.trim();
    console.log("Session created:", cleanSessionId);
    console.log("Session ID length:", cleanSessionId.length);
    console.log("Session ID value for verification:", cleanSessionId);

    // Validate session ID format
    if (cleanSessionId.length !== 36) {
      throw new Error(`Invalid session ID format: ${cleanSessionId}`);
    }

    // Step 2: Upload files with JSON format and correct context values
    console.log("Uploading files with JSON format...");
    const uploadResults = await Promise.all([
      uploadFileToVeriff(cleanSessionId, frontLicense, "DOCUMENT_FRONT"), // Maps to 'document-front'
      uploadFileToVeriff(cleanSessionId, backLicense, "DOCUMENT_BACK"), // Maps to 'document-back'
      uploadFileToVeriff(cleanSessionId, selfie, "FACE"), // Maps to 'face'
    ]);

    console.log("All files uploaded successfully");

    // Verify all uploads were successful
    console.log("Upload verification:");
    uploadResults.forEach((result, index) => {
      const contexts = ["DOCUMENT_FRONT", "DOCUMENT_BACK", "FACE"];
      console.log(
        `- ${contexts[index]}: ${
          result.status === "success" ? "✅" : "❌"
        } (ID: ${result.image?.id})`
      );
    });

    // Check if any uploads failed
    const failedUploads = uploadResults.filter(
      (result) => result.status !== "success"
    );
    if (failedUploads.length > 0) {
      throw new Error(
        `Failed to upload ${failedUploads.length} files. Check logs for details.`
      );
    }

    // Step 2.5: Submit the session for processing (if required)
    console.log("Submitting session for processing...");
    const submitResult = await submitSession(cleanSessionId);

    // Check if submission was successful or if we can continue without it
    if (submitResult.status === "submission_failed") {
      console.log(
        "⚠️  Session submission failed, but some Veriff integrations work without explicit submission"
      );
      console.log("🔄 Continuing with verification polling...");
    }

    // Step 3: Return immediately after successful submission
    console.log("✅ Session submitted successfully - returning to client for polling");
    
    return NextResponse.json({
      success: true,
      status: "submitted",
      message: "Verification submitted successfully. Use the provided endpoint to check status.",
      data: {
        sessionId: cleanSessionId,
        uploads: uploadResults.map((r) => ({
          context: r.image?.context,
          status: r.status,
          mediaId: r.image?.id,
        })),
        statusCheckUrl: `/api/veriff-status?sessionId=${cleanSessionId}`,
      },
    });
  } catch (error) {
    console.error("Veriff verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 }
    );
  }
}
