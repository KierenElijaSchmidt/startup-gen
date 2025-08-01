import { randomUUID } from "crypto"
import path from "path"

import fs from "fs-extra"

import { Message, ConversationHistory } from "../types/Message"

const HISTORY_DIR = ".startup"
const HISTORY_FILE = "history.json"

// Maximum number of conversation turns (user+assistant pairs) to include in model context
export const MAX_CONVERSATION_HISTORY = 5

export async function addMessage(role: "user" | "assistant", content: string): Promise<void> {
  try {
    const historyDir = path.join(process.cwd(), HISTORY_DIR)
    const historyPath = path.join(historyDir, HISTORY_FILE)

    // Ensure the .claude directory exists
    await fs.ensureDir(historyDir)

    // Load existing history or create new
    let history: ConversationHistory = { messages: [] }
    if (await fs.pathExists(historyPath)) {
      const existingContent = await fs.readFile(historyPath, "utf-8")
      try {
        history = JSON.parse(existingContent)
      } catch {
        console.warn("Warning: Could not parse existing conversation history, starting fresh")
      }
    }

    // Create new message
    const message: Message = {
      id: randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
    }

    // Add message to history
    history.messages.push(message)

    // Save updated history
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error(
      "Warning: Failed to save conversation history:",
      error instanceof Error ? error.message : "Unknown error",
    )
  }
}

export async function getConversationHistory(): Promise<ConversationHistory> {
  try {
    const historyPath = path.join(process.cwd(), HISTORY_DIR, HISTORY_FILE)

    if (!(await fs.pathExists(historyPath))) {
      return { messages: [] }
    }

    const content = await fs.readFile(historyPath, "utf-8")
    const history: ConversationHistory = JSON.parse(content)

    // Validate the structure
    if (!history.messages || !Array.isArray(history.messages)) {
      console.warn("Warning: Invalid conversation history format, starting fresh")
      return { messages: [] }
    }

    return history
  } catch (error) {
    console.error(
      "Warning: Failed to read conversation history:",
      error instanceof Error ? error.message : "Unknown error",
    )
    return { messages: [] }
  }
}

export async function getUserInputHistory(): Promise<string[]> {
  try {
    const history = await getConversationHistory()

    // Extract only user messages and return their content in reverse order (most recent first)
    return history.messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .reverse()
  } catch (error) {
    console.error(
      "Warning: Failed to get user input history:",
      error instanceof Error ? error.message : "Unknown error",
    )
    return []
  }
}

export async function clearConversationHistory(): Promise<void> {
  try {
    const historyPath = path.join(process.cwd(), HISTORY_DIR, HISTORY_FILE)

    if (await fs.pathExists(historyPath)) {
      await fs.remove(historyPath)
    }
  } catch (error) {
    console.error(
      "Warning: Failed to clear conversation history:",
      error instanceof Error ? error.message : "Unknown error",
    )
  }
}

export async function getRecentConversationForModel(): Promise<Message[]> {
  try {
    const history = await getConversationHistory()

    // Filter out command executions - only include actual conversations
    const conversationMessages = history.messages.filter((message) => {
      if (message.role === "user") {
        // Include non-slash commands or slash commands that are questions
        return !message.content.startsWith("/") || message.content.includes("?")
      } else {
        // For assistant messages, exclude command execution confirmations
        return (
          !message.content.startsWith("Executed command:") &&
          !message.content.startsWith("Help information displayed") &&
          !message.content.startsWith("Unknown command:")
        )
      }
    })

    // Get the most recent conversation pairs (user + assistant)
    // We want MAX_CONVERSATION_HISTORY complete exchanges
    const recentMessages: Message[] = []
    let pairCount = 0

    // Go through messages in reverse (most recent first)
    for (let i = conversationMessages.length - 1; i >= 0 && pairCount < MAX_CONVERSATION_HISTORY; i--) {
      const message = conversationMessages[i]
      recentMessages.unshift(message)

      // Count a pair when we see a user message (assuming user starts the conversation)
      if (message.role === "user") {
        pairCount++
      }
    }

    return recentMessages
  } catch (error) {
    console.error(
      "Warning: Failed to get recent conversation for model:",
      error instanceof Error ? error.message : "Unknown error",
    )
    return []
  }
}
