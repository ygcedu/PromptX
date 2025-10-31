/**
 * 极简记忆系统 - 模拟PromptX的认知网络
 * 核心概念：概念节点 + 连接关系 + 激活传播
 */

export class Memory {
  constructor() {
    this.nodes = new Map()      // 概念节点
    this.connections = new Map() // 连接关系
    this.activations = new Map() // 激活强度
  }

  // 存储记忆（类似PromptX的Remember）
  remember(concept, content, relatedConcepts = []) {
    // 创建或更新概念节点
    this.nodes.set(concept, {
      content,
      timestamp: Date.now(),
      accessCount: 0
    })

    // 建立连接关系
    if (!this.connections.has(concept)) {
      this.connections.set(concept, new Set())
    }
    
    relatedConcepts.forEach(related => {
      this.connections.get(concept).add(related)
      // 双向连接
      if (!this.connections.has(related)) {
        this.connections.set(related, new Set())
      }
      this.connections.get(related).add(concept)
    })

    console.log(`💾 记忆存储: ${concept} -> ${content.substring(0, 50)}...`)
  }

  // 回忆记忆（类似PromptX的Recall）
  recall(query, maxResults = 3) {
    const results = []
    const activated = new Map()

    // 直接匹配
    for (const [concept, data] of this.nodes) {
      if (concept.toLowerCase().includes(query.toLowerCase())) {
        activated.set(concept, 1.0)
      }
    }

    // 激活传播
    for (const [concept, strength] of activated) {
      if (this.connections.has(concept)) {
        for (const connected of this.connections.get(concept)) {
          const currentStrength = activated.get(connected) || 0
          activated.set(connected, Math.max(currentStrength, strength * 0.7))
        }
      }
    }

    // 排序并返回结果
    const sorted = Array.from(activated.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)

    sorted.forEach(([concept, strength]) => {
      const node = this.nodes.get(concept)
      if (node) {
        node.accessCount++
        results.push({
          concept,
          content: node.content,
          strength: Math.round(strength * 100) / 100
        })
      }
    })

    console.log(`🧠 记忆激活: "${query}" -> 找到 ${results.length} 个相关概念`)
    return results
  }

  // 获取记忆网络状态
  getNetworkStatus() {
    return {
      totalNodes: this.nodes.size,
      totalConnections: Array.from(this.connections.values())
        .reduce((sum, set) => sum + set.size, 0) / 2,
      mostAccessed: Array.from(this.nodes.entries())
        .sort((a, b) => b[1].accessCount - a[1].accessCount)
        .slice(0, 3)
        .map(([concept, data]) => ({ concept, accessCount: data.accessCount }))
    }
  }
}