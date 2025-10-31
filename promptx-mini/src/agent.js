/**
 * 极简AI代理 - 模拟PromptX的核心交互逻辑
 * 核心概念：自然语言理解 + 意图识别 + 智能响应
 */

import { Memory } from './memory.js'
import { RoleSystem } from './role.js'
import { ToolSystem } from './tool.js'

export class PromptXAgent {
  constructor() {
    this.memory = new Memory()
    this.roleSystem = new RoleSystem(this.memory)
    this.toolSystem = new ToolSystem(this.memory)
    this.conversationHistory = []

    console.log('🚀 PromptX Mini Agent 已启动!')
    this.showWelcome()
  }

  // 欢迎信息
  showWelcome() {
    console.log('\n' + '='.repeat(60))
    console.log('🎯 PromptX Mini - AI专业化演示系统')
    console.log('='.repeat(60))
    console.log('💡 可用命令:')
    console.log('  • "创建角色：数据分析师，专门分析数据" - 创建新角色')
    console.log('  • "激活产品经理" - 切换到产品经理角色')
    console.log('  • "激活架构师" - 切换到架构师角色') 
    console.log('  • "激活内容专家" - 切换到内容专家角色')
    console.log('  • "计算 2+3*4" - 使用计算器工具')
    console.log('  • "分析文本: 你好世界" - 使用文本分析工具')
    console.log('  • "显示状态" - 查看系统状态')
    console.log('  • "帮助" - 显示详细帮助')
    console.log('='.repeat(60) + '\n')
  }

  // 处理用户输入（核心交互逻辑）
  async processInput(input) {
    console.log(`\n👤 用户: ${input}`)

    // 记录对话历史
    this.conversationHistory.push({ role: 'user', content: input, timestamp: Date.now() })

    // 意图识别和处理
    const response = this.parseAndExecute(input)

    // 记录AI响应
    this.conversationHistory.push({ role: 'assistant', content: response, timestamp: Date.now() })

    console.log(`🤖 AI: ${response}\n`)
    return response
  }

  // 解析并执行用户意图
  parseAndExecute(input) {
    const lowerInput = input.toLowerCase()

    // 角色创建意图
    if (lowerInput.includes('创建角色')) {
      return this.handleRoleCreation(input)
    }

    // 角色激活意图
    if (lowerInput.includes('激活') || lowerInput.includes('切换')) {
      return this.handleRoleActivation(input)
    }

    // 工具使用意图
    if (lowerInput.includes('计算')) {
      return this.handleCalculation(input)
    }

    if (lowerInput.includes('分析文本') || lowerInput.includes('文本分析')) {
      return this.handleTextAnalysis(input)
    }

    // 系统状态查询
    if (lowerInput.includes('状态') || lowerInput.includes('status')) {
      return this.handleStatusQuery()
    }

    // 帮助信息
    if (lowerInput.includes('帮助') || lowerInput.includes('help')) {
      return this.handleHelp()
    }

    // 专业咨询（当有激活角色时）
    if (this.roleSystem.currentRole) {
      return this.handleExpertConsultation(input)
    }

    // 默认响应
    return this.handleDefault(input)
  }

  // 处理角色创建
  handleRoleCreation(input) {
    try {
      const result = this.roleSystem.createRole(input)
      return `🎆 成功创建新角色！\n` +
             `🎭 角色名称: ${result.roleData.name}\n` +
             `📝 角色描述: ${result.roleData.description}\n` +
             `📚 专业领域: ${result.roleData.knowledge.slice(0, 3).join(', ')}\n` +
             `💡 现在您可以说 "激活${result.roleData.name}" 来使用这个角色！`
    } catch (error) {
      return `❌ 角色创建失败: ${error.message}\n` +
             `💡 正确格式: "创建角色：数据分析师，专门分析数据和制作报表"`
    }
  }

  // 处理角色激活
  handleRoleActivation(input) {
    try {
      // 获取所有可用角色
      const roles = this.roleSystem.listRoles()
      
      // 尝试匹配角色名称
      let targetRole = null
      for (const role of roles) {
        if (input.includes(role.name)) {
          targetRole = role
          break
        }
      }
      
      // 如果没有直接匹配，尝试匹配内置角色的别名
      if (!targetRole) {
        if (input.includes('产品经理')) targetRole = roles.find(r => r.id === 'product-manager')
        else if (input.includes('架构师')) targetRole = roles.find(r => r.id === 'architect')
        else if (input.includes('内容专家') || input.includes('写作')) targetRole = roles.find(r => r.id === 'writer')
      }

      if (targetRole) {
        const result = this.roleSystem.activateRole(targetRole.id)
        return `✨ 已激活${result.role.name}角色！\n` +
               `🎯 专业领域: ${result.role.knowledge.slice(0, 3).join(', ')}\n` +
               `💡 我现在可以为您提供专业的${result.role.name}建议。请告诉我您需要什么帮助？`
      } else {
        return `❓ 未识别到具体角色。可用角色:\n` +
               roles.map(r => `  • ${r.name}: ${r.description}`).join('\n')
      }
    } catch (error) {
      return `❌ 角色激活失败: ${error.message}`
    }
  }

