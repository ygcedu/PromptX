/**
 * PromptX Mini MCP Server - 简化版本
 *
 * 移除复杂的初始化检查，直接处理所有 MCP 请求
 */

import express from 'express'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { PromptXAgent } from './agent.js'
import { getToolList, executeTool, allTools } from './mcp/tools/index.js'

// 创建 Express 应用
const app = express()
const agent = new PromptXAgent()

// 创建 MCP 服务器实例（启动时就创建）
const mcpServer = new Server(
  { name: 'promptx-mini', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// 创建传输层（启动时就创建）
const transport = new StreamableHTTPServerTransport({})

// 注册工具列表处理器
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log('📋 Listing tools...')
  return { tools: getToolList() }
})

// 注册工具调用处理器
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  console.log(`🔧 Executing tool: ${name}`, args)
  return await executeTool(name, args, agent)
})

app.use(express.json())

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'promptx-mini-mcp',
    tools: allTools.length,
    timestamp: new Date().toISOString()
  })
})

// 根路径信息
app.get('/', (req, res) => {
  res.json({
    name: 'PromptX Mini MCP Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mcp: '/mcp'
    },
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description
    }))
  })
})

// MCP 端点处理 - 直接转发所有请求给传输层
app.all('/mcp', async (req, res) => {
  try {
    // GET 请求返回基本信息
    if (req.method === 'GET') {
      res.json({
        message: 'PromptX Mini MCP Server',
        protocol: 'Model Context Protocol',
        tools: allTools.length
      })
      return
    }

    // POST 请求直接转发给 MCP 传输层处理
    if (req.method === 'POST') {
      console.log('📨 MCP Request:', req.body?.method || 'unknown')
      await transport.handleRequest(req, res, req.body)
    }
  } catch (error) {
    console.error('❌ MCP Error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
})

// 启动服务器
async function startServer() {
  const port = process.env.PORT || 8080
  const host = '127.0.0.1'

  try {
    // 连接 MCP 服务器和传输层
    await mcpServer.connect(transport)
    console.log('✅ MCP Server connected to transport')

    // 启动 Express 服务器
    app.listen(port, host, () => {
      console.log(`🚀 PromptX Mini MCP Server running on http://${host}:${port}`)
      console.log(`📋 Health check: http://${host}:${port}/health`)
      console.log(`🔧 MCP endpoint: http://${host}:${port}/mcp`)
      console.log(`\n🎯 Available tools: ${allTools.length}`)

      allTools.forEach(tool => {
        console.log(`  • ${tool.name} - ${tool.description}`)
      })
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
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
