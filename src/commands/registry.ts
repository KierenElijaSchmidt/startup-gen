import { cofounderCommand } from "./cofounder/cofounder"
import { initCommand } from "./init"
import { modelCommand } from "./model"
import { problemCommand } from "./problem/problem"

export interface CommandDefinition {
  name: string
  description: string
  icon: string
  category: "core" | "build" | "system" | "config"
  handler: () => Promise<void | string> | void | string
}

export const COMMAND_REGISTRY: Record<string, CommandDefinition> = {
  init: {
    name: "init",
    description: "Initialize a new startup project",
    icon: "🎯",
    category: "core",
    handler: async () => {
      await initCommand()
    },
  },
  model: {
    name: "model",
    description: "Configure AI model provider (OpenAI, Anthropic, Mistral)",
    icon: "🤖",
    category: "config",
    handler: async () => {
      await modelCommand()
    },
  },
  cofounder: {
    name: "cofounder",
    description: "Do a co-founder matching interview",
    icon: "🤖",
    category: "config",
    handler: async () => {
      await cofounderCommand()
    },
  },
  problem: {
    name: "problem",
    description: "Get feedback on your problem definition",
    icon: "🔍",
    category: "build",
    handler: async () => {
      return await problemCommand()
    },
  },
  exit: {
    name: "exit",
    description: "Exit the application",
    icon: "👋",
    category: "system",
    handler: () => {
      console.log("👋 Goodbye!")
      process.exit(0)
    },
  },
}

export function getCommand(name: string): CommandDefinition | undefined {
  return COMMAND_REGISTRY[name]
}

export function getCommandNames(): string[] {
  return Object.keys(COMMAND_REGISTRY)
}

export function getCommandsByCategory(category: CommandDefinition["category"]): CommandDefinition[] {
  return Object.values(COMMAND_REGISTRY).filter((cmd) => cmd.category === category)
}

export function isValidCommand(name: string): boolean {
  return name in COMMAND_REGISTRY
}

export function getAllCommands(): CommandDefinition[] {
  return Object.values(COMMAND_REGISTRY)
}
