/**
 * MCP Server Template
 * 
 * A starting point for building custom Model Context Protocol servers
 */

// Core exports
export { MCPServer } from './core/MCPServer.js';

// Type exports
export {
  IDataService,
  IMCPServer,
  Resource,
  Record,
  ListRecordsArgs,
  GetRecordArgs,
  CreateRecordArgs,
  UpdateRecordArgs,
  DeleteRecordArgs,
  SearchRecordsArgs,
  // Schema exports
  RecordSchema,
  ListRecordsArgsSchema,
  GetRecordArgsSchema,
  CreateRecordArgsSchema,
  UpdateRecordArgsSchema,
  DeleteRecordArgsSchema,
  SearchRecordsArgsSchema,
} from './types/index.js';

// Utility exports
export {
  formatToolResponse,
  formatErrorResponse,
  formatResourceContent,
  getInputSchema,
  safeExecute,
  validateInput,
  logger,
} from './utils/index.js';

// Example implementations (for reference)
export { InMemoryDataService } from './examples/services/InMemoryDataService.js';
export {
  UserSchema,
  USER_RESOURCE,
  ActivateUserArgsSchema,
  DeactivateUserArgsSchema,
  FilterUsersByRoleArgsSchema,
} from './examples/resources/UserResource.js';

/**
 * Getting Started:
 * 
 * 1. Create your own data service by implementing the IDataService interface
 * 2. Define your resources and their schemas
 * 3. Initialize an MCPServer with your data service
 * 4. Register custom tools as needed
 * 5. Connect to a transport (HTTP, WebSocket, etc.)
 * 
 * Example:
 * 
 * ```typescript
 * import { MCPServer, HttpTransport } from 'mcp-server-template';
 * import { MyDataService } from './services/MyDataService';
 * 
 * const dataService = new MyDataService();
 * const server = new MCPServer(dataService, {
 *   name: 'my-custom-mcp',
 *   version: '1.0.0'
 * });
 * 
 * server.registerTool(
 *   'my_custom_tool',
 *   'Description of my tool',
 *   MyToolSchema,
 *   async (args) => {
 *     // Custom implementation
 *     return { result: 'success' };
 *   }
 * );
 * 
 * const transport = new HttpTransport({ port: 3000 });
 * server.connect(transport);
 * ```
 */
