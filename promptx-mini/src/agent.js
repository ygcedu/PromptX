/**
 * 极简AI代理 - 模拟PromptX的核心交互逻辑
 * 核心概念：自然语言理解 + 意图识别 + 智能响应
 * 新增：DPML语义解析 + Pouch状态导航
 */

import { Memory } from './memory.js'
import { RoleSystem } from './role.js'
import { ToolSystem } from './tool.js'
import { MiniDPML } from './dpml.js'
import { MiniPouch } from './pouch.js'

export class PromptXAgent {
  constructor() {
    this.memory = new Memory()
    this.roleSystem = new RoleSystem(this.memory)
    this.toolSystem = new ToolSystem(this.memory)
    this.dpml = new MiniDPML(this.memory)
    this.pouch = new MiniPouch(this.memory)
    this.conversationHistory = []

    console.log('🚀 PromptX Mini Agent 已启动!')
    console.log('✨ 新增功能: DPML语义解析 + Pouch状态导航')
    this.showWelcome()
  }

  // 欢迎信息
  showWelcome() {
    console.log('\n' + '='.repeat(60))
    console.log('🎯 PromptX Mini - AI专业化演示系统 (增强版)')
    console.log('='.repeat(60))
    console.log('💡 可用命令:')
    console.log('  🎭 角色系统:')
    console.log('    • "创建角色：数据分析师，专门分析数据" - 创建新角色')
    console.log('    • "激活产品经理" - 切换到产品经理角色')
    console.log('  🔧 工具系统:')
    console.log('    • "创建工具：随机选择器，随机选择一个选项" - 创建新工具')
    console.log('    • "计算 2+3*4" - 使用计算器工具')
    console.log('  📝 DPML语言:')
    console.log('    • "解析: @thought://creative-thinking" - 解析DPML引用')
    console.log('    • "创建资源: thought://my-thinking" - 创建DPML资源')
    console.log('  🎒 Pouch导航:')
    console.log('    • "发现" - 发现系统能力')
    console.log('    • "显示状态" - 查看系统状态')
    console.log('    • "帮助" - 显示详细帮助')
    console.log('='.repeat(60) + '\n')
  }

  // 处理用户输入（核心交互逻辑）
  async processInput(input) {
    console.log(`\n👤 用户: ${input}`)

    // 记录对话历史
    this.conversationHistory.push({ role: 'user', content: input, timestamp: Date.now() })

    // 首先尝试DPML解析
    const dpmlResult = this.dpml.parseDPML(input)
    if (dpmlResult.hasReferences) {
      console.log('📝 检测到DPML引用，正在解析...')
      input = dpmlResult.processedContent
    }

    // 然后通过Pouch进行状态导航
    const pouchResult = this.pouch.processInput(input)
    
    let response
    if (pouchResult.success) {
      response = this.handlePouchCommand(pouchResult)
    } else {
      // 回退到传统解析
      response = this.parseAndExecute(input)
    }

    // 记录AI响应
    this.conversationHistory.push({ role: 'assistant', content: response, timestamp: Date.now() })

    console.log(`🤖 AI: ${response}`)
    
    // 显示PATEOAS导航
    if (pouchResult.pateoas) {
      this.showPATEOAS(pouchResult.pateoas)
    }
    
    console.log()
    return response
  }

