import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Create Express app
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

// Create the MCP server function
function createServer() {
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

  return server;
}

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        // Store the transport by session ID
        transports[newSessionId] = transport;
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = createServer();

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

// Add a simple HTML page for instructions
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>MCP Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>MCP Server Running</h1>
        <p>This server implements the Model Context Protocol and is accessible at <code>/mcp</code>.</p>
        
        <h2>Available Features</h2>
        
        <h3>Tools</h3>
        <ul>
          <li><code>add</code>: Adds two numbers</li>
          <li><code>subtract</code>: Subtracts the second number from the first</li>
          <li><code>multiply</code>: Multiplies two numbers</li>
          <li><code>divide</code>: Divides the first number by the second</li>
        </ul>
        
        <h3>Resources</h3>
        <ul>
          <li><code>greeting://{name}</code>: Returns a personalized greeting</li>
          <li><code>time://current</code>: Returns the current server time</li>
        </ul>
        
        <h3>Prompts</h3>
        <ul>
          <li><code>math-problem</code>: Prompt template for solving math problems</li>
        </ul>
        
        <h2>How to Connect</h2>
        <p>Use the MCP Inspector or an MCP client to connect to this server at: <code>http://localhost:3000/mcp</code></p>
      </body>
    </html>
  `);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Server listening on port ${PORT}`);
});