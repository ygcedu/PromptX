/**
 * 极简工具系统 - 模拟PromptX的ToolX框架
 * 核心概念：工具注册 + 动态调用 + 结果处理
 */

export class ToolSystem {
  constructor(memory) {
    this.memory = memory
    this.tools = new Map()
    this.initializeBuiltinTools()
  }

  // 初始化内置工具
  initializeBuiltinTools() {
    // 计算器工具
    this.registerTool('calculator', {
      name: '计算器',
      description: '执行数学计算',
      parameters: ['expression'],
      execute: (expression) => {
        try {
          // 简单的数学表达式计算（生产环境需要更安全的实现）
          const result = Function(`"use strict"; return (${expression})`)()
          return { success: true, result, expression }
        } catch (error) {
          return { success: false, error: error.message }
        }
      }
    })

    // 文本分析工具
    this.registerTool('text-analyzer', {
      name: '文本分析器',
      description: '分析文本的基本统计信息',
      parameters: ['text'],
      execute: (text) => {
        const words = text.split(/\s+/).filter(word => word.length > 0)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
        const chars = text.length

        return {
          success: true,
          analysis: {
            characters: chars,
            words: words.length,
            sentences: sentences.length,
            avgWordsPerSentence: Math.round(words.length / sentences.length * 10) / 10,
            readingTime: Math.ceil(words.length / 200) // 假设每分钟200词
          }
        }
      }
    })

    // 数据存储工具
    this.registerTool('data-store', {
      name: '数据存储',
      description: '存储和检索键值对数据',
      parameters: ['action', 'key', 'value'],
      execute: (action, key, value) => {
        if (action === 'set') {
          this.memory.remember(`data:${key}`, value, ['data', 'storage'])
          return { success: true, action: 'stored', key, value }
        } else if (action === 'get') {
          const memories = this.memory.recall(`data:${key}`, 1)
          const result = memories.length > 0 ? memories[0].content : null
          return { success: true, action: 'retrieved', key, value: result }
        } else {
          return { success: false, error: 'Invalid action. Use "set" or "get"' }
        }
      }
    })
  }

  // 注册新工具（类似PromptX的Luban功能）
  registerTool(toolId, toolConfig) {
    this.tools.set(toolId, {
      ...toolConfig,
      id: toolId,
      createdAt: Date.now(),
      usageCount: 0
    })

    // 将工具信息存储到记忆系统
    this.memory.remember(
      `tool:${toolId}`,
      `工具：${toolConfig.name} - ${toolConfig.description}`,
      ['tool', toolId, ...toolConfig.parameters]
    )

    console.log(`🔧 工具注册: ${toolConfig.name} (${toolId})`)
  }

  // 执行工具
  executeTool(toolId, ...args) {
    const tool = this.tools.get(toolId)
    if (!tool) {
      throw new Error(`工具 "${toolId}" 不存在`)
    }

    console.log(`⚡ 执行工具: ${tool.name}`)
    console.log(`📥 输入参数: ${args.join(', ')}`)

    try {
      tool.usageCount++
      const result = tool.execute(...args)

      console.log(`📤 执行结果: ${result.success ? '成功' : '失败'}`)

      return result
    } catch (error) {
      console.log(`❌ 执行错误: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  // 智能工具推荐
  recommendTools(query) {
    const recommendations = []

    for (const [toolId, tool] of this.tools) {
      const relevance = this.calculateRelevance(query, tool)
      if (relevance > 0.3) {
        recommendations.push({
          toolId,
          name: tool.name,
          description: tool.description,
          relevance: Math.round(relevance * 100) / 100,
          parameters: tool.parameters
        })
      }
    }

    return recommendations.sort((a, b) => b.relevance - a.relevance)
  }

  // 计算工具与查询的相关性
  calculateRelevance(query, tool) {
    const queryWords = query.toLowerCase().split(/\s+/)
    const toolText = `${tool.name} ${tool.description}`.toLowerCase()

    let matches = 0
    queryWords.forEach(word => {
      if (toolText.includes(word)) matches++
    })

    return matches / queryWords.length
  }

  // 列出所有工具
  listTools() {
    return Array.from(this.tools.entries()).map(([id, tool]) => ({
      id,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      usageCount: tool.usageCount
    }))
  }
}
