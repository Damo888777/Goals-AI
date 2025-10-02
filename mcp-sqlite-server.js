#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const Database = require('better-sqlite3');
const path = require('path');

class SQLiteServer {
  constructor() {
    this.server = new Server(
      {
        name: 'sqlite-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'read_query',
          description: 'Execute SELECT queries to read data from the database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The SELECT SQL query to execute',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'write_query',
          description: 'Execute INSERT, UPDATE, or DELETE queries',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The SQL modification query',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'create_table',
          description: 'Create new tables in the database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'CREATE TABLE SQL statement',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_tables',
          description: 'Get a list of all tables in the database',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'describe-table',
          description: 'View schema information for a specific table',
          inputSchema: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: 'Name of table to describe',
              },
            },
            required: ['table_name'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const dbPath = process.argv[2];
        if (!dbPath) {
          throw new Error('Database path not provided');
        }

        const db = new Database(dbPath, { readonly: false });

        switch (name) {
          case 'read_query': {
            const { query } = args;
            const stmt = db.prepare(query);
            const results = stmt.all();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'write_query': {
            const { query } = args;
            const stmt = db.prepare(query);
            const result = stmt.run();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    affected_rows: result.changes,
                  }, null, 2),
                },
              ],
            };
          }

          case 'create_table': {
            const { query } = args;
            const stmt = db.prepare(query);
            const result = stmt.run();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'Table created successfully',
                    affected_rows: result.changes,
                  }, null, 2),
                },
              ],
            };
          }

          case 'list_tables': {
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tables.map(t => t.name), null, 2),
                },
              ],
            };
          }

          case 'describe-table': {
            const { table_name } = args;
            const schema = db.prepare(`PRAGMA table_info(${table_name})`).all();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(schema, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SQLite MCP server running on stdio');
  }
}

const server = new SQLiteServer();
server.run().catch(console.error);