  // 处理计算请求
  handleCalculation(input) {
    const match = input.match(/计算\s*(.+)/)
    if (match) {
      const expression = match[1].trim()
      const result = this.toolSystem.executeTool('calculator', expression)

      if (result.success) {
        return `🧮 计算结果: ${expression} = ${result.result}`
      } else {
        return `❌ 计算错误: ${result.error}`
      }
    }
    return '❓ 请提供要计算的表达式，例如: "计算 2+3*4"'
  }

  // 处理文本分析
  handleTextAnalysis(input) {
    const match = input.match(/(?:分析文本|文本分析)[:：]\s*(.+)/)
    if (match) {
      const text = match[1].trim()
      const result = this.toolSystem.executeTool('text-analyzer', text)

      if (result.success) {
        const analysis = result.analysis
        return `📊 文本分析结果:\n` +
               `  • 字符数: ${analysis.characters}\n` +
               `  • 词数: ${analysis.words}\n` +
               `  • 句子数: ${analysis.sentences}\n` +
               `  • 平均每句词数: ${analysis.avgWordsPerSentence}\n` +
               `  • 预估阅读时间: ${analysis.readingTime}分钟`
      } else {
        return `❌ 分析错误: ${result.error}`
      }
    }
    return '❓ 请提供要分析的文本，例如: "分析文本: 你好世界"'
  }

  // 处理状态查询
  handleStatusQuery() {
    const memoryStatus = this.memory.getNetworkStatus()
    const currentRole = this.roleSystem.currentRole
    const tools = this.toolSystem.listTools()

    return `📊 系统状态报告:\n\n` +
           `🧠 记忆系统:\n` +
           `  • 概念节点: ${memoryStatus.totalNodes}个\n` +
           `  • 连接关系: ${memoryStatus.totalConnections}个\n` +
           `  • 热门概念: ${memoryStatus.mostAccessed.map(m => m.concept).join(', ')}\n\n` +
           `🎭 当前角色: ${currentRole ? currentRole.name : '未激活'}\n\n` +
           `🔧 可用工具: ${tools.length}个\n` +
           `  ${tools.map(t => `• ${t.name} (使用${t.usageCount}次)`).join('\n  ')}`
  }

  // 处理帮助请求
  handleHelp() {
    // 动态获取当前可用角色
    const roles = this.roleSystem.listRoles()
    const tools = this.toolSystem.listTools()
    const memoryStatus = this.memory.getNetworkStatus()
    
    let roleHelp = `🎭 角色系统:\n`
    roleHelp += `  • 创建角色：[角色名]，[描述] - 创建自定义角色\n`
    
    // 动态显示所有可用角色
    roles.forEach(role => {
      const status = role.isActive ? ' (当前激活)' : ''
      const type = role.isCustom ? ' [自定义]' : ' [内置]'
      roleHelp += `  • 激活${role.name} - ${role.description}${type}${status}\n`
    })
    
    let toolHelp = `\n🔧 工具系统:\n`
    tools.forEach(tool => {
      toolHelp += `  • ${tool.name} - ${tool.description} (使用${tool.usageCount}次)\n`
    })
    
    return `📚 PromptX Mini 使用指南:\n\n` +
           roleHelp +
           toolHelp +
           `\n🧠 记忆系统:\n` +
           `  • 概念节点: ${memoryStatus.totalNodes}个\n` +
           `  • 连接关系: ${memoryStatus.totalConnections}个\n` +
           `  • 自动记录所有交互和知识\n` +
           `  • 智能关联相关概念\n` +
           `  • 支持上下文检索\n\n` +
           `💡 提示: 激活角色后，可以直接咨询专业问题！`
  }

  // 处理专业咨询
  handleExpertConsultation(input) {
    const advice = this.roleSystem.getExpertAdvice(input)
    const relevantMemories = advice.relevantKnowledge

    let response = `🎯 ${advice.role}专业建议:\n\n${advice.suggestion}\n`

    if (relevantMemories.length > 0) {
      response += `\n📚 相关专业知识:\n`
      relevantMemories.forEach((memory, index) => {
        response += `  ${index + 1}. ${memory.concept} (相关度: ${memory.strength})\n`
      })
    }

    // 存储这次咨询到记忆中
    this.memory.remember(
      `${advice.role}:${input}`,
      `${advice.role}咨询: ${input} -> ${advice.suggestion}`,
      [this.roleSystem.currentRole.id, 'consultation', 'advice']
    )

    return response
  }

  // 默认处理
  handleDefault(input) {
    // 尝试从记忆中找到相关信息
    const memories = this.memory.recall(input, 2)

    if (memories.length > 0) {
      return `🧠 从记忆中找到相关信息:\n` +
             memories.map((m, i) => `  ${i + 1}. ${m.concept}: ${m.content.substring(0, 100)}...`).join('\n') +
             `\n\n💡 提示: 激活专业角色可获得更专业的建议！`
    }

    return `🤔 我理解您的问题，但建议您:\n` +
           `  1. 激活相关专业角色 (如: "激活产品经理")\n` +
           `  2. 使用具体的工具命令 (如: "计算 1+1")\n` +
           `  3. 输入 "帮助" 查看详细使用说明`
  }
}
