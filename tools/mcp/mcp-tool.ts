import { ToolImplementation } from "../types";
import { MCPClient, MCPTool } from "./client";

/**
 * Create a ToolImplementation from an MCP tool
 * 
 * This wrapper bridges MCP tools to our agent's tool system.
 * Each MCP tool becomes a regular agent tool.
 */
export function createMCPTool(
  mcpClient: MCPClient,
  serverName: string,
  mcpTool: MCPTool
): ToolImplementation {
  return {
    definition: {
      // Prefix with server name to avoid conflicts
      name: `${serverName}_${mcpTool.name}`,
      
      // Use MCP tool's description
      description: `[MCP: ${serverName}] ${mcpTool.description}`,
      
      // Use MCP tool's input schema
      input_schema: mcpTool.inputSchema
    },
    
    execute: async (input: any): Promise<string> => {
      try {
        // Call the MCP tool
        const result = await mcpClient.callTool(
          serverName,
          mcpTool.name,
          input
        );
        
        // MCP tools return { content: [...] }
        // Each content block can be text, resource, or other types
        if (result.content && Array.isArray(result.content)) {
          const formattedContent = result.content
            .map((item: any) => {
              // Handle different content types
              if (item.type === "text") {
                return item.text;
              } else if (item.type === "resource") {
                return `Resource: ${JSON.stringify(item.resource, null, 2)}`;
              } else if (item.type === "image") {
                return `Image: ${item.data ? '[binary data]' : item.url}`;
              } else {
                return JSON.stringify(item, null, 2);
              }
            })
            .join("\n\n");
          
          return formattedContent || "Tool executed successfully (no output)";
        }
        
        // Fallback: stringify the entire result
        return JSON.stringify(result, null, 2);
      } catch (error) {
        return `MCP tool error (${serverName}.${mcpTool.name}): ${(error as Error).message}`;
      }
    }
  };
}

/**
 * Load all tools from an MCP server and wrap them
 */
export async function loadMCPServerTools(
  mcpClient: MCPClient,
  serverName: string
): Promise<ToolImplementation[]> {
  try {
    // Get all available tools from the server
    const mcpTools = await mcpClient.listTools(serverName);
    
    // Wrap each MCP tool
    const wrappedTools = mcpTools.map(mcpTool =>
      createMCPTool(mcpClient, serverName, mcpTool)
    );
    
    console.log(`✓ Loaded ${wrappedTools.length} tools from ${serverName}`);
    
    return wrappedTools;
  } catch (error) {
    console.error(`Failed to load tools from ${serverName}:`, error);
    return [];
  }
}
