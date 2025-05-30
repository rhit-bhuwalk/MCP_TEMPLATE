# MCP_TEMPLATE

A flexible and extensible template for building Model Context Protocol (MCP) servers in TypeScript. This template provides the foundation for creating custom MCP implementations that allow AI systems to interact with your data and services.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for AI systems to interact with external data sources and tools. It defines a set of operations that AI systems can use to:

- Discover available resources and tools
- Read structured data from resources
- Execute tools to perform actions or retrieve information

This template helps you implement your own MCP server to expose your data and functionality to AI systems in a standardized way.

## Features

- 🛠️ **Ready-to-use Core Components**: Base MCPServer implementation, generic data service interface, and utility functions
- 🔍 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🧩 **Extensible Architecture**: Easy to customize and extend for your specific use case
- 🔌 **Transport Support**: Works with HTTP, WebSocket, and stdio transports from the MCP SDK
- 📝 **Schema Validation**: Built-in schema validation with Zod
- 🧪 **Example Implementation**: Includes a fully working example server with in-memory data service

## Installation

```bash
# Clone the template repository
git clone https://github.com/rhit-bhuwalk/MCP_TEMPLATE.git
cd MCP_TEMPLATE

# Install dependencies
npm install

# Build the project
npm run build

# Run the example server
npm start
```

## Quick Start

1. **Create a Data Service**

```typescript
// src/services/MyDataService.ts
import { IDataService, Resource } from 'MCP_TEMPLATE';

export class MyDataService implements IDataService {
  // Implement the required methods
  async listResources(): Promise<Resource[]> {
    // Your implementation
  }
  
  async getResource(uri: string): Promise<Resource> {
    // Your implementation
  }
  
  // ... other methods
}
```

2. **Define Resources**

```typescript
// src/resources/ProductResource.ts
import { z } from 'zod';
import { Resource } from 'MCP_TEMPLATE';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  description: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const PRODUCT_RESOURCE: Resource = {
  uri: 'mcp://products',
  name: 'Products',
  description: 'Product catalog',
};
```

3. **Create the Server**

```typescript
// src/server.ts
import { HttpTransport } from '@modelcontextprotocol/sdk/transports/http.js';
import { MCPServer } from 'MCP_TEMPLATE';
import { MyDataService } from './services/MyDataService';
import { PRODUCT_RESOURCE } from './resources/ProductResource';

async function main() {
  // Initialize the data service
  const dataService = new MyDataService();
  
  // Register resources
  dataService.registerResource(
    PRODUCT_RESOURCE.name, 
    PRODUCT_RESOURCE.description
  );
  
  // Create the MCP server
  const server = new MCPServer(dataService, {
    name: 'my-mcp-server',
    version: '1.0.0',
  });
  
  // Connect to a transport
  const transport = new HttpTransport({ port: 3000 });
  await server.connect(transport);
  
  console.log('Server running on port 3000');
}

main().catch(console.error);
```

4. **Run your server**

```bash
npm run build
node dist/server.js
```

## Architecture Overview

The template is organized into the following components:

### Core

- **MCPServer**: The main server class that implements the MCP protocol and handles requests.

### Types

- **IDataService**: Interface for data access operations.
- **Resource**: Interface for resources exposed through the MCP.
- **Record**: Generic type for data records.
- **Schema Definitions**: Zod schemas for validating inputs and outputs.

### Utils

- **formatToolResponse**: Utility for formatting tool responses.
- **getInputSchema**: Converts Zod schemas to JSON schemas for MCP.
- **safeExecute**: Safely executes tool handlers with error handling.
- **validateInput**: Validates and parses input data against schemas.
- **logger**: Simple logging utility.

### Examples

- **InMemoryDataService**: Example implementation of IDataService.
- **UserResource**: Example resource definition with schema and sample data.

## Extending the Template

### Creating Custom Tools

```typescript
server.registerTool(
  'calculate_discount',
  'Calculate discount for a product',
  z.object({
    productId: z.string(),
    discountPercent: z.number().min(0).max(100),
  }),
  async (args) => {
    const { productId, discountPercent } = args;
    const product = await dataService.getRecord('mcp://products', productId);
    const discountedPrice = product.price * (1 - discountPercent / 100);
    return { 
      originalPrice: product.price,
      discountPercent,
      discountedPrice
    };
  }
);
```

### Implementing Custom Data Sources

You can connect to any data source by implementing the `IDataService` interface:

- **Database Integration**: Connect to SQL, NoSQL, or Graph databases
- **API Integration**: Wrap existing APIs as MCP resources
- **File System**: Access files and directories as resources
- **Custom Systems**: Integrate with any custom data system

Example with MongoDB:

```typescript
import { MongoClient } from 'mongodb';
import { IDataService, Resource } from 'MCP_TEMPLATE';

export class MongoDataService implements IDataService {
  private client: MongoClient;
  private resources: Map<string, Resource> = new Map();
  
  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
  }
  
  async connect() {
    await this.client.connect();
  }
  
  // Implement IDataService methods
  // ...
}
```

## API Documentation

### MCPServer

```typescript
class MCPServer implements IMCPServer {
  constructor(
    dataService: IDataService, 
    options: {
      name: string;
      version: string;
      resourcePrefix?: string;
    }
  );
  
  registerTool(
    toolName: string,
    description: string,
    inputSchema: z.ZodType<object>,
    handler: (args: unknown) => Promise<unknown>
  ): void;
  
  connect(transport: Transport): Promise<void>;
  close(): Promise<void>;
}
```

### IDataService

```typescript
interface IDataService {
  listResources(): Promise<Resource[]>;
  getResource(uri: string): Promise<Resource>;
  queryResource(uri: string, query: Record<string, unknown>): Promise<unknown[]>;
  createRecord(uri: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateRecord(uri: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteRecord(uri: string, id: string): Promise<boolean>;
}
```

For more detailed documentation, refer to:

- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/specification)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Zod Documentation](https://github.com/colinhacks/zod)

## License

MIT License
