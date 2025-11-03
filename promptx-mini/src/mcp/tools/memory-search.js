/**
 * 记忆搜索工具
 */

export const memorySearchTool = {
  name: 'memory_search',
  description: '从记忆系统中搜索相关信息',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      max_results: { type: 'number', description: '最大结果数量，默认为3' }
    },
    required: ['query']
  },
  
  async execute(args, agent) {
    const maxResults = args.max_results || 3
    const memories = agent.memory.recall(args.query, maxResults)
    
    if (memories.length > 0) {
      return `🧠 记忆搜索结果：\n` +
             memories.map((m, i) => `  ${i + 1}. ${m.concept}: ${m.content.substring(0, 100)}... (相关度: ${m.strength})`).join('\n')
    } else {
      return `🧠 未找到与 "${args.query}" 相关的记忆`
    }
  }
}