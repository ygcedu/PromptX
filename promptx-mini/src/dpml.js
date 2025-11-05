/**
 * 极简DPML解析器 - 模拟PromptX的DPML语言
 * 核心概念：@引用语法 + 语义占位符 + 动态内容组合
 */

export class MiniDPML {
  constructor(memory) {
    this.memory = memory
    this.resources = new Map()
    this.initializeResources()
  }

  // 初始化基础资源
  initializeResources() {
    // 思维模式资源
    this.resources.set('thought://creative-thinking', {
      type: 'thought',
      content: '发散思维，多角度思考，鼓励创新想法'
    })
    
    this.resources.set('thought://analytical-thinking', {
      type: 'thought', 
      content: '逻辑分析，数据驱动，系统性思考'
    })

    // 执行流程资源
    this.resources.set('execution://problem-solving', {
      type: 'execution',
      content: '1.理解问题 2.分析原因 3.制定方案 4.执行验证'
    })

    this.resources.set('execution://user-research', {
      type: 'execution',
      content: '1.定义目标 2.设计调研 3.收集数据 4.分析洞察'
    })

    // 知识体系资源
    this.resources.set('knowledge://product-management', {
      type: 'knowledge',
      content: '用户体验设计、敏捷开发、数据分析、竞品研究'
    })

    this.resources.set('knowledge://system-architecture', {
      type: 'knowledge', 
      content: '微服务架构、分布式系统、性能优化、安全设计'
    })
  }

  // 解析DPML内容（核心功能）
  parseDPML(content) {
    // 查找所有@引用
    const references = this.extractReferences(content)
    
    // 替换@引用为实际内容
    let processedContent = content
    for (const ref of references) {
      const resource = this.resources.get(ref.fullRef)
      if (resource) {
        const replacement = this.renderResource(resource, ref.protocol)
        processedContent = processedContent.replace(ref.fullRef, replacement)
      } else {
        // 引用不存在时的降级处理
        processedContent = processedContent.replace(ref.fullRef, `[${ref.resource}]`)
      }
    }

    return {
      originalContent: content,
      processedContent,
      references,
      hasReferences: references.length > 0
    }
  }

  // 提取@引用
  extractReferences(content) {
    const refRegex = /@([a-zA-Z]+):\/\/([a-zA-Z0-9-_]+)/g
    const references = []
    let match

    while ((match = refRegex.exec(content)) !== null) {
      references.push({
        fullRef: match[0],
        protocol: match[1],
        resource: match[2]
      })
    }

    return references
  }

  // 渲染资源内容
  renderResource(resource, protocol) {
    const icons = {
      thought: '💭',
      execution: '⚖️', 
      knowledge: '📚'
    }

    const icon = icons[protocol] || '📎'
    return `\n${icon} ${resource.content}\n`
  }

  // 创建DPML角色模板
  createRoleTemplate(roleName, personality, principles, knowledge) {
    return `<personality>
${personality}
@thought://creative-thinking
@thought://analytical-thinking
</personality>

<principle>
${principles}
@execution://problem-solving
</principle>

<knowledge>
${knowledge}
@knowledge://${roleName.toLowerCase().replace(/\s+/g, '-')}
</knowledge>`
  }

  // 注册新资源
  registerResource(protocol, name, content) {
    const resourceKey = `${protocol}://${name}`
    this.resources.set(resourceKey, {
      type: protocol,
      content,
      isCustom: true,
      createdAt: Date.now()
    })

    // 存储到记忆系统
    this.memory.remember(
      `resource:${resourceKey}`,
      content,
      [protocol, name, 'resource']
    )

    console.log(`📎 注册DPML资源: ${resourceKey}`)
    return resourceKey
  }

  // 列出所有资源
  listResources() {
    return Array.from(this.resources.entries()).map(([key, resource]) => ({
      key,
      type: resource.type,
      content: resource.content.substring(0, 50) + '...',
      isCustom: resource.isCustom || false
    }))
  }
}