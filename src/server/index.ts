// Remove the cors import
import dotenv from "dotenv"
import express, { Request, RequestHandler, Response } from "express"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3001

app.use(express.json({ limit: "50mb" }))

// Add manual CORS headers to all responses instead
app.use(((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  )

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).send()
  }

  next()
}) as RequestHandler)

app.post("/api/transcribe", (async (req: Request, res: Response) => {
  try {
    const { audioUrl, options } = req.body

    console.log("Request received with options:", {
      ...options,
      audioUrl: audioUrl ? "URL provided" : "not provided",
    })

    interface TranscriptionParams {
      audio_url: string
      speaker_labels?: boolean
      language_detection?: boolean
      language_code?: string
    }

    const params: TranscriptionParams = {
      audio_url: audioUrl,
    }

    if (options.diarize) {
      params.speaker_labels = true
    }

    if (options.language && options.language !== "auto") {
      params.language_code = options.language
    } else {
      params.language_detection = true
    }

    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: process.env.ASSEMBLYAI_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("AssemblyAI API error:", response.status, errorText)
      return res.status(response.status).json({
        error: `AssemblyAI API error: ${response.status} ${response.statusText}`,
        details: errorText,
      })
    }

    const data = await response.json()
    console.log("AssemblyAI API response:", data)
    res.json(data)
  } catch (error) {
    console.error("Error proxying to AssemblyAI:", error)
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to communicate with AssemblyAI API",
    })
  }
}) as RequestHandler)

app.get("/api/prediction/:id", (async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    console.log(`Checking transcription status for ID: ${id}`)

    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${id}`,
      {
        headers: {
          Authorization: process.env.ASSEMBLYAI_API_KEY || "",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Error checking transcription status: ${response.status}`,
        errorText,
      )
      return res.status(response.status).json({
        error: `Error checking transcription: ${response.status} ${response.statusText}`,
        details: errorText,
      })
    }

    const data = await response.json()
    console.log("Transcription status data:", data)
    res.json(data)
  } catch (error) {
    console.error("Error checking transcription status:", error)
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to check transcription status",
    })
  }
}) as RequestHandler)

app.post("/api/firebase-proxy", (async (req: Request, res: Response) => {
  try {
    const { url } = req.body

    if (!url || typeof url !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid or missing Firebase Storage URL" })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return res.status(400).json({ error: "Malformed Firebase Storage URL" })
    }

    if (parsedUrl.hostname !== "firebasestorage.googleapis.com") {
      return res
        .status(400)
        .json({ error: "Invalid or missing Firebase Storage URL" })
    }

    console.log("Proxying request to Firebase Storage")

    const response = await fetch(parsedUrl.toString())

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Firebase Storage error: ${response.status}`,
        message: await response.text(),
      })
    }

    // Stream the response directly to the client
    const contentType = response.headers.get("content-type")
    res.setHeader("Content-Type", contentType || "application/octet-stream")

    const arrayBuffer = await response.arrayBuffer()
    res.status(200).send(Buffer.from(arrayBuffer))
  } catch (error) {
    console.error("Error proxying Firebase Storage request:", error)
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to proxy Firebase Storage request",
    })
  }
}) as RequestHandler)

if (process.env.NODE_ENV === "production") {
  const buildPath = path.resolve(__dirname, "../../dist")
  app.use(express.static(buildPath))

  // Handle client-side routing - this is important for React Router
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, "index.html"))
  })
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
