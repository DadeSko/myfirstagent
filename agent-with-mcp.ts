import Anthropic from "@anthropic-ai/sdk";
import { ALL_TOOLS, ToolImplementation } from "./tools";
import { MCPClient } from "./tools/mcp/client";
import { initializeMCP, cleanupMCP } from "./tools/mcp/init";

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Global MCP client
const mcpClient = new MCPClient();

// Execute tool based on name and input
async function executeTool(
  toolName: string,
  toolInput: any,
  toolMap: Map<string, ToolImplementation["execute"]>
): Promise<string> {
  const executor = toolMap.get(toolName);
  if (!executor) {
    return `Unknown tool: ${toolName}`;
  }
  return executor(toolInput);
}

// The main agent loop
async function agentLoop(
  userMessage: string,
  availableTools: ToolImplementation[]
) {
  console.log("\n🤖 Agent starting...\n");
  console.log(`User: ${userMessage}\n`);

  // Build tool definitions and execution map
  const toolDefinitions = availableTools.map((tool) => tool.definition);
  const toolMap = new Map(
    availableTools.map((tool) => [tool.definition.name, tool.execute])
  );

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  // The agentic loop
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: toolDefinitions,
      messages: messages,
    });

    console.log(`\nStop reason: ${response.stop_reason}`);

    // Add assistant's response to conversation
    messages.push({
      role: "assistant",
      content: response.content,
    });

    // Check if we're done
    if (response.stop_reason === "end_turn") {
      const textBlocks = response.content.filter(
        (block) => block.type === "text"
      );
      if (textBlocks.length > 0) {
        console.log("\n🤖 Claude:");
        textBlocks.forEach((block) => {
          if (block.type === "text") {
            console.log(block.text);
          }
        });
      }
      break;
    }

    // Process tool calls
    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.MessageParam["content"] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`\n🔧 Tool: ${block.name}`);
          console.log(`   Input: ${JSON.stringify(block.input, null, 2)}`);

          const result = await executeTool(block.name, block.input, toolMap);

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });

          console.log(`   Result: ${result.substring(0, 100)}...`);
        }
      }

      // Add tool results back to the loop
      messages.push({
        role: "user",
        content: toolResults,
      });
    }
  }

  console.log("\n✅ Agent finished\n");
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: ts-node agent-with-mcp.ts <your message>");
    console.log('\nExample: ts-node agent-with-mcp.ts "List all TypeScript files"');
    console.log("\nMCP Servers:");
    console.log("  Enable with: MCP_SERVERS=github,slack ts-node agent-with-mcp.ts 'task'");
    console.log("  Configure in: mcp-config.json");
    process.exit(1);
  }

  const userMessage = args.join(" ");

  try {
    // Initialize MCP servers (if configured)
    let mcpTools: ToolImplementation[] = [];
    try {
      mcpTools = await initializeMCP(mcpClient);
    } catch (error) {
      console.warn("⚠️  MCP initialization failed, continuing without MCP");
    }

    // Combine core tools with MCP tools
    const allTools = [...ALL_TOOLS, ...mcpTools];

    console.log(`\n📊 Agent initialized with ${allTools.length} tools:`);
    console.log(`   - Core tools: ${ALL_TOOLS.length}`);
    console.log(`   - MCP tools: ${mcpTools.length}`);

    // Run the agent
    await agentLoop(userMessage, allTools);

    // Cleanup
    await cleanupMCP(mcpClient);
  } catch (error) {
    console.error("Error:", error);
    await cleanupMCP(mcpClient);
    process.exit(1);
  }
}

main();
