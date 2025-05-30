# MCP Template - Build Your Own AI Server

> **Simple explanation**: This template helps you create a server that AI assistants can talk to and get data from. Think of it like building a bridge between AI and your data!

## What is this?

Imagine you have some data (like a list of users, products, or files) and you want an AI assistant to be able to:
- See what data you have
- Ask questions about your data  
- Create, update, or delete information

This template makes that super easy! It's like giving your AI a special phone number to call your data.

## What You'll Need

- Basic knowledge of JavaScript/TypeScript
- Node.js installed on your computer
- Your favorite code editor

## Quick Start (5 minutes!)

### 1. Get the code
```bash
# Download this template
git clone https://github.com/rhit-bhuwalk/MCP_TEMPLATE.git
cd MCP_TEMPLATE

# Install everything you need
npm install
```

### 2. See it work
```bash
# Build and run the example
npm start
```

Congrats! You now have a working AI server with sample user data.

### 3. Try it out
The server comes with sample data about users. An AI can now:
- See the list of users
- Find specific users
- Add new users
- Update user information
- Search through users

## How It Works (The Simple Version)

Think of this template like a restaurant:

1. **Your Data** = The kitchen (where the food/data is stored)
2. **Resources** = The menu (what data is available)
3. **Tools** = The waiters (what actions the AI can do)
4. **AI Assistant** = The customer (who orders/requests data)

### The Basic Flow:
1. AI asks: "What data do you have?" 
2. Your server responds: "I have users, products, etc."
3. AI asks: "Show me all users"
4. Your server responds: "Here are the users..."

## Making It Your Own

### Step 1: Replace the Example Data

The template comes with user data. Let's say you want to store books instead:

1. **Create your data structure** (what a book looks like):
```typescript
// A book has these properties
interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  pages: number;
}
```

2. **Tell the server about books**:
```typescript
// Register books as a resource
dataService.registerResource('Books', 'A collection of books');
```

3. **Add some sample books**:
```typescript
const sampleBooks = [
  { id: '1', title: 'Harry Potter', author: 'J.K. Rowling', year: 1997, pages: 309 },
  { id: '2', title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, pages: 310 }
];
dataService.seedData('mcp://books', sampleBooks);
```

### Step 2: Add Custom Actions

Want the AI to do something special? Add a custom tool:

```typescript
// Let AI find books by author
server.registerTool(
  'find_books_by_author',
  'Find all books by a specific author',
  z.object({
    authorName: z.string()
  }),
  async (args) => {
    const books = await dataService.queryResource('mcp://books', {
      filter: { author: args.authorName }
    });
    return { books, count: books.length };
  }
);
```

Now an AI can ask: "Find all books by J.K. Rowling"

## File Structure (Don't Worry, It's Simple!)
