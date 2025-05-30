import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CallToolResult, ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Converts a Zod schema to a JSON schema for use in MCP tool definitions
 * 
 * @param schema - Zod schema to convert
 * @returns JSON schema compatible with MCP
 */
export const getInputSchema = (schema: z.ZodType<object>): ListToolsResult['tools'][0]['inputSchema'] => {
  const jsonSchema = zodToJsonSchema(schema);
  if (!('type' in jsonSchema) || jsonSchema.type !== 'object') {
    throw new Error(`Invalid input schema to convert: expected an object but got ${'type' in jsonSchema ? jsonSchema.type : 'no type'}`);
  }
  return { ...jsonSchema, type: 'object' };
};

/**
 * Formats a response from a tool call
 * 
 * @param data - Data to include in the response
 * @param isError - Whether this response represents an error
 * @returns Formatted tool response
 */
export const formatToolResponse = (data: unknown, isError = false): CallToolResult => {
  return {
    content: [{
      type: 'text',
      mimeType: 'application/json',
      text: JSON.stringify(data),
    }],
    isError,
  };
};

/**
 * Creates a standardized error response for tool calls
 * 
 * @param toolName - Name of the tool that encountered an error
 * @param error - The error that occurred
 * @returns Formatted error response
 */
export const formatErrorResponse = (toolName: string, error: unknown): CallToolResult => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
    
  return formatToolResponse(
    `Error in tool ${toolName}: ${errorMessage}`,
    true
  );
};

/**
 * Safely executes a function and returns a formatted response
 * 
 * @param toolName - Name of the tool being executed
 * @param fn - Async function to execute
 * @returns Promise resolving to the formatted response
 */
export const safeExecute = async <T>(
  toolName: string, 
  fn: () => Promise<T>
): Promise<CallToolResult> => {
  try {
    const result = await fn();
    return formatToolResponse(result);
  } catch (error) {
    return formatErrorResponse(toolName, error);
  }
};

/**
 * Safely parses and validates input using a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data or throws an error
 */
export const validateInput = <T>(schema: z.ZodType<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join('; ');
      throw new Error(`Invalid input: ${formattedError}`);
    }
    throw error;
  }
};

/**
 * Creates a standard resource content object for MCP
 * 
 * @param uri - URI of the resource
 * @param data - Data to include in the resource
 * @returns Formatted resource content
 */
export const formatResourceContent = (uri: string, data: unknown) => {
  return {
    uri,
    mimeType: 'application/json',
    text: JSON.stringify(data),
  };
};

/**
 * Simple logging utility
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => 
    console.log(`[INFO] ${message}`, ...args),
  
  error: (message: string, ...args: unknown[]) => 
    console.error(`[ERROR] ${message}`, ...args),
  
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};