  // 解析并执行用户意图
  parseAndExecute(input) {
    const lowerInput = input.toLowerCase()

    // 角色创建意图
    if (lowerInput.includes('创建角色')) {
      return this.handleRoleCreation(input)
    }

    // 工具创建意图
    if (lowerInput.includes('创建工具')) {
      return this.handleToolCreation(input)
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

    // 通用工具使用意图
    if (lowerInput.includes('使用')) {
      return this.handleGenericToolUsage(input)
    }

    // DPML语言意图
    if (lowerInput.includes('解析') && lowerInput.includes('@')) {
      return this.handleDPMLParsing(input)
    }

    if (lowerInput.includes('创建资源')) {
      return this.handleResourceCreation(input)
    }

    // Pouch导航意图
    if (lowerInput.includes('发现') || lowerInput.includes('discover')) {
      return this.handleDiscovery()
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

  // 处理Pouch命令结果
  handlePouchCommand(pouchResult) {
    const { command, purpose, content, message } = pouchResult
    
    let response = `🎒 ${command} 锦囊已启动\n`
    response += `🎯 目的: ${purpose}\n`
    response += `📋 ${message}\n`
    
    if (content && typeof content === 'object') {
      response += `\n📊 详细信息:\n`
      Object.entries(content).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          response += `  • ${key}: ${value.join(', ')}\n`
        } else {
          response += `  • ${key}: ${value}\n`
        }
      })
    }
    
    return response
  }

  // 显示PATEOAS导航
  showPATEOAS(pateoas) {
    console.log('\n🧭 PATEOAS 导航:')
    console.log(`📍 当前状态: ${pateoas.currentState}`)
    
    if (pateoas.nextActions && pateoas.nextActions.length > 0) {
      console.log('🔗 建议的下一步操作:')
      pateoas.nextActions.slice(0, 3).forEach((action, index) => {
        console.log(`  ${index + 1}. ${action.name}: "${action.command}"`)
        console.log(`     ${action.description}`)
      })
    }
  }

  // 处理DPML解析
  handleDPMLParsing(input) {
    const match = input.match(/解析[:：]\s*(.+)/)
    if (match) {
      const dpmlContent = match[1]
      const result = this.dpml.parseDPML(dpmlContent)
      
      return `📝 DPML解析结果:\n` +
             `🔤 原始内容: ${result.originalContent}\n` +
             `✨ 处理后内容: ${result.processedContent}\n` +
             `🔗 引用数量: ${result.references.length}个\n` +
             result.references.map(ref => `  • ${ref.fullRef} (${ref.protocol})`).join('\n')
    }
    return '❓ 请提供要解析的DPML内容，例如: "解析: @thought://creative-thinking"'
  }

  // 处理资源创建
  handleResourceCreation(input) {
    const match = input.match(/创建资源[:：]\s*(\w+):\/\/(\w+)\s*(.+)/)
    if (match) {
      const [, protocol, name, content] = match
      const resourceKey = this.dpml.registerResource(protocol, name, content)
      
      return `🎆 成功创建DPML资源！\n` +
             `🔗 资源标识: ${resourceKey}\n` +
             `📝 资源内容: ${content}\n` +
             `💡 现在可以使用 @${protocol}://${name} 来引用这个资源！`
    }
    return '❓ 请使用正确格式: "创建资源: thought://my-thinking 这是我的思维模式"'
  }

