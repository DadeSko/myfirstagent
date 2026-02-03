// tools/types.ts
export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolImplementation {
  definition: Tool;
  execute: (input: any) => Promise<string>;
}