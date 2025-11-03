/**
 * 文本分析工具
 */

export const analyzeTextTool = {
  name: 'analyze_text',
  description: '分析文本的统计信息',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: '要分析的文本内容' }
    },
    required: ['text']
  },
  
  async execute(args, agent) {
    return agent.handleTextAnalysis(`分析文本: ${args.text}`)
  }
}