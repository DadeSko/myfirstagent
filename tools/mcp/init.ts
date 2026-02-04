import { MCPClient, MCPServerConfig } from "./client";
import { loadMCPServerTools } from "./mcp-tool";
import { ToolImplementation } from "../types";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Initialize MCP servers based on configuration
 * 
 * This function:
 * 1. Reads mcp-config.json
 * 2. Connects to enabled servers
 * 3. Loads tools from each server
 * 4. Returns all MCP tools ready for use
 */
export async function initializeMCP(
  mcpClient: MCPClient,
  configPath: string = "./mcp-config.json"
): Promise<ToolImplementation[]> {
  console.log("\n🔌 Initializing MCP servers...\n");
  
  try {
    // Read configuration
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);
    
    // Determine which servers to enable
    const enabledServers = getEnabledServers(config);
    
    if (enabledServers.length === 0) {
      console.log("ℹ️  No MCP servers enabled");
      return [];
    }
    
    console.log(`📋 Enabling MCP servers: ${enabledServers.join(", ")}\n`);
    
    // Connect to servers and load tools
    const allMCPTools: ToolImplementation[] = [];
    
    for (const serverName of enabledServers) {
      try {
        const serverConfig = config.mcpServers[serverName];
        
        // Expand environment variables in config
        const expandedConfig = expandEnvVars(serverConfig);
        
        // Connect to server
        await mcpClient.connect(serverName, expandedConfig);
        
        // Load tools from server
        const tools = await loadMCPServerTools(mcpClient, serverName);
        allMCPTools.push(...tools);
        
        console.log(`✓ ${serverName}: ${tools.length} tools loaded\n`);
      } catch (error) {
        console.warn(`⚠️  Failed to initialize ${serverName}:`, (error as Error).message);
        console.warn(`   Continuing without ${serverName}...\n`);
      }
    }
    
    console.log(`✓ MCP initialization complete: ${allMCPTools.length} total tools\n`);
    
    return allMCPTools;
  } catch (error) {
    console.error("❌ MCP initialization failed:", error);
    console.log("ℹ️  Continuing without MCP servers\n");
    return [];
  }
}

/**
 * Determine which servers should be enabled
 * 
 * Priority:
 * 1. MCP_SERVERS environment variable (comma-separated)
 * 2. All servers in config (if MCP_SERVERS not set)
 */
function getEnabledServers(config: any): string[] {
  const mcpServersEnv = process.env.MCP_SERVERS;
  
  if (mcpServersEnv) {
    // Use explicitly enabled servers
    return mcpServersEnv.split(",").map(s => s.trim());
  }
  
  // Use all configured servers
  return Object.keys(config.mcpServers);
}

/**
 * Expand environment variables in server config
 * 
 * Replaces ${VAR_NAME} with process.env.VAR_NAME
 */
function expandEnvVars(config: MCPServerConfig): MCPServerConfig {
  const expanded: MCPServerConfig = {
    command: config.command,
    args: config.args?.map(arg => expandString(arg)),
    env: {}
  };
  
  if (config.env) {
    for (const [key, value] of Object.entries(config.env)) {
      expanded.env![key] = expandString(value);
    }
  }
  
  return expanded;
}

/**
 * Expand environment variables in a string
 */
function expandString(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    const value = process.env[varName];
    if (!value) {
      throw new Error(`Environment variable not set: ${varName}`);
    }
    return value;
  });
}

/**
 * Cleanup MCP servers
 * 
 * Call this when the agent is shutting down
 */
export async function cleanupMCP(mcpClient: MCPClient): Promise<void> {
  await mcpClient.disconnectAll();
}
