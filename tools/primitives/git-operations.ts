import { exec } from "child_process";
import { promisify } from "util";
import { ToolImplementation } from "../types";

const execAsync = promisify(exec);

interface GitOperationsInput {
  operation: "status" | "add" | "commit" | "push" | "pull" | "log" | "diff" | "branch" | "checkout" | "init";
  files?: string[];
  message?: string;
  branch?: string;
  limit?: number;
}

// PRIMITIVE: Git Operations Tool
export const gitOperationsTool: ToolImplementation = {
  definition: {
    name: "git_operations",
    description: `Perform common Git operations.

This tool provides essential Git functionality:

OPERATIONS:
- status: Show working tree status
- add: Stage files for commit (pass files array or "." for all)
- commit: Create a commit (requires message)
- push: Push commits to remote
- pull: Pull changes from remote
- log: Show commit history (optional limit)
- diff: Show changes between commits
- branch: List or create branches
- checkout: Switch branches or restore files
- init: Initialize a new Git repository

EXAMPLES:
- Check status: { operation: "status" }
- Stage all files: { operation: "add", files: ["."] }
- Commit: { operation: "commit", message: "feat: add new feature" }
- Push: { operation: "push" }
- View log: { operation: "log", limit: 10 }
- Create branch: { operation: "branch", branch: "feature/new" }
- Switch branch: { operation: "checkout", branch: "main" }

NOTES:
- Requires Git to be installed
- Operations run in current directory
- Assumes Git repository already initialized (except for init operation)
`,
    input_schema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["status", "add", "commit", "push", "pull", "log", "diff", "branch", "checkout", "init"],
          description: "Git operation to perform"
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to operate on (for add, checkout operations)"
        },
        message: {
          type: "string",
          description: "Commit message (required for commit operation)"
        },
        branch: {
          type: "string",
          description: "Branch name (for branch, checkout operations)"
        },
        limit: {
          type: "number",
          description: "Limit number of results (for log operation)"
        }
      },
      required: ["operation"]
    }
  },

  execute: async (input: GitOperationsInput): Promise<string> => {
    try {
      switch (input.operation) {
        case "status":
          return await gitStatus();
        
        case "add":
          if (!input.files || input.files.length === 0) {
            return "Error: 'files' array required for add operation";
          }
          return await gitAdd(input.files);
        
        case "commit":
          if (!input.message) {
            return "Error: 'message' required for commit operation";
          }
          return await gitCommit(input.message);
        
        case "push":
          return await gitPush();
        
        case "pull":
          return await gitPull();
        
        case "log":
          return await gitLog(input.limit || 10);
        
        case "diff":
          return await gitDiff();
        
        case "branch":
          if (input.branch) {
            return await gitCreateBranch(input.branch);
          }
          return await gitListBranches();
        
        case "checkout":
          if (!input.branch) {
            return "Error: 'branch' required for checkout operation";
          }
          return await gitCheckout(input.branch);
        
        case "init":
          return await gitInit();
        
        default:
          return `Unknown operation: ${input.operation}`;
      }
    } catch (error) {
      return `Git error: ${(error as Error).message}`;
    }
  }
};

// ============================================
// GIT OPERATION IMPLEMENTATIONS
// ============================================

async function gitStatus(): Promise<string> {
  const { stdout } = await execAsync("git status --short");
  
  if (!stdout.trim()) {
    return "✓ Working tree clean - no changes to commit";
  }
  
  return `Git Status:\n${stdout}`;
}

async function gitAdd(files: string[]): Promise<string> {
  const filesArg = files.join(" ");
  await execAsync(`git add ${filesArg}`);
  
  return `✓ Staged files: ${files.join(", ")}`;
}

async function gitCommit(message: string): Promise<string> {
  // Escape quotes in commit message
  const escapedMessage = message.replace(/"/g, '\\"');
  const { stdout } = await execAsync(`git commit -m "${escapedMessage}"`);
  
  return `✓ Commit created:\n${stdout}`;
}

async function gitPush(): Promise<string> {
  const { stdout, stderr } = await execAsync("git push");
  
  return `✓ Push completed:\n${stdout || stderr}`;
}

async function gitPull(): Promise<string> {
  const { stdout } = await execAsync("git pull");
  
  return `✓ Pull completed:\n${stdout}`;
}

async function gitLog(limit: number): Promise<string> {
  const { stdout } = await execAsync(
    `git log --oneline --decorate -n ${limit}`
  );
  
  if (!stdout.trim()) {
    return "No commits yet";
  }
  
  return `Recent commits (last ${limit}):\n${stdout}`;
}

async function gitDiff(): Promise<string> {
  const { stdout } = await execAsync("git diff");
  
  if (!stdout.trim()) {
    return "No changes in working directory";
  }
  
  return `Changes:\n${stdout}`;
}

async function gitListBranches(): Promise<string> {
  const { stdout } = await execAsync("git branch -a");
  
  return `Branches:\n${stdout}`;
}

async function gitCreateBranch(branch: string): Promise<string> {
  await execAsync(`git branch ${branch}`);
  
  return `✓ Created branch: ${branch}`;
}

async function gitCheckout(branch: string): Promise<string> {
  const { stdout } = await execAsync(`git checkout ${branch}`);
  
  return `✓ Switched to branch: ${branch}\n${stdout}`;
}

async function gitInit(): Promise<string> {
  const { stdout } = await execAsync("git init");
  
  return `✓ Initialized Git repository:\n${stdout}`;
}