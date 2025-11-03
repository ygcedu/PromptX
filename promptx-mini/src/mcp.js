/**
 * PromptX Mini MCP Server - 纯 SDK 版本
 * 
 * 直接使用 @modelcontextprotocol/sdk 的服务器功能，无需 Express
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { PromptXAgent } from './agent.js'

// 创建 PromptX Agent 实例
const agent = new PromptXAgent()

// 创建 MCP 服务器
const server = new Server(
  { name: 'promptx-mini', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_role',
      description: '创建新的AI角色',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '角色名称，如：数据分析师' },
          description: { type: 'string', description: '角色描述，如：专门分析数据和制作报表' }
        },
        required: ['name', 'description']
      }
    },
    {
      name: 'create_tool',
      description: '创建新的自定义工具',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '工具名称，如：随机选择器' },
          description: { type: 'string', description: '工具描述，如：从多个选项中随机选择一个' }
        },
        required: ['name', 'description']
      }
    },
    {
      name: 'activate_role',
      description: '激活指定的AI角色',
      inputSchema: {
        type: 'object',
        properties: {
          role_name: { type: 'string', description: '角色名称，如：产品经理、架构师、内容专家' }
        },
        required: ['role_name']
      }
    },
    {
      name: 'calculate',
      description: '执行数学计算',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: '数学表达式，如：2+3*4' }
        },
        required: ['expression']
      }
    },
    {
      name: 'analyze_text',
      description: '分析文本的统计信息',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要分析的文本内容' }
        },
        required: ['text']
      }
    },
    {
      name: 'use_tool',
      description: '使用指定的工具',
      inputSchema: {
        type: 'object',
        properties: {
          tool_name: { type: 'string', description: '工具名称' },
          parameters: { type: 'string', description: '工具参数，多个参数用逗号分隔' }
        },
        required: ['tool_name', 'parameters']
      }
    },
    {
      name: 'get_status',
      description: '获取系统状态信息',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_help',
      description: '获取系统帮助信息',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'expert_consultation',
      description: '基于当前激活角色进行专业咨询',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '要咨询的专业问题' }
        },
        required: ['question']
      }
    },
    {
      name: 'memory_search',
      description: '从记忆系统中搜索相关信息',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          max_results: { type: 'number', description: '最大结果数量，默认为3' }
        },
        required: ['query']
      }
    }
  ]
}))

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  
  try {
    let result = ''
    
    switch (name) {
      case 'create_role':
        result = agent.handleRoleCreation(`创建角色：${args.name}，${args.description}`)
        break
        
      case 'create_tool':
        result = agent.handleToolCreation(`创建工具：${args.name}，${args.description}`)
        break
        
      case 'activate_role':
        result = agent.handleRoleActivation(`激活${args.role_name}`)
        break
        
      case 'calculate':
        result = agent.handleCalculation(`计算 ${args.expression}`)
        break
        
      case 'analyze_text':
        result = agent.handleTextAnalysis(`分析文本: ${args.text}`)
        break
        
      case 'use_tool':
        result = agent.handleGenericToolUsage(`使用${args.tool_name}: ${args.parameters}`)
        break
        
      case 'get_status':
        result = agent.handleStatusQuery()
        break
        
      case 'get_help':
        result = agent.handleHelp()
        break
        
      case 'expert_consultation':
        if (!agent.roleSystem.currentRole) {
          result = '❓ 请先激活一个专业角色，然后再进行咨询。可用角色：产品经理、架构师、内容专家'
        } else {
          result = agent.handleExpertConsultation(args.question)
        }
        break
        
      case 'memory_search':
        const maxResults = args.max_results || 3
        const memories = agent.memory.recall(args.query, maxResults)
        if (memories.length > 0) {
          result = `🧠 记忆搜索结果：\n` +
                  memories.map((m, i) => `  ${i + 1}. ${m.concept}: ${m.content.substring(0, 100)}... (相关度: ${m.strength})`).join('\n')
        } else {
          result = `🧠 未找到与 "${args.query}" 相关的记忆`
        }
        break
        
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
    
    return {
      content: [{ type: 'text', text: result }]
    }
    
  } catch (error) {
    return {
      content: [{ type: 'text', text: `❌ 错误: ${error.message}` }],
      isError: true
    }
  }
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
  console.log(`\n🎯 可用的 MCP 工具:`)
  console.log(`  • create_role - 创建新角色`)
  console.log(`  • create_tool - 创建新工具`)
  console.log(`  • activate_role - 激活角色`)
  console.log(`  • calculate - 数学计算`)
  console.log(`  • analyze_text - 文本分析`)
  console.log(`  • use_tool - 使用工具`)
  console.log(`  • get_status - 获取状态`)
  console.log(`  • get_help - 获取帮助`)
  console.log(`  • expert_consultation - 专业咨询`)
  console.log(`  • memory_search - 记忆搜索`)
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