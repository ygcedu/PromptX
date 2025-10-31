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

  // 动态创建新工具（类似PromptX的Luban功能）
  createTool(input) {
    // 解析创建工具的输入
    const match = input.match(/创建工具[:：]\s*(.+?)，(.+)/)
    if (!match) {
      throw new Error('工具创建格式错误。正确格式："创建工具：工具名，工具描述"')
    }

    const [, toolName, toolDescription] = match
    const toolId = toolName.toLowerCase().replace(/\s+/g, '-')

    // 检查工具是否已存在
    if (this.tools.has(toolId)) {
      throw new Error(`工具 "${toolName}" 已存在`)
    }

    // 基于描述生成工具逻辑
    const toolLogic = this.generateToolLogic(toolDescription)

    // 创建工具定义
    const toolData = {
      name: toolName,
      description: toolDescription,
      parameters: toolLogic.parameters,
      execute: toolLogic.execute,
      isCustom: true,
      createdAt: Date.now(),
      usageCount: 0
    }

    // 注册新工具
    this.registerTool(toolId, toolData)

    console.log(`🔧 成功创建工具: ${toolName} (${toolId})`)
    return { toolId, toolData }
  }

  // 基于描述生成工具逻辑
  generateToolLogic(description) {
    const lowerDesc = description.toLowerCase()

    // 根据描述关键词生成不同类型的工具
    if (lowerDesc.includes('随机') || lowerDesc.includes('抽奖') || lowerDesc.includes('选择')) {
      return {
        parameters: ['选项列表'],
        execute: (...options) => {
          if (options.length === 0) return { success: false, error: '请提供选项列表' }
          const randomIndex = Math.floor(Math.random() * options.length)
          return { success: true, result: options[randomIndex], selectedFrom: options }
        }
      }
    } else if (lowerDesc.includes('时间') || lowerDesc.includes('日期')) {
      return {
        parameters: ['格式'],
        execute: (format = 'default') => {
          const now = new Date()
          let result
          switch (format) {
            case 'date': result = now.toDateString(); break
            case 'time': result = now.toTimeString(); break
            case 'iso': result = now.toISOString(); break
            default: result = now.toLocaleString('zh-CN')
          }
          return { success: true, result, timestamp: now.getTime() }
        }
      }
    } else if (lowerDesc.includes('密码') || lowerDesc.includes('生成')) {
      return {
        parameters: ['长度'],
        execute: (length = 8) => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
          let result = ''
          for (let i = 0; i < parseInt(length); i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          return { success: true, result, length: result.length }
        }
      }
    } else if (lowerDesc.includes('编码') || lowerDesc.includes('base64')) {
      return {
        parameters: ['文本', '操作'],
        execute: (text, operation = 'encode') => {
          try {
            if (operation === 'encode') {
              const result = Buffer.from(text, 'utf8').toString('base64')
              return { success: true, result, operation: 'encode' }
            } else {
              const result = Buffer.from(text, 'base64').toString('utf8')
              return { success: true, result, operation: 'decode' }
            }
          } catch (error) {
            return { success: false, error: error.message }
          }
        }
      }
    } else {
      // 通用工具模板
      return {
        parameters: ['输入'],
        execute: (input) => {
          return {
            success: true,
            result: `处理结果: ${input}`,
            processed: true,
            tool: description
          }
        }
      }
    }
  }

  // 列出所有可用工具
  listTools() {
    return Array.from(this.tools.entries()).map(([id, tool]) => ({
      id,
      name: tool.name,
      description: tool.description,
      usageCount: tool.usageCount || 0,
      isCustom: tool.isCustom || false
    }))
  }
}
