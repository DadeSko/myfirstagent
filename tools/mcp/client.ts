import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * MCP Client - Manages connections to MCP servers
 * 
 * Following Geoffrey's principle: keep it simple!
 * This client handles all MCP server communication.
 */
export class MCPClient {
  private clients = new Map<string, Client>();
  private toolCache = new Map<string, MCPTool[]>();
  
  /**
   * Connect to an MCP server
   */
  async connect(
    name: string,
    config: MCPServerConfig
  ): Promise<Client> {
    console.log(`🔌 Connecting to MCP server: ${name}`);
    
    try {
      // Create stdio transport (most common for local servers)
      // Filter out undefined values from process.env for type safety
      const cleanEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          cleanEnv[key] = value;
        }
      }
      
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: { ...cleanEnv, ...config.env }
      });
      
      // Create client with capabilities
      const client = new Client(
        {
          name: `coding-agent-${name}`,
          version: "1.0.0"
        },
        {
          capabilities: {
            // No special capabilities needed for basic usage
          }
        }
      );
      
      // Connect to the server
      await client.connect(transport);
      
      // Store for later use
      this.clients.set(name, client);
      
      console.log(`✓ Connected to MCP server: ${name}`);
      
      return client;
    } catch (error) {
      console.error(`❌ Failed to connect to ${name}:`, error);
      throw new Error(`MCP connection failed for ${name}: ${(error as Error).message}`);
    }
  }
  
  /**
   * List all available tools from a server
   */
  async listTools(serverName: string): Promise<MCPTool[]> {
    // Check cache first
    if (this.toolCache.has(serverName)) {
      return this.toolCache.get(serverName)!;
    }
    
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }
    
    try {
      const response = await client.listTools();
      const tools = response.tools as MCPTool[];
      
      // Cache the tools
      this.toolCache.set(serverName, tools);
      
      console.log(`📋 Listed ${tools.length} tools from ${serverName}`);
      
      return tools;
    } catch (error) {
      throw new Error(`Failed to list tools from ${serverName}: ${(error as Error).message}`);
    }
  }
  
  /**
   * Call a tool on an MCP server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }
    
    try {
      console.log(`🔧 Calling MCP tool: ${serverName}.${toolName}`);
      
      const response = await client.callTool({
        name: toolName,
        arguments: args
      });
      
      console.log(`✓ Tool call completed: ${serverName}.${toolName}`);
      
      return response;
    } catch (error) {
      throw new Error(`Tool call failed (${serverName}.${toolName}): ${(error as Error).message}`);
    }
  }
  
  /**
   * Disconnect from a specific server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
      this.toolCache.delete(serverName);
      console.log(`✓ Disconnected from: ${serverName}`);
    }
  }
  
  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    console.log("🔌 Disconnecting from all MCP servers...");
    
    for (const name of this.clients.keys()) {
      await this.disconnect(name);
    }
    
    console.log("✓ All MCP servers disconnected");
  }
  
  /**
   * Get list of connected servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
  
  /**
   * Check if a server is connected
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}