import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Add an addition tool
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a subtraction tool
server.tool("subtract",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a - b) }]
  })
);

// Add a multiplication tool
server.tool("multiply",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a * b) }]
  })
);

// Add a division tool
server.tool("divide",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    if (b === 0) {
      return {
        content: [{ type: "text", text: "Error: Division by zero" }],
        isError: true
      };
    }
    return {
      content: [{ type: "text", text: String(a / b) }]
    };
  }
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// Add a time resource
server.resource(
  "time",
  "time://current",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: `Current time: ${new Date().toISOString()}`
    }]
  })
);

// Add a prompt example
server.prompt(
  "math-problem",
  { problem: z.string() },
  ({ problem }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please solve this math problem: ${problem}`
      }
    }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
// Write to stderr instead of stdout to avoid interfering with JSON messages
console.error("MCP Server started. Use MCP Inspector to connect.");
await server.connect(transport);