# 🔌 MCP Integration Guide

Complete guide to integrating Model Context Protocol (MCP) servers into your coding agent.

---

## 🎯 What is MCP?

**Model Context Protocol** is Anthropic's standard for connecting AI systems to external data sources and tools. Think of it as:

> "A universal adapter that lets Claude talk to any service - GitHub, Slack, databases, APIs, etc."

### Key Concepts

```
┌─────────────┐
│   Claude    │
│   Agent     │
└──────┬──────┘
       │
       ├─→ MCP Client (in your agent)
       │
       ├─→ MCP Server 1 (GitHub)
       ├─→ MCP Server 2 (Slack)
       ├─→ MCP Server 3 (PostgreSQL)
       └─→ MCP Server N (Custom)
```

**Components:**
- **MCP Client**: Built into your agent (what you'll build)
- **MCP Server**: External service provider (GitHub, Slack, etc.)
- **Protocol**: Standardized communication (JSON-RPC over stdio/HTTP)

---

## 📊 Why Add MCP?

### Without MCP
```typescript
// Limited to filesystem and bash
await readFile("config.json")
await runBash("curl https://api.github.com/...")
```

### With MCP
```typescript
// Direct integration with services
await github.createIssue({ title: "Bug", body: "..." })
await slack.sendMessage({ channel: "#dev", text: "Deploy done" })
await postgres.query("SELECT * FROM users")
```

### Real Use Cases for Effectful
1. **GitHub Integration**: Create issues, PRs, manage repos
2. **Slack Integration**: Post updates, read channels
3. **Database Access**: Query analytics, user data
4. **Google Drive**: Access docs, sheets
5. **Custom APIs**: Effectful internal services

---

## 🏗️ Architecture Overview

### Current Agent Flow
```
User → Agent Loop → Tools (read, list, bash, edit) → Response
```

### With MCP Integration
```
User → Agent Loop → Tools:
                     ├─ Primitives (read, list, bash, edit)
                     ├─ High-level (workspace_manager)
                     └─ MCP Tools (github, slack, db, ...)
                         ↓
                    MCP Client
                         ↓
                    MCP Servers (external)
```

### Integration Approaches

**We provide TWO approaches for integrating MCP:**

#### Approach 1: Separate File (`agent-with-mcp.ts`) ✅ Recommended
- **What**: Create a new agent file that includes MCP
- **Pros**:
  - Original `agent.ts` remains untouched
  - Can run both versions side-by-side
  - Safe experimentation
  - Easy rollback if issues occur
- **Cons**:
  - Two entry points to maintain
- **When to use**: Learning phase, testing, gradual adoption

**Usage:**
```bash
# Original agent (no MCP)
npx ts-node agent.ts "list files"

# Agent with MCP
MCP_SERVERS=github npx ts-node agent-with-mcp.ts "create GitHub issue"
```

#### Approach 2: Modify Original (`agent.ts`) ⚠️ Advanced
- **What**: Add MCP directly to your existing agent
- **Pros**:
  - Single entry point
  - Always available
  - Cleaner in production
- **Cons**:
  - Modifies working code
  - Harder to disable MCP
- **When to use**: Production deployment, after testing with Approach 1

**This guide uses Approach 1** (separate file) because it's safer for learning. Once you're comfortable with MCP, you can migrate to Approach 2 if desired.

---

## 📦 Installation

### 1. Install MCP SDK

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Verify Installation

```bash
npx mcp --version
```

---

## 🔧 Implementation Steps

### Step 1: Create MCP Client Module

```typescript
// tools/mcp/client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class MCPClient {
  private clients = new Map<string, Client>();
  
  async connect(
    name: string, 
    config: MCPServerConfig
  ): Promise<Client> {
    // Create transport (stdio for local servers)
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...process.env, ...config.env }
    });
    
    // Create client
    const client = new Client({
      name: `agent-${name}`,
      version: "1.0.0"
    }, {
      capabilities: {}
    });
    
    // Connect
    await client.connect(transport);
    
    // Store for later use
    this.clients.set(name, client);
    
    console.log(`✓ Connected to MCP server: ${name}`);
    
    return client;
  }
  
  async listTools(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }
    
    const response = await client.listTools();
    return response.tools;
  }
  
  async callTool(
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }
    
    const response = await client.callTool({
      name: toolName,
      arguments: args
    });
    
    return response;
  }
  
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
      console.log(`✓ Disconnected from: ${serverName}`);
    }
  }
  
  async disconnectAll(): Promise<void> {
    for (const name of this.clients.keys()) {
      await this.disconnect(name);
    }
  }
}
```

### Step 2: Create MCP Configuration

```typescript
// mcp-config.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${DATABASE_URL}"
      }
    }
  }
}
```

### Step 3: Create MCP Tool Wrapper

```typescript
// tools/mcp/mcp-tool.ts
import { ToolImplementation } from "../types";
import { MCPClient } from "./client";

export function createMCPTool(
  mcpClient: MCPClient,
  serverName: string,
  mcpTool: any
): ToolImplementation {
  return {
    definition: {
      name: `mcp_${serverName}_${mcpTool.name}`,
      description: mcpTool.description,
      input_schema: mcpTool.inputSchema
    },
    
    execute: async (input: any) => {
      try {
        const result = await mcpClient.callTool(
          serverName,
          mcpTool.name,
          input
        );
        
        // MCP returns { content: [...] }
        if (result.content && Array.isArray(result.content)) {
          return result.content
            .map((item: any) => {
              if (item.type === "text") return item.text;
              if (item.type === "resource") return JSON.stringify(item.resource);
              return JSON.stringify(item);
            })
            .join("\n");
        }
        
        return JSON.stringify(result);
      } catch (error) {
        return `MCP tool error: ${(error as Error).message}`;
      }
    }
  };
}
```

### Step 4: Create Agent with MCP

**Two Options:**

#### Option A: Separate File (Recommended for Learning)

Create a new file `agent-with-mcp.ts` that includes MCP integration. This keeps your original `agent.ts` untouched.

```typescript
// agent-with-mcp.ts
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

// ... (copy agent loop from agent.ts) ...

async function main() {
  // ... existing validation code ...
  
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
```

**Usage:**
```bash
# Without MCP
npx ts-node agent.ts "task"

# With MCP
MCP_SERVERS=github npx ts-node agent-with-mcp.ts "task"
```

#### Option B: Modify Original Agent.ts (Production Approach)

If you want a single entry point, modify your existing `agent.ts` to include MCP. This is better for production but modifies working code.

```typescript
// At the top of agent.ts
import { MCPClient } from "./tools/mcp/client";
import { initializeMCP, cleanupMCP } from "./tools/mcp/init";

const mcpClient = new MCPClient();

// In main() function, before agentLoop()
const mcpTools = await initializeMCP(mcpClient);
const allTools = [...ALL_TOOLS, ...mcpTools];

// Pass allTools to agentLoop instead of ALL_TOOLS

// In error handling and at end
await cleanupMCP(mcpClient);
```

**Recommendation**: Start with **Option A** (separate file). Once you're comfortable with MCP, migrate to Option B if you want a single agent entry point.

---

## 🧪 Testing MCP Integration

### Test 1: GitHub Server

```bash
# Install GitHub MCP server
npm install -g @modelcontextprotocol/server-github

# Set token
export GITHUB_TOKEN='your-github-token'

# Test
npx ts-node agent.ts "Create a GitHub issue in my repo titled 'Test from agent'"
```

### Test 2: Filesystem Server

```bash
# Install filesystem server
npm install -g @modelcontextprotocol/server-filesystem

# Test
npx ts-node agent.ts "List all files in the project using MCP filesystem server"
```

### Test 3: Custom Server

```bash
# Create simple MCP server
npx @modelcontextprotocol/create-server my-custom-server

# Implement your logic
# Add to mcp-config.json
# Test
```

---

## 🎨 Available MCP Servers

### Official Servers

1. **@modelcontextprotocol/server-github**
   - Create issues, PRs
   - Manage repos
   - Search code

2. **@modelcontextprotocol/server-filesystem**
   - Safe filesystem access
   - Read/write files
   - Directory operations

3. **@modelcontextprotocol/server-postgres**
   - Query databases
   - Execute SQL
   - Schema inspection

4. **@modelcontextprotocol/server-slack**
   - Send messages
   - Read channels
   - Manage threads

5. **@modelcontextprotocol/server-google-drive**
   - Access docs
   - Search files
   - Download/upload

### Community Servers

Check [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) for more.

---

## 🔒 Security Best Practices

### 1. Environment Variables

```bash
# .env
GITHUB_TOKEN=ghp_xxxx
DATABASE_URL=postgresql://...
SLACK_TOKEN=xoxb-xxxx
```

### 2. Allowed Paths

```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/safe/directory/only"  // Restrict access
    ]
  }
}
```

### 3. Token Scopes

Use minimal scopes:
- GitHub: `repo`, `issues` (not `admin`)
- Slack: `chat:write` (not full access)

---

## 🎯 Real-World Examples

### Example 1: GitHub Issue Creator

```bash
npx ts-node agent.ts "Search my codebase for all TODOs, then create GitHub issues for each one in the 'effectful/project' repo"
```

**Flow:**
1. Uses `code_search` to find TODOs
2. Uses MCP GitHub tool to create issues
3. Returns issue links

### Example 2: Slack Deployment Notifier

```bash
npx ts-node agent.ts "Run tests, if they pass, deploy to staging, then notify #dev-team on Slack"
```

**Flow:**
1. Uses `bash` to run tests
2. Uses `bash` to deploy
3. Uses MCP Slack tool to notify

### Example 3: Database Analytics

```bash
npx ts-node agent.ts "Query the users table, analyze growth trends, create a chart, and post to Slack"
```

**Flow:**
1. Uses MCP Postgres to query
2. Uses local Python/JS to create chart
3. Uses MCP Slack to share

---

## 📊 Performance Considerations

### Tool Count Impact

```typescript
// Without MCP: 7 tools (~2k tokens)
const tools = [
  readFile, listFiles, bash, editFile, 
  codeSearch, gitOps, workspaceManager
];

// With MCP: 7 + N tools (~2k + N*500 tokens)
const tools = [
  ...primitives,
  ...mcpTools  // Each adds ~500 tokens
];
```

**Geoffrey's Rule**: Less is more in context window.

**Solution**: Enable MCP servers selectively based on task.

### Connection Overhead

```typescript
// ❌ BAD: Connect for every task
async function agentLoop(message) {
  await initializeMCP();  // Slow!
  // ...
}

// ✅ GOOD: Connect once, reuse
await initializeMCP();  // At startup
await agentLoop(message1);
await agentLoop(message2);
await mcpClient.disconnectAll();  // At shutdown
```

---

## 🔧 Troubleshooting

### Issue 1: Connection Timeout

```
Error: MCP server connection timeout
```

**Solution:**
```typescript
const client = new Client({
  name: "agent",
  version: "1.0.0"
}, {
  capabilities: {},
  timeout: 30000  // 30 seconds
});
```

### Issue 2: Tool Not Found

```
Error: Tool 'github_create_issue' not found
```

**Solution:**
```bash
# Verify server is running
npx @modelcontextprotocol/server-github --version

# Check mcp-config.json
# Verify tool name in listTools() output
```

### Issue 3: Permission Denied

```
Error: Insufficient permissions
```

**Solution:**
- Check token scopes
- Verify environment variables
- Test token manually with API

---

## 🎓 Advanced Patterns

### Pattern 1: Conditional MCP Loading

```typescript
async function initializeMCP(taskType: string) {
  const mcpTools = [];
  
  // Only load relevant servers
  if (taskType.includes("github")) {
    await mcpClient.connect("github", config.github);
    mcpTools.push(...await getGitHubTools());
  }
  
  if (taskType.includes("slack")) {
    await mcpClient.connect("slack", config.slack);
    mcpTools.push(...await getSlackTools());
  }
  
  return mcpTools;
}
```

### Pattern 2: MCP Tool Composition

```typescript
// High-level tool that uses multiple MCP tools
const deployAndNotifyTool: ToolImplementation = {
  definition: { name: "deploy_and_notify", ... },
  
  execute: async (input) => {
    // 1. Deploy (bash)
    await runBash("npm run deploy");
    
    // 2. Create release (GitHub MCP)
    await mcpClient.callTool("github", "create_release", {...});
    
    // 3. Notify (Slack MCP)
    await mcpClient.callTool("slack", "send_message", {...});
    
    return "Deployed and notified!";
  }
};
```

### Pattern 3: MCP Caching

```typescript
class MCPClient {
  private toolCache = new Map<string, any[]>();
  
  async listTools(serverName: string): Promise<any[]> {
    // Check cache
    if (this.toolCache.has(serverName)) {
      return this.toolCache.get(serverName)!;
    }
    
    // Fetch and cache
    const tools = await this.clients.get(serverName)!.listTools();
    this.toolCache.set(serverName, tools.tools);
    
    return tools.tools;
  }
}
```

---

## 📚 Next Steps

### Immediate (This Week)
1. Install MCP SDK
2. Implement MCPClient class
3. Test with GitHub server
4. Create mcp-config.json

### Short-term (Next Week)
1. Add 2-3 MCP servers (GitHub, Slack, Filesystem)
2. Create high-level tools using MCP
3. Test real workflows
4. Document custom server creation

### Long-term (This Month)
1. Build custom MCP server for Effectful
2. Integrate with internal APIs
3. Create specialized agent workflows
4. Share with team

---

## 🎯 Key Takeaways

1. **MCP = Universal Adapter**: Connect to any service
2. **Modular Design**: Enable/disable servers as needed
3. **Context Management**: Be mindful of token usage
4. **Security First**: Minimal scopes, environment variables
5. **Composition**: Combine MCP tools with primitives

---

## 📖 Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK Docs](https://github.com/modelcontextprotocol/sdk)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Anthropic MCP Guide](https://docs.anthropic.com/en/docs/build-with-claude/mcp)

---

**Remember**: MCP doesn't replace your primitives - it extends them. Your 6 core tools remain the foundation, MCP adds specialized capabilities on top! 🔌✨