  // 处理发现命令
  handleDiscovery() {
    const roles = this.roleSystem.listRoles()
    const tools = this.toolSystem.listTools()
    const resources = this.dpml.listResources()
    const pouchState = this.pouch.getCurrentState()
    
    return `🔍 系统能力全景图:\n\n` +
           `🎭 可用角色 (${roles.length}个):\n` +
           roles.map(r => `  • ${r.name}: ${r.description}`).join('\n') +
           `\n\n🔧 可用工具 (${tools.length}个):\n` +
           tools.map(t => `  • ${t.name}: ${t.description}`).join('\n') +
           `\n\n📝 DPML资源 (${resources.length}个):\n` +
           resources.map(r => `  • ${r.key}: ${r.content}`).join('\n') +
           `\n\n🎒 Pouch状态: ${pouchState.state}\n` +
           `📊 可用命令: ${pouchState.availableCommands.join(', ')}`
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

  // 处理工具创建
  handleToolCreation(input) {
    try {
      const result = this.toolSystem.createTool(input)
      return `🎆 成功创建新工具！\n` +
             `🔧 工具名称: ${result.toolData.name}\n` +
             `📝 工具描述: ${result.toolData.description}\n` +
             `📊 参数列表: ${result.toolData.parameters.join(', ')}\n` +
             `💡 现在您可以使用这个工具了！`
    } catch (error) {
      return `❌ 工具创建失败: ${error.message}\n` +
             `💡 正确格式: "创建工具：随机选择器，从多个选项中随机选择一个"`
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

  // 处理通用工具使用
  handleGenericToolUsage(input) {
    const match = input.match(/使用(.+?)[:：]\s*(.+)/)
    if (match) {
      const [, toolName, params] = match
      const trimmedToolName = toolName.trim()

      // 查找匹配的工具
      const tools = this.toolSystem.listTools()
      const targetTool = tools.find(tool =>
        tool.name.includes(trimmedToolName) || trimmedToolName.includes(tool.name)
      )

      if (targetTool) {
        // 解析参数
        const paramList = params.split(/[,，、\s]+/).filter(item => item.trim())
        const result = this.toolSystem.executeTool(targetTool.id, ...paramList)

        if (result.success) {
          return `🔧 ${targetTool.name}执行结果: ${result.result}`
        } else {
          return `❌ 工具执行失败: ${result.error}`
        }
      } else {
        const availableTools = tools.map(t => t.name).join(', ')
        return `❓ 未找到工具 "${trimmedToolName}"。可用工具: ${availableTools}`
      }
    }
    return '❓ 请使用正确格式: "使用[工具名]: [参数]"'
  }

  // 处理状态查询
  handleStatusQuery() {
    const memoryStatus = this.memory.getNetworkStatus()
    const currentRole = this.roleSystem.currentRole
    const tools = this.toolSystem.listTools()
    const resources = this.dpml.listResources()
    const pouchState = this.pouch.getCurrentState()

    return `📊 系统状态报告:\n\n` +
           `🧠 记忆系统:\n` +
           `  • 概念节点: ${memoryStatus.totalNodes}个\n` +
           `  • 连接关系: ${memoryStatus.totalConnections}个\n` +
           `  • 热门概念: ${memoryStatus.mostAccessed.map(m => m.concept).join(', ')}\n\n` +
           `🎭 当前角色: ${currentRole ? currentRole.name : '未激活'}\n\n` +
           `🔧 可用工具: ${tools.length}个\n` +
           `  ${tools.map(t => `• ${t.name} (使用${t.usageCount}次)`).join('\n  ')}\n\n` +
           `📝 DPML资源: ${resources.length}个\n` +
           `🎒 Pouch状态: ${pouchState.state}`
  }

  // 处理帮助请求
  handleHelp() {
    // 动态获取当前可用角色
    const roles = this.roleSystem.listRoles()
    const tools = this.toolSystem.listTools()
    const resources = this.dpml.listResources()
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
    toolHelp += `  • 创建工具：[工具名]，[描述] - 创建自定义工具\n`
    tools.forEach(tool => {
      const type = tool.isCustom ? ' [自定义]' : ' [内置]'
      toolHelp += `  • ${tool.name} - ${tool.description}${type} (使用${tool.usageCount}次)\n`
    })

    let dpmlHelp = `\n📝 DPML语言:\n`
    dpmlHelp += `  • 解析: @protocol://resource - 解析DPML引用\n`
    dpmlHelp += `  • 创建资源: protocol://name content - 创建新资源\n`
    resources.forEach(resource => {
      const type = resource.isCustom ? ' [自定义]' : ' [内置]'
      dpmlHelp += `  • ${resource.key}${type}\n`
    })

    return `📚 PromptX Mini 使用指南 (增强版):\n\n` +
           roleHelp +
           toolHelp +
           dpmlHelp +
           `\n🎒 Pouch导航:\n` +
           `  • 发现 - 发现系统能力\n` +
           `  • 状态 - 查看系统状态\n` +
           `  • 自动PATEOAS导航提示\n` +
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
           `  3. 尝试DPML语法 (如: "解析: @thought://creative-thinking")\n` +
           `  4. 使用Pouch导航 (如: "发现")\n` +
           `  5. 输入 "帮助" 查看详细使用说明`
  }
}