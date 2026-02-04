#!/usr/bin/env ts-node

/**
 * Test script for MCP integration
 * 
 * This script tests MCP client functionality without running the full agent.
 * Useful for debugging MCP server connections.
 */

import { MCPClient } from "./client";

async function testMCP() {
  console.log("🧪 Testing MCP Integration\n");
  
  const client = new MCPClient();
  
  // Test 1: GitHub Server
  console.log("Test 1: Connecting to GitHub MCP Server");
  console.log("=========================================\n");
  
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log("⚠️  GITHUB_TOKEN not set, skipping GitHub test\n");
    } else {
      await client.connect("github", {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: githubToken
        }
      });
      
      const tools = await client.listTools("github");
      
      console.log(`✓ Connected to GitHub MCP server`);
      console.log(`✓ Available tools: ${tools.length}\n`);
      
      console.log("GitHub Tools:");
      tools.forEach((tool, i) => {
        console.log(`  ${i + 1}. ${tool.name}`);
        console.log(`     ${tool.description.split('\n')[0]}\n`);
      });
      
      await client.disconnect("github");
    }
  } catch (error) {
    console.error("❌ GitHub test failed:", (error as Error).message);
    console.log("   Make sure @modelcontextprotocol/server-github is installed");
    console.log("   npm install -g @modelcontextprotocol/server-github\n");
  }
  
  // Test 2: Filesystem Server
  console.log("\nTest 2: Connecting to Filesystem MCP Server");
  console.log("===========================================\n");
  
  try {
    const allowedDir = process.env.ALLOWED_DIRECTORY || process.cwd();
    
    await client.connect("filesystem", {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", allowedDir]
    });
    
    const tools = await client.listTools("filesystem");
    
    console.log(`✓ Connected to Filesystem MCP server`);
    console.log(`✓ Allowed directory: ${allowedDir}`);
    console.log(`✓ Available tools: ${tools.length}\n`);
    
    console.log("Filesystem Tools:");
    tools.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.name}`);
      console.log(`     ${tool.description.split('\n')[0]}\n`);
    });
    
    await client.disconnect("filesystem");
  } catch (error) {
    console.error("❌ Filesystem test failed:", (error as Error).message);
    console.log("   Make sure @modelcontextprotocol/server-filesystem is installed");
    console.log("   npm install -g @modelcontextprotocol/server-filesystem\n");
  }
  
  // Summary
  console.log("\n📊 Test Summary");
  console.log("==============\n");
  
  const connected = client.getConnectedServers();
  if (connected.length > 0) {
    console.log(`✓ Successfully tested ${connected.length} MCP server(s)`);
    console.log("✓ MCP integration is working!");
  } else {
    console.log("⚠️  No MCP servers were successfully connected");
    console.log("   Check that:");
    console.log("   1. MCP SDK is installed: npm install @modelcontextprotocol/sdk");
    console.log("   2. MCP servers are installed globally");
    console.log("   3. Environment variables are set (GITHUB_TOKEN, etc.)");
  }
  
  await client.disconnectAll();
  
  console.log("\n✅ Test complete\n");
}

// Run tests
testMCP().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
