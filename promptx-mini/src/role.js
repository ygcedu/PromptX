/**
 * 极简角色系统 - 模拟PromptX的角色专业化
 * 核心概念：角色定义 + 专业知识 + 行为模式
 */

export class RoleSystem {
  constructor(memory) {
    this.memory = memory
    this.currentRole = null
    this.roles = new Map()
    this.initializeBuiltinRoles()
  }

  // 初始化内置角色
  initializeBuiltinRoles() {
    this.defineRole('product-manager', {
      name: '产品经理',
      description: '专业的产品管理专家，擅长用户研究、需求分析和产品策略',
      knowledge: [
        '用户体验设计原则',
        '敏捷开发方法论',
        '数据驱动决策',
        '竞品分析框架',
        'MVP设计思路'
      ],
      behavior: {
        style: '结构化思考，用户导向',
        approach: '先理解用户需求，再提供解决方案',
        tools: ['用户调研', '数据分析', '原型设计']
      }
    })

    this.defineRole('architect', {
      name: '架构师',
      description: '资深技术架构专家，擅长系统设计和技术选型',
      knowledge: [
        '微服务架构模式',
        '分布式系统设计',
        '性能优化策略',
        '安全架构设计',
        '云原生技术栈'
      ],
      behavior: {
        style: '技术深度，全局视角',
        approach: '从技术可行性和扩展性角度分析问题',
        tools: ['架构图设计', '技术选型', '性能评估']
      }
    })

    this.defineRole('writer', {
      name: '内容专家',
      description: '专业的内容创作者，擅长各种文体写作和内容策略',
      knowledge: [
        '内容营销策略',
        'SEO优化技巧',
        '用户心理学',
        '品牌传播理论',
        '多媒体内容制作'
      ],
      behavior: {
        style: '创意思维，情感共鸣',
        approach: '从受众角度出发，创造有价值的内容',
        tools: ['内容规划', '文案写作', '视觉设计']
      }
    })
  }

  // 定义新角色（类似PromptX的Nuwa功能）
  defineRole(roleId, roleData) {
    this.roles.set(roleId, roleData)

    // 将角色知识存储到记忆系统
    roleData.knowledge.forEach(knowledge => {
      this.memory.remember(
        `${roleId}:${knowledge}`,
        `${roleData.name}的专业知识：${knowledge}`,
        [roleId, 'knowledge', knowledge.split(' ')[0]]
      )
    })

    console.log(`🎭 角色定义: ${roleData.name} (${roleId})`)
  }

  // 激活角色（类似PromptX的Action）
  activateRole(roleId) {
    const role = this.roles.get(roleId)
    if (!role) {
      throw new Error(`角色 "${roleId}" 不存在`)
    }

    this.currentRole = { id: roleId, ...role }

    // 激活相关记忆
    const memories = this.memory.recall(roleId, 5)

    console.log(`✨ 角色激活: ${role.name}`)
    console.log(`📚 专业领域: ${role.knowledge.join(', ')}`)
    console.log(`🎯 工作方式: ${role.behavior.approach}`)

    return {
      role: this.currentRole,
      activatedMemories: memories
    }
  }

  // 获取当前角色的专业建议
  getExpertAdvice(query) {
    if (!this.currentRole) {
      return "请先激活一个专业角色，例如：activateRole('product-manager')"
    }

    // 从角色相关记忆中检索
    const relevantMemories = this.memory.recall(`${this.currentRole.id}:${query}`, 3)

    return {
      role: this.currentRole.id,
      approach: this.currentRole.behavior.approach,
      relevantKnowledge: relevantMemories,
      suggestion: `作为${this.currentRole.name}，我建议从${this.currentRole.behavior.style}的角度来分析这个问题...`
    }
  }

  // 动态创建新角色（类似PromptX的Nuwa功能）
  createRole(input) {
    // 解析创建角色的输入
    const match = input.match(/创建角色[:：]\s*(.+?)，(.+)/)
    if (!match) {
      throw new Error('角色创建格式错误。正确格式："创建角色：角色名，角色描述"')
    }

    const [, roleName, roleDescription] = match
    const roleId = roleName.toLowerCase().replace(/\s+/g, '-')

    // 检查角色是否已存在
    if (this.roles.has(roleId)) {
      throw new Error(`角色 "${roleName}" 已存在`)
    }

    // 基于描述生成基础知识领域
    const knowledge = this.generateKnowledgeFromDescription(roleDescription)

    // 创建角色定义
    const roleData = {
      name: roleName,
      description: roleDescription,
      knowledge,
      behavior: {
        style: '专业深入，实用导向',
        approach: `作为${roleName}，从专业角度分析和解决问题`,
        tools: ['专业分析', '实践建议', '经验分享']
      },
      isCustom: true,
      createdAt: Date.now()
    }

    // 定义新角色
    this.defineRole(roleId, roleData)

    console.log(`🎭 成功创建角色: ${roleName} (${roleId})`)
    return { roleId, roleData }
  }

  // 从描述中生成知识领域
  generateKnowledgeFromDescription(description) {
    const keywords = description.split(/[，。、\s]+/)
      .filter(word => word.length > 1)
      .slice(0, 5)
    
    return keywords.map(keyword => `${keyword}相关知识和技能`)
  }

  // 列出所有可用角色
  listRoles() {
    return Array.from(this.roles.entries()).map(([id, role]) => ({
      id,
      name: role.name,
      description: role.description,
      isActive: this.currentRole?.id === id,
      isCustom: role.isCustom || false
    }))
  }
}
