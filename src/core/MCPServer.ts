import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  ListToolsResult,
  ReadResourceResult,
  ListResourcesResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { 
  IDataService, 
  IMCPServer,
  ListRecordsArgsSchema,
  GetRecordArgsSchema,
  CreateRecordArgsSchema,
  UpdateRecordArgsSchema,
  DeleteRecordArgsSchema,
  SearchRecordsArgsSchema
} from '../types/index.js';
import { 
  formatErrorResponse, 
  getInputSchema, 
  formatResourceContent,
  logger,
  validateInput,
  safeExecute
} from '../utils/index.js';

/**
 * Base MCP Server implementation that can be extended for specific use cases
 */
export class MCPServer implements IMCPServer {
  private server: Server;
  private dataService: IDataService;
  
  /**
   * Resource URI prefix used for all resources in this server
   */
  protected resourcePrefix: string;

  /**
   * Creates a new MCP Server
   * 
   * @param dataService - Service for data operations
   * @param options - Server configuration options
   */
  constructor(
    dataService: IDataService, 
    options: {
      name: string;
      version: string;
      resourcePrefix?: string;
    }
  ) {
    this.dataService = dataService;
    this.resourcePrefix = options.resourcePrefix || 'mcp://';
    
    this.server = new Server(
      {
        name: options.name,
        version: options.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    );
    
    this.initializeHandlers();
  }

  /**
   * Sets up the request handlers for the MCP protocol
   */
  private initializeHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, this.handleListResources.bind(this));
    this.server.setRequestHandler(ReadResourceRequestSchema, this.handleReadResource.bind(this));
    this.server.setRequestHandler(ListToolsRequestSchema, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequestSchema, this.handleCallTool.bind(this));
  }

  /**
   * Handles listing available resources
   */
  protected async handleListResources(): Promise<ListResourcesResult> {
    try {
      const resources = await this.dataService.listResources();
      
      return {
        resources: resources.map(resource => ({
          uri: resource.uri,
          mimeType: 'application/json',
          name: resource.name,
        })),
      };
    } catch (error) {
      logger.error('Error listing resources:', error);
      return { resources: [] };
    }
  }

  /**
   * Handles reading a specific resource
   */
  protected async handleReadResource(request: z.infer<typeof ReadResourceRequestSchema>): Promise<ReadResourceResult> {
    try {
      const { uri } = request.params;
      const resource = await this.dataService.getResource(uri);
      
      return {
        contents: [
          formatResourceContent(uri, resource),
        ],
      };
    } catch (error) {
      logger.error(`Error reading resource ${request.params.uri}:`, error);
      throw new Error(`Resource not found: ${request.params.uri}`);
    }
  }

  /**
   * Handles listing available tools
   */
  protected async handleListTools(): Promise<ListToolsResult> {
    return {
      tools: [
        {
          name: 'list_records',
          description: 'List records from a resource',
          inputSchema: getInputSchema(ListRecordsArgsSchema),
        },
        {
          name: 'search_records',
          description: 'Search for records containing specific text',
          inputSchema: getInputSchema(SearchRecordsArgsSchema),
        },
        {
          name: 'get_record',
          description: 'Get a specific record by ID',
          inputSchema: getInputSchema(GetRecordArgsSchema),
        },
        {
          name: 'create_record',
          description: 'Create a new record in a resource',
          inputSchema: getInputSchema(CreateRecordArgsSchema),
        },
        {
          name: 'update_record',
          description: 'Update a record in a resource',
          inputSchema: getInputSchema(UpdateRecordArgsSchema),
        },
        {
          name: 'delete_record',
          description: 'Delete a record from a resource',
          inputSchema: getInputSchema(DeleteRecordArgsSchema),
        },
      ],
    };
  }

  /**
   * Handles calling a specific tool
   */
  protected async handleCallTool(request: z.infer<typeof CallToolRequestSchema>): Promise<CallToolResult> {
    const toolName = request.params.name;
    
    try {
      switch (toolName) {
        case 'list_records': {
          return await safeExecute(toolName, async () => {
            const args = validateInput(ListRecordsArgsSchema, request.params.arguments);
            const records = await this.dataService.queryResource(
              args.resourceUri,
              {
                maxRecords: args.maxRecords,
                filter: args.filter,
                sort: args.sort,
              }
            );
            return records;
          });
        }

        case 'search_records': {
          return await safeExecute(toolName, async () => {
            const args = validateInput(SearchRecordsArgsSchema, request.params.arguments);
            const records = await this.dataService.queryResource(
              args.resourceUri,
              {
                searchTerm: args.searchTerm,
                fields: args.fields,
                maxRecords: args.maxRecords,
              }
            );
            return records;
          });
        }

        case 'get_record': {
          return await safeExecute(toolName, async () => {
            const args = validateInput(GetRecordArgsSchema, request.params.arguments);
            const resource = await this.dataService.getResource(args.resourceUri);
            // In a real implementation, you would fetch the specific record
            // This is a placeholder for the template
            return { id: args.recordId, resource: resource.name };
          });
        }

        case 'create_record': {
          return await safeExecute(toolName, async () => {
            const args = validateInput(CreateRecordArgsSchema, request.params.arguments);
            const record = await this.dataService.createRecord(args.resourceUri, args.data);
            return record;
          });
        }

        case 'update_record': {
          return await safeExecute(toolName, async () => {
            const args = validateInput(UpdateRecordArgsSchema, request.params.arguments);
            const record = await this.dataService.updateRecord(args.resourceUri, args.recordId, args.data);
            return record;
          });
        }

        case 'delete_record': {
          return await safeExecute(toolName, async () => {
            const args = validateInput(DeleteRecordArgsSchema, request.params.arguments);
            const success = await this.dataService.deleteRecord(args.resourceUri, args.recordId);
            return { success, id: args.recordId };
          });
        }

        default: {
          return formatErrorResponse(toolName, `Unknown tool: ${toolName}`);
        }
      }
    } catch (error) {
      return formatErrorResponse(toolName, error);
    }
  }

  /**
   * Registers a custom tool with the server
   * 
   * @param toolName - Name of the tool
   * @param description - Description of what the tool does
   * @param inputSchema - Zod schema for the tool's input
   * @param handler - Function to handle tool calls
   */
  public registerTool(
    toolName: string,
    description: string,
    inputSchema: z.ZodType<object>,
    handler: (_args: unknown) => Promise<unknown>
  ): void {
    // Add the tool to the list_tools response
    const existingHandler = this.handleListTools;
    this.handleListTools = async () => {
      const result = await existingHandler.call(this);
      result.tools.push({
        name: toolName,
        description,
        inputSchema: getInputSchema(inputSchema),
      });
      return result;
    };

    // Add the tool handler to call_tool
    const existingCallHandler = this.handleCallTool;
    this.handleCallTool = async (request) => {
      if (request.params.name === toolName) {
        return await safeExecute(toolName, async () => {
          const args = validateInput(inputSchema, request.params.arguments);
          return await handler(args);
        });
      }
      return existingCallHandler.call(this, request);
    };
  }

  /**
   * Connects the server to a transport
   * 
   * @param transport - Transport to connect to
   */
  async connect(transport: Transport): Promise<void> {
    logger.info(`Connecting MCP server...`);
    await this.server.connect(transport);
    logger.info(`MCP server connected`);
  }

  /**
   * Closes the server connection
   */
  async close(): Promise<void> {
    logger.info(`Closing MCP server...`);
    await this.server.close();
    logger.info(`MCP server closed`);
  }
}

