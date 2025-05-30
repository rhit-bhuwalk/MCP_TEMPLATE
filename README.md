# MCP Template - Build Your Own AI Server

A practical template for creating Model Context Protocol (MCP) servers that enable AI assistants to interact with your data and services.

## Overview

This template provides a foundation for building MCP servers - specialized services that AI assistants can connect to for accessing external data, performing operations, and extending their capabilities beyond their training data.

**Key Capabilities:**
- Expose data as queryable resources
- Provide custom tools for AI assistants to execute
- Handle real-time data operations (CRUD)
- Connect multiple data sources and services

## Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- Understanding of REST APIs or similar concepts

## Quick Start

```bash
git clone https://github.com/rhit-bhuwalk/MCP_TEMPLATE.git
cd MCP_TEMPLATE
npm install
npm run build
npm start
```

This launches a server with sample user data that demonstrates core MCP functionality.

## Core Concepts

### Resources
Resources represent data collections that AI assistants can query. Think of them as API endpoints that return structured data.

```typescript
// Register a resource
dataService.registerResource('users', 'User account information');

// AI can now query: "Show me all users" or "Find user with ID 123"
```

### Tools
Tools are functions that AI assistants can execute to perform specific operations on your data.

```typescript
// Register a tool
server.registerTool(
  'create_user',
  'Create a new user account',
  z.object({
    name: z.string(),
    email: z.string().email()
  }),
  async (args) => {
    return await dataService.create('mcp://users', args);
  }
);
```

## Implementation Guide

### 1. Define Your Data Structure

Start by defining the shape of your data:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}
```

### 2. Register Resources

Make your data discoverable to AI assistants:

```typescript
// In your server setup
dataService.registerResource('products', 'Product inventory data');

// Seed with sample data
const sampleProducts: Product[] = [
  { id: '1', name: 'Laptop', price: 999, category: 'Electronics', inStock: true },
  { id: '2', name: 'Coffee Mug', price: 15, category: 'Kitchen', inStock: false }
];

dataService.seedData('mcp://products', sampleProducts);
```

### 3. Add Custom Tools

Create specific operations for your use case:

```typescript
// Inventory management tool
server.registerTool(
  'update_stock_status',
  'Update product stock availability',
  z.object({
    productId: z.string(),
    inStock: z.boolean()
  }),
  async (args) => {
    const result = await dataService.update(
      'mcp://products', 
      args.productId, 
      { inStock: args.inStock }
    );
    return { success: true, product: result };
  }
);

// Analytics tool
server.registerTool(
  'get_category_summary',
  'Get inventory summary by category',
  z.object({
    category: z.string().optional()
  }),
  async (args) => {
    const products = await dataService.queryResource('mcp://products', {
      filter: args.category ? { category: args.category } : undefined
    });
    
    return {
      totalProducts: products.length,
      inStock: products.filter(p => p.inStock).length,
      outOfStock: products.filter(p => !p.inStock).length,
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length
    };
  }
);
```

### 4. Connect Real Data Sources

Replace in-memory storage with your actual data:

```typescript
// Example: Connect to a database
class DatabaseDataService extends DataService {
  async queryResource(uri: string, query?: any) {
    const resourceType = uri.split('://')[1];
    
    switch (resourceType) {
      case 'products':
        return await this.db.products.findMany({
          where: query?.filter || {}
        });
      case 'orders':
        return await this.db.orders.findMany({
          include: { items: true }
        });
      default:
        throw new Error(`Unknown resource: ${resourceType}`);
    }
  }
}
```

## Project Structure

```
src/
├── core/           # Core MCP server functionality
├── services/       # Data service implementations  
├── examples/       # Example implementations
│   └── server.ts   # Complete working example
└── index.ts        # Main entry point
```

**Start here:** `src/examples/server.ts` contains a complete implementation showing all concepts in practice.

## Advanced Patterns

### Multi-Resource Operations
```typescript
server.registerTool(
  'process_order',
  'Process customer order and update inventory',
  z.object({
    customerId: z.string(),
    productIds: z.array(z.string())
  }),
  async (args) => {
    // Check inventory
    const products = await dataService.queryByIds('mcp://products', args.productIds);
    
    // Create order
    const order = await dataService.create('mcp://orders', {
      customerId: args.customerId,
      items: products,
      total: products.reduce((sum, p) => sum + p.price, 0)
    });
    
    // Update inventory
    for (const product of products) {
      await dataService.update('mcp://products', product.id, { 
        inStock: false 
      });
    }
    
    return { orderId: order.id, total: order.total };
  }
);
```

### Error Handling and Validation
```typescript
server.registerTool(
  'safe_user_operation',
  'Safely perform user operations with validation',
  schema,
  async (args) => {
    try {
      // Validate business rules
      if (args.email && !isValidEmail(args.email)) {
        throw new Error('Invalid email format');
      }
      
      const result = await dataService.performOperation(args);
      return { success: true, data: result };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: 'VALIDATION_ERROR'
      };
    }
  }
);
```

## Testing Your Server

```bash
# Run tests
npm test

# Test with a real AI assistant
npm start
# Connect Claude Desktop or other MCP-compatible client
```

## Deployment Considerations

- **Authentication**: Add API keys or OAuth for production use
- **Rate Limiting**: Implement request throttling for high-traffic scenarios  
- **Data Validation**: Always validate inputs from AI assistants
- **Logging**: Add comprehensive logging for debugging and monitoring
- **Error Handling**: Provide clear error messages that help AI assistants understand what went wrong

## Next Steps

1. **Examine the examples** - Understand the patterns by studying `src/examples/server.ts`
2. **Adapt the data models** - Replace sample data with your domain objects
3. **Add domain-specific tools** - Create operations that match your business logic
4. **Connect real data sources** - Integrate with databases, APIs, or file systems
5. **Test with AI assistants** - Verify functionality with Claude, ChatGPT, or other MCP clients

This template provides the scaffolding - your domain expertise and data make it valuable.