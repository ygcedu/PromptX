/**
 * PromptX Mini MCP Server - 模块化版本
 * 
 * 使用独立的工具文件，简化主服务器逻辑
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { PromptXAgent } from './agent.js'
import { getToolList, executeTool, allTools } from './mcp/tools/index.js'

// 创建 PromptX Agent 实例
const agent = new PromptXAgent()

// 创建 MCP 服务器
const server = new Server(
  { name: 'promptx-mini', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolList()
}))

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  return await executeTool(name, args, agent)
})

// 启动服务器
async function startServer() {
  const port = process.env.PORT || 8080
  
  // 创建 HTTP 传输层
  const transport = new StreamableHTTPServerTransport({
    port: port,
    host: '127.0.0.1'
  })
  
  // 连接服务器和传输层
  await server.connect(transport)
  
  console.log(`🚀 PromptX Mini MCP Server running on http://127.0.0.1:${port}`)
  console.log(`\n🎯 已注册 ${allTools.length} 个 MCP 工具:`)
  
  allTools.forEach(tool => {
    console.log(`  • ${tool.name} - ${tool.description}`)
  })
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...')
  process.exit(0)
})

// 启动服务器
startServer().catch(console.error)