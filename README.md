# MCP Server Prototype

This is a simple MCP server based on the TypeScript SDK Quick Start guide.

## Features

### Tools
- `add`: Adds two numbers together
- `subtract`: Subtracts the second number from the first
- `multiply`: Multiplies two numbers
- `divide`: Divides the first number by the second (with division by zero handling)

### Resources
- `greeting`: Returns a personalized greeting (URI format: `greeting://{name}`)
- `time`: Returns the current server time (URI: `time://current`)

### Prompts
- `math-problem`: A prompt template for solving math problems

## Running the server

### Using stdio transport (CLI mode)

```bash
npm start
```

This will start the server using stdio transport, which is suitable for command-line tools and direct integrations.

### Using HTTP transport (Web mode)

```bash
npm run start:http
```

This will start an HTTP server on port 3000 with the following endpoints:
- `/mcp` - The MCP endpoint for client-server communication
- `/` - A simple HTML page with usage instructions

The HTTP server supports session management, allowing multiple clients to connect simultaneously.

## Testing with MCP Inspector

You can test this server using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

### Testing stdio transport

1. Clone the MCP Inspector repository:
   ```bash
   git clone https://github.com/modelcontextprotocol/inspector.git
   ```

2. Follow installation instructions in the Inspector's README

3. Run the Inspector with:
   ```bash
   ./bin/mcp-inspector stdio -- node /path/to/this/project/server.js
   ```

### Testing HTTP transport

1. Start the HTTP server:
   ```bash
   npm run start:http
   ```

2. Run the MCP Inspector against the HTTP endpoint:
   ```bash
   ./bin/mcp-inspector http --url http://localhost:3000/mcp
   ```

3. Open a web browser to see the server information:
   ```
   http://localhost:3000/
   ```

4. Use the Inspector interface to:
   - Call the math tools with different number inputs
   - Access the `greeting` resource with different name parameters
   - Check the `time` resource to see the current server time
   - Use the `math-problem` prompt template

## Example Usage

### Tools
- Call `add` with `a: 5, b: 3` → Returns `8`
- Call `divide` with `a: 10, b: 0` → Returns error for division by zero

### Resources
- Access `greeting://John` → Returns `Hello, John!`
- Access `time://current` → Returns the current time

### Prompts
- Use `math-problem` with `problem: "What is the square root of 16?"` → Creates a prompt for the LLM