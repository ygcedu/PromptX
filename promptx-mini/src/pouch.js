/**
 * 极简Pouch框架 - 模拟PromptX的PATEOAS CLI理念
 * 核心概念：状态驱动导航 + 锦囊命令 + 自发现接口
 */

export class MiniPouch {
  constructor(memory) {
    this.memory = memory
    this.currentState = 'initialized'
    this.stateHistory = []
    this.commands = new Map()
    this.initializeCommands()
  }

  // 初始化锦囊命令
  initializeCommands() {
    // 发现锦囊
    this.registerCommand('discover', {
      name: '发现',
      description: '发现可用的角色和工具',
      purpose: '帮助用户了解系统能力',
      execute: (args) => this.executeDiscover(args),
      nextStates: ['role-selection', 'tool-usage']
    })

    // 激活锦囊  
    this.registerCommand('activate', {
      name: '激活',
      description: '激活指定的角色或功能',
      purpose: '切换到专业模式',
      execute: (args) => this.executeActivate(args),
      nextStates: ['expert-mode', 'consultation']
    })

    // 咨询锦囊
    this.registerCommand('consult', {
      name: '咨询',
      description: '获取专业建议和指导',
      purpose: '提供专业知识服务',
      execute: (args) => this.executeConsult(args),
      nextStates: ['deep-analysis', 'tool-usage']
    })

    // 执行锦囊
    this.registerCommand('execute', {
      name: '执行',
      description: '执行具体的工具或操作',
      purpose: '完成实际任务',
      execute: (args) => this.executeAction(args),
      nextStates: ['result-analysis', 'next-action']
    })
  }

  // 处理用户输入（PATEOAS入口）
  processInput(input, context = {}) {
    // 更新状态历史
    this.stateHistory.push({
      state: this.currentState,
      input,
      timestamp: Date.now()
    })

    // 意图识别和命令路由
    const command = this.identifyCommand(input)
    
    if (command) {
      const result = command.execute(input)
      this.updateState(command, result)
      
      return {
        ...result,
        pateoas: this.generatePATEOAS(command, result)
      }
    }

    // 默认处理
    return {
      success: false,
      message: '未识别的命令',
      pateoas: this.generateDefaultPATEOAS()
    }
  }

  // 命令识别
  identifyCommand(input) {
    const lowerInput = input.toLowerCase()

    // 发现意图
    if (lowerInput.includes('发现') || lowerInput.includes('显示') || lowerInput.includes('状态')) {
      return this.commands.get('discover')
    }

    // 激活意图
    if (lowerInput.includes('激活') || lowerInput.includes('切换')) {
      return this.commands.get('activate')
    }

    // 咨询意图
    if (lowerInput.includes('如何') || lowerInput.includes('怎么') || lowerInput.includes('建议')) {
      return this.commands.get('consult')
    }

    // 执行意图
    if (lowerInput.includes('计算') || lowerInput.includes('分析') || lowerInput.includes('使用')) {
      return this.commands.get('execute')
    }

    return null
  }

  // 执行发现命令
  executeDiscover(input) {
    const discoveries = {
      roles: ['产品经理', '架构师', '内容专家'],
      tools: ['计算器', '文本分析器', '数据存储'],
      resources: ['思维模式', '执行流程', '知识体系'],
      capabilities: ['角色切换', '专业咨询', '工具集成', 'DPML解析']
    }

    return {
      success: true,
      command: 'discover',
      purpose: '展示系统的完整能力图谱',
      content: discoveries,
      message: '🔍 系统能力发现完成！您可以激活任何角色或使用任何工具。'
    }
  }

  // 执行激活命令
  executeActivate(input) {
    // 简化的激活逻辑
    const roleMatch = input.match(/(产品经理|架构师|内容专家)/i)
    
    if (roleMatch) {
      const roleName = roleMatch[1]
      return {
        success: true,
        command: 'activate',
        purpose: `激活${roleName}专业能力`,
        content: {
          activatedRole: roleName,
          capabilities: ['专业咨询', '知识检索', '方案建议'],
          mode: 'expert'
        },
        message: `✨ ${roleName}角色已激活！现在可以提供专业建议。`
      }
    }

    return {
      success: false,
      command: 'activate',
      message: '请指定要激活的角色：产品经理、架构师或内容专家'
    }
  }

  // 执行咨询命令
  executeConsult(input) {
    return {
      success: true,
      command: 'consult',
      purpose: '提供专业知识和建议',
      content: {
        query: input,
        approach: '结构化分析',
        methodology: '最佳实践',
        deliverable: '可执行建议'
      },
      message: '🎯 专业咨询服务已启动，正在分析您的问题...'
    }
  }

  // 执行操作命令
  executeAction(input) {
    return {
      success: true,
      command: 'execute',
      purpose: '执行具体任务',
      content: {
        action: input,
        status: 'processing',
        tools: ['自动选择最佳工具']
      },
      message: '🔧 任务执行中，正在调用相关工具...'
    }
  }

  // 生成PATEOAS导航
  generatePATEOAS(command, result) {
    const baseActions = [
      {
        name: '发现更多',
        command: 'discover',
        description: '探索其他可用功能'
      },
      {
        name: '获取帮助',
        command: 'help',
        description: '查看详细使用说明'
      }
    ]

    // 根据当前命令生成特定的下一步操作
    const specificActions = this.getNextActions(command, result)

    return {
      currentState: this.currentState,
      currentCommand: command.name,
      availableTransitions: command.nextStates,
      nextActions: [...specificActions, ...baseActions],
      stateHistory: this.stateHistory.slice(-3) // 最近3个状态
    }
  }

  // 获取特定的下一步操作
  getNextActions(command, result) {
    switch (command.name) {
      case '发现':
        return [
          {
            name: '激活角色',
            command: 'activate 产品经理',
            description: '切换到专业角色模式'
          },
          {
            name: '使用工具',
            command: 'execute 计算 1+1',
            description: '执行具体工具操作'
          }
        ]

      case '激活':
        return [
          {
            name: '专业咨询',
            command: 'consult 如何设计用户体验',
            description: '获取专业建议'
          },
          {
            name: '切换角色',
            command: 'activate 架构师',
            description: '切换到其他专业角色'
          }
        ]

      case '咨询':
        return [
          {
            name: '深入分析',
            command: 'consult 详细分析',
            description: '获取更深入的专业分析'
          },
          {
            name: '执行建议',
            command: 'execute 实施方案',
            description: '执行专业建议'
          }
        ]

      case '执行':
        return [
          {
            name: '查看结果',
            command: 'discover 执行结果',
            description: '查看执行结果和状态'
          },
          {
            name: '继续操作',
            command: 'execute 下一步',
            description: '执行后续操作'
          }
        ]

      default:
        return []
    }
  }

  // 生成默认PATEOAS
  generateDefaultPATEOAS() {
    return {
      currentState: this.currentState,
      availableCommands: Array.from(this.commands.keys()),
      suggestedActions: [
        {
          name: '开始探索',
          command: 'discover',
          description: '发现系统能力'
        },
        {
          name: '激活角色',
          command: 'activate 产品经理',
          description: '进入专业模式'
        }
      ]
    }
  }

  // 更新状态
  updateState(command, result) {
    if (result.success) {
      // 根据命令结果更新状态
      switch (command.name) {
        case '发现':
          this.currentState = 'discovered'
          break
        case '激活':
          this.currentState = 'expert-mode'
          break
        case '咨询':
          this.currentState = 'consulting'
          break
        case '执行':
          this.currentState = 'executing'
          break
      }
    }
  }

  // 注册新命令
  registerCommand(id, commandDef) {
    this.commands.set(id, commandDef)
    console.log(`🎒 注册锦囊命令: ${commandDef.name}`)
  }

  // 获取当前状态
  getCurrentState() {
    return {
      state: this.currentState,
      history: this.stateHistory,
      availableCommands: Array.from(this.commands.keys())
    }
  }
}