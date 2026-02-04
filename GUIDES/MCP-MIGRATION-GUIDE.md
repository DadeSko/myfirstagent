# 🔄 MCP Migration Guide

Guide for migrating from separate MCP agent to integrated approach.

---

## Current State

You have two files:
- `agent.ts` - Original agent (no MCP)
- `agent-with-mcp.ts` - Agent with MCP support

## Goal

Merge MCP functionality into `agent.ts` for a single entry point.

---

## When to Migrate

### Stay with Separate Files If:
- ✅ Still learning MCP
- ✅ Testing different MCP servers
- ✅ Team uses original agent for some tasks
- ✅ Want ability to quickly disable MCP

### Migrate to Single File If:
- ✅ MCP is working reliably
- ✅ Always want MCP available
- ✅ Ready for production deployment
- ✅ Team has adopted MCP in workflows

---

## Migration Steps

### Step 1: Backup Your Working Agent

```bash
# Backup current agent
cp agent.ts agent.backup.ts

# You can always revert with:
# cp agent.backup.ts agent.ts
```

### Step 2: Add MCP Imports

```typescript
// At the top of agent.ts, add:
import { MCPClient } from "./tools/mcp/client";
import { initializeMCP, cleanupMCP } from "./tools/mcp/init";
```

### Step 3: Create MCP Client

```typescript
// After Anthropic client initialization:
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Add MCP client:
const mcpClient = new MCPClient();
```

### Step 4: Modify Agent Loop Function

```typescript
// Change function signature to accept tools:
async function agentLoop(
  userMessage: string,
  availableTools: ToolImplementation[]  // Add this parameter
) {
  console.log("\n🤖 Agent starting...\n");
  console.log(`User: ${userMessage}\n`);

  // Build tool definitions and execution map
  const toolDefinitions = availableTools.map((tool) => tool.definition);
  const toolMap = new Map(
    availableTools.map((tool) => [tool.definition.name, tool.execute])
  );

  // ... rest of the loop remains the same, but use:
  // - toolDefinitions instead of TOOLS
  // - toolMap for execution
}
```

### Step 5: Update Main Function

```typescript
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: ts-node agent.ts <your message>");
    console.log('\nExample: ts-node agent.ts "List all TypeScript files"');
    console.log("\nMCP Servers:");
    console.log("  Enable with: MCP_SERVERS=github,slack ts-node agent.ts 'task'");
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

    if (mcpTools.length > 0) {
      console.log(`\n📊 Agent initialized with ${allTools.length} tools:`);
      console.log(`   - Core tools: ${ALL_TOOLS.length}`);
      console.log(`   - MCP tools: ${mcpTools.length}`);
    }

    // Run the agent with all tools
    await agentLoop(userMessage, allTools);

    // Cleanup MCP
    await cleanupMCP(mcpClient);
  } catch (error) {
    console.error("Error:", error);
    await cleanupMCP(mcpClient);
    process.exit(1);
  }
}

main();
```

### Step 6: Update Execute Tool Function

```typescript
// Update to use dynamic tool map
async function executeTool(
  toolName: string,
  toolInput: any,
  toolMap: Map<string, ToolImplementation["execute"]>  // Add parameter
): Promise<string> {
  const executor = toolMap.get(toolName);
  if (!executor) {
    return `Unknown tool: ${toolName}`;
  }
  return executor(toolInput);
}

// Update calls in agentLoop to pass toolMap:
const result = await executeTool(block.name, block.input, toolMap);
```

---

## Complete Modified Agent.ts

Here's what the key sections should look like after migration:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { ALL_TOOLS, ToolImplementation } from "./tools";
import { MCPClient } from "./tools/mcp/client";
import { initializeMCP, cleanupMCP } from "./tools/mcp/init";

// Initialize clients
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const mcpClient = new MCPClient();

// Execute tool
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

// Agent loop - now accepts tools parameter
async function agentLoop(
  userMessage: string,
  availableTools: ToolImplementation[]
) {
  console.log("\n🤖 Agent starting...\n");
  console.log(`User: ${userMessage}\n`);

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

  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: toolDefinitions,  // Use dynamic tools
      messages: messages,
    });

    console.log(`\nStop reason: ${response.stop_reason}`);

    messages.push({
      role: "assistant",
      content: response.content,
    });

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

      messages.push({
        role: "user",
        content: toolResults,
      });
    }
  }

  console.log("\n✅ Agent finished\n");
}

// Main with MCP initialization
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: ts-node agent.ts <your message>");
    console.log('\nExample: ts-node agent.ts "List all TypeScript files"');
    console.log("\nMCP Servers:");
    console.log("  Enable: MCP_SERVERS=github,slack ts-node agent.ts 'task'");
    process.exit(1);
  }

  const userMessage = args.join(" ");

  try {
    // Initialize MCP
    let mcpTools: ToolImplementation[] = [];
    try {
      mcpTools = await initializeMCP(mcpClient);
    } catch (error) {
      console.warn("⚠️  MCP failed, continuing without MCP");
    }

    // Combine tools
    const allTools = [...ALL_TOOLS, ...mcpTools];

    if (mcpTools.length > 0) {
      console.log(`\n📊 Tools: ${allTools.length} (${ALL_TOOLS.length} core + ${mcpTools.length} MCP)`);
    }

    // Run agent
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
```

---

## Testing After Migration

### Test 1: Without MCP (Baseline)

```bash
# Should work exactly like before
npx ts-node agent.ts "list all TypeScript files"
```

### Test 2: With MCP

```bash
# Should now support MCP
MCP_SERVERS=github npx ts-node agent.ts "list my GitHub repos"
```

### Test 3: All Original Functionality

```bash
# Test each primitive
npx ts-node agent.ts "read package.json"
npx ts-node agent.ts "list files in src"
npx ts-node agent.ts "run ls -la"
npx ts-node agent.ts "find all TODO comments"
```

---

## Rollback Plan

If something goes wrong:

```bash
# Restore backup
cp agent.backup.ts agent.ts

# Or use git
git checkout agent.ts
```

---

## After Migration

### Remove Duplicate File

Once you've verified the integrated agent works:

```bash
# Optional: Remove separate MCP agent
rm agent-with-mcp.ts

# Or keep it as reference
mv agent-with-mcp.ts agent-with-mcp.ts.reference
```

### Update Documentation

Update your README.md and scripts:

```json
// package.json
{
  "scripts": {
    "agent": "ts-node agent.ts",
    "agent:gh": "MCP_SERVERS=github ts-node agent.ts",
    "agent:full": "MCP_SERVERS=github,slack ts-node agent.ts"
  }
}
```

---

## Comparison: Before vs After

### Before Migration

```bash
# Two separate commands
npx ts-node agent.ts "task"                      # No MCP
npx ts-node agent-with-mcp.ts "task"            # With MCP
```

### After Migration

```bash
# Single command with optional MCP
npx ts-node agent.ts "task"                      # No MCP
MCP_SERVERS=github npx ts-node agent.ts "task"  # With MCP
```

---

## Benefits of Integration

1. ✅ **Single entry point** - Easier for users
2. ✅ **Consistent interface** - Same command, optional MCP
3. ✅ **Simpler maintenance** - One file to update
4. ✅ **Production ready** - Professional single-agent setup

## When to Stay Separate

1. ✅ **Still learning** - Experimentation phase
2. ✅ **Testing multiple servers** - Frequent changes
3. ✅ **Team preference** - Some use MCP, some don't
4. ✅ **Risk mitigation** - Easy rollback

---

**Remember**: There's no rush to migrate. The separate file approach is perfectly valid and professional. Migrate when you're ready! 🚀
