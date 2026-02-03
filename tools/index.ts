// Central export for all tools
export { Tool, ToolImplementation } from "./types";

// Primitive tools
export { readFileTool, readFile } from "./primitives/read-file";
export { listFilesTool, listFiles } from "./primitives/list-files";
export { bashTool, runBash } from "./primitives/bash";
export { editFileTool, editFile } from "./primitives/edit-file";
export {
  codeSearchTool,
  codeSearch,
  parseRipgrepOutput,
  formatSearchResults,
  CodeSearchOptions,
  SearchMatch,
} from "./primitives/code-search";
export { gitOperationsTool } from "./primitives/git-operations";

// High-level tools
export {
  workspaceManagerTool,
  workspaceManager,
  initProject,
  scaffoldStructure,
  createStructureRecursive,
  cleanWorkspace,
  analyzeProject,
  formatAnalysis,
  getAllFiles,
  backupProject,
  copyDir,
  TEMPLATES,
  WorkspaceOptions,
} from "./high-level/workspace-manager";

// All tool implementations for easy registration
import { readFileTool } from "./primitives/read-file";
import { listFilesTool } from "./primitives/list-files";
import { bashTool } from "./primitives/bash";
import { editFileTool } from "./primitives/edit-file";
import { codeSearchTool } from "./primitives/code-search";
import { gitOperationsTool } from "./primitives/git-operations";
import { workspaceManagerTool } from "./high-level/workspace-manager";

export const ALL_TOOLS = [
  readFileTool,
  listFilesTool,
  bashTool,
  editFileTool,
  codeSearchTool,
  gitOperationsTool,
  workspaceManagerTool,
];