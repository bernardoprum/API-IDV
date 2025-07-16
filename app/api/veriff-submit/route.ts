import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Debug function for HMAC troubleshooting
function generateHMACSignature(payload: string, secretKey: string): string {
  console.log("HMAC Debug:")
  console.log("- Payload:", payload)
  console.log("- Secret key (first 8 chars):", secretKey.substring(0, 8) + "...")
  console.log("- Secret key length:", secretKey.length)

  const signature = crypto.createHmac("sha256", secretKey).update(payload).digest("hex")

  console.log("- Generated signature:", signature)
  return signature
}

async function createVeriffSession() {
  const sessionData = {
    verification: {
      callback: "https://example.com/callback", // Placeholder HTTPS URL as required
      person: {
        firstName: "Test",
        lastName: "User",
      },
    },
  }

  const response = await fetch("https://stationapi.veriff.com/v1/sessions", {
    method: "POST",
    headers: {
      "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionData),
  })

  const responseText = await response.text()
  console.log("Session creation response:", responseText)

  if (!response.ok) {
    throw new Error(`Session creation failed: ${response.status} ${responseText}`)
  }

  let result
  try {
    result = JSON.parse(responseText)
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`)
  }

  return result
}

async function uploadFileToVeriff(sessionId: string, file: File, context: string) {
  // 🔧 FIXED: Map context values to Veriff's expected lowercase format
  const contextMap: { [key: string]: string } = {
    DOCUMENT_FRONT: "document-front",
    DOCUMENT_BACK: "document-back",
    FACE: "face",
  }

  const veriffContext = contextMap[context] || context.toLowerCase()

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString("base64")

  // Create JSON payload with exact structure Veriff expects
  const payload = {
    image: {
      context: veriffContext, // 🔧 FIXED: Use lowercase context values
      content: `data:${file.type || "image/jpeg"};base64,${base64}`,
    },
  }

  // Calculate HMAC from JSON request body string
  const requestBody = JSON.stringify(payload)
  const signature = generateHMACSignature(requestBody, process.env.VERIFF_PRIVATE_KEY!)

  console.log(`\n📤 Uploading ${context} → ${veriffContext} via JSON:`)
  console.log(`   File: ${file.name} (${file.size} bytes)`)
  console.log(`   Context mapping: ${context} → ${veriffContext}`)
  console.log(`   Base64 length: ${base64.length}`)
  console.log(`   Request body length: ${requestBody.length}`)
  console.log(`   HMAC signature: ${signature}`)

  const response = await fetch(`https://stationapi.veriff.com/v1/sessions/${sessionId}/media`, {
    method: "POST",
    headers: {
      "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
      "X-HMAC-SIGNATURE": signature,
      "Content-Type": "application/json",
    },
    body: requestBody, // Use the same string we hashed
  })

  const responseText = await response.text()
  console.log(`   JSON response (${response.status}):`, responseText)

  if (!response.ok) {
    throw new Error(`Upload failed for ${context} (${veriffContext}): ${response.status} ${responseText}`)
  }

  let result
  try {
    result = JSON.parse(responseText)
  } catch {
    result = { error: responseText }
  }

  console.log(`✅ JSON upload successful for ${context} → ${veriffContext}`)
  return result
}

async function getVerificationDecision(sessionId: string) {
  console.log("\n🔍 Full Auto Decision fetch debug:")
  console.log("- Session ID:", sessionId)
  console.log("- Session ID length:", sessionId.length)
  console.log("- Session ID type:", typeof sessionId)

  // Based on error message: "HMAC-SHA256 of query ID"
  // The "query ID" is the session ID
  const signature = generateHMACSignature(sessionId, process.env.VERIFF_PRIVATE_KEY!)

  // Use the Full Auto endpoint with version parameter
  const url = `https://stationapi.veriff.com/v1/sessions/${sessionId}/decision/fullauto?version=1.0.0`
  console.log("- Full URL:", url)
  console.log("- Generated signature:", signature)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-AUTH-CLIENT": process.env.VERIFF_API_KEY!,
      "X-HMAC-SIGNATURE": signature,
    },
  })

  const responseText = await response.text()
  console.log("Full Auto decision response:", responseText)

  if (!response.ok) {
    if (response.status === 401) {
      console.error("\n❌ Authentication failed - debugging info:")
      console.error("1. Session ID used for HMAC:", sessionId)
      console.error("2. Make sure VERIFF_PRIVATE_KEY matches your Full Auto integration")
      console.error("3. Ensure you're using the private key, not the API key")
      console.error("4. Check for any whitespace in the session ID or private key")
    }
    throw new Error(`Decision fetch failed: ${response.status} ${responseText}`)
  }

  let result
  try {
    result = JSON.parse(responseText)
  } catch {
    throw new Error(`Invalid JSON response: ${responseText}`)
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting Veriff verification process...")

    // Check environment variables
    if (!process.env.VERIFF_API_KEY) {
      throw new Error("VERIFF_API_KEY environment variable is not set")
    }

    if (!process.env.VERIFF_PRIVATE_KEY) {
      throw new Error("VERIFF_PRIVATE_KEY environment variable is not set")
    }

    // Parse form data
    const formData = await request.formData()
    const frontLicense = formData.get("frontLicense") as File
    const backLicense = formData.get("backLicense") as File
    const selfie = formData.get("selfie") as File

    if (!frontLicense || !backLicense || !selfie) {
      return NextResponse.json({ success: false, error: "All three files are required" }, { status: 400 })
    }

    console.log("File sizes:", {
      front: frontLicense.size,
      back: backLicense.size,
      selfie: selfie.size,
    })

    // Step 1: Create Veriff session
    console.log("Creating Veriff session...")
    const sessionResponse = await createVeriffSession()
    const sessionId = sessionResponse.verification?.id

    if (!sessionId) {
      throw new Error("Failed to get session ID from Veriff response")
    }

    // Clean the session ID of any potential whitespace
    const cleanSessionId = sessionId.trim()
    console.log("Session created:", cleanSessionId)
    console.log("Session ID length:", cleanSessionId.length)

    // Step 2: Upload files with JSON format and correct context values
    console.log("Uploading files with JSON format...")
    await Promise.all([
      uploadFileToVeriff(cleanSessionId, frontLicense, "DOCUMENT_FRONT"), // Maps to 'document-front'
      uploadFileToVeriff(cleanSessionId, backLicense, "DOCUMENT_BACK"), // Maps to 'document-back'
      uploadFileToVeriff(cleanSessionId, selfie, "FACE"), // Maps to 'face'
    ])

    console.log("All files uploaded successfully")

    // Step 3: Poll for decision (with retries)
    console.log("Polling for verification decision...")
    let decision = null
    let attempts = 0
    const maxAttempts = 10

    while (!decision && attempts < maxAttempts) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds
        const decisionResponse = await getVerificationDecision(cleanSessionId)

        // Check for Full Auto decision completion
        if (
          decisionResponse.decision &&
          (decisionResponse.decision === "approved" ||
            decisionResponse.decision === "declined" ||
            decisionResponse.decision === "resubmission_requested")
        ) {
          decision = decisionResponse
          break
        }

        attempts++
        console.log(`Decision not ready, attempt ${attempts}/${maxAttempts}`)
      } catch (error) {
        console.log("Decision polling error:", error)
        attempts++

        if (attempts >= maxAttempts) {
          throw error
        }
      }
    }

    if (!decision) {
      throw new Error("Verification decision not available after maximum attempts")
    }

    // Step 4: Format response for Full Auto
    const verificationData = {
      sessionId: cleanSessionId,
      decision: decision.decision, // Note: different path for Full Auto
      decisionScore: decision.decisionScore || 0,
      documentValidation: {
        documentType: decision.document?.type || "Unknown",
        documentNumber: decision.document?.number || "N/A",
        isValid: decision.decision === "approved",
        confidence: Math.round((decision.document?.confidence || 0) * 100),
      },
      faceMatch: {
        confidence: Math.round((decision.person?.confidence || 0) * 100),
        isMatch: decision.person?.faceMatch === "MATCH",
      },
      checks: {
        documentAuthenticity: decision.document?.validDocument || false,
        faceMatchCheck: decision.person?.faceMatch === "MATCH",
        documentDataExtraction: decision.document?.dataExtracted || false,
      },
      insights: decision.insights || [],
    }

    return NextResponse.json({
      success: true,
      data: verificationData,
    })
  } catch (error) {
    console.error("Veriff verification error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 },
    )
  }
}
