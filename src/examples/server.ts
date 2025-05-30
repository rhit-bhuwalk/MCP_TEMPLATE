import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPServer } from '../core/MCPServer.js';
import { InMemoryDataService } from './services/InMemoryDataService.js';
import { 
  USER_RESOURCE, 
  SAMPLE_USERS, 
  ActivateUserArgsSchema, 
  DeactivateUserArgsSchema,
  FilterUsersByRoleArgsSchema
} from './resources/UserResource.js';
import { logger, validateInput } from '../utils/index.js';

/**
 * Main function to start the server
 */
async function main() {
  try {
    // Initialize the data service
    const dataService = new InMemoryDataService('mcp://');
    
    // Register resources
    dataService.registerResource(
      USER_RESOURCE.name, 
      USER_RESOURCE.description
    );
    
    // Seed initial data
    dataService.seedData(USER_RESOURCE.uri, SAMPLE_USERS);
    
    // Create the MCP server
    const server = new MCPServer(dataService, {
      name: 'example-mcp-server',
      version: '1.0.0',
      resourcePrefix: 'mcp://'
    });
    
    // Register custom tools
    
    // Tool to activate a user
    server.registerTool(
      'activate_user',
      'Activate a user account',
      ActivateUserArgsSchema,
      async (args) => {
        const { resourceUri, userId } = validateInput(ActivateUserArgsSchema, args);
        const result = await dataService.updateRecord(resourceUri, userId, { isActive: true });
        return { success: true, user: result };
      }
    );
    
    // Tool to deactivate a user
    server.registerTool(
      'deactivate_user',
      'Deactivate a user account',
      DeactivateUserArgsSchema,
      async (args) => {
        const { resourceUri, userId } = validateInput(DeactivateUserArgsSchema, args);
        const result = await dataService.updateRecord(resourceUri, userId, { isActive: false });
        return { success: true, user: result };
      }
    );
    
    // Tool to filter users by role
    server.registerTool(
      'filter_users_by_role',
      'Get users with a specific role',
      FilterUsersByRoleArgsSchema,
      async (args) => {
        const { resourceUri, role } = validateInput(FilterUsersByRoleArgsSchema, args);
        const users = await dataService.queryResource(resourceUri, {
          filter: { role }
        });
        return { users, count: users.length };
      }
    );
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
    
    logger.info(`MCP server running on stdio`);
    logger.info('Available resources:');
    logger.info(`- ${USER_RESOURCE.name}: ${USER_RESOURCE.uri}`);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down server...');
      await server.close();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server
main();

