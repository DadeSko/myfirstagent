import Anthropic from "@anthropic-ai/sdk";
import { ALL_TOOLS, ToolImplementation } from "./tools";

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Build tool definitions for API
const TOOLS = ALL_TOOLS.map((tool) => tool.definition);

// Create execution map for fast lookup
const toolExecutors = new Map<string, ToolImplementation["execute"]>(
  ALL_TOOLS.map((tool) => [tool.definition.name, tool.execute])
);

// Execute tool based on name and input
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  const executor = toolExecutors.get(toolName);
  if (!executor) {
    return `Unknown tool: ${toolName}`;
  }
  return executor(toolInput);
}

// The main agent loop - this is the heart of everything
async function agentLoop(userMessage: string) {
  console.log("\n🤖 Agent starting...\n");
  console.log(`User: ${userMessage}\n`);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  // Geoffrey's insight: "300 lines of code running in a loop with LLM tokens"
  // This is that loop!
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: TOOLS,
      messages: messages,
    });

    console.log(`\nStop reason: ${response.stop_reason}`);

    // Add assistant's response to conversation
    messages.push({
      role: "assistant",
      content: response.content,
    });

    // Check if we're done (no more tool calls)
    if (response.stop_reason === "end_turn") {
      // Extract text responses
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

          const result = await executeTool(block.name, block.input);

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
    console.log("Usage: ts-node agent.ts <your message>");
    console.log('\nExample: ts-node agent.ts "List all TypeScript files"');
    process.exit(1);
  }

  const userMessage = args.join(" ");

  try {
    await agentLoop(userMessage);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
