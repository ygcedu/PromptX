/**
 * 专家咨询工具
 */

export const expertConsultationTool = {
  name: 'expert_consultation',
  description: '基于当前激活角色进行专业咨询',
  inputSchema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: '要咨询的专业问题' }
    },
    required: ['question']
  },
  
  async execute(args, agent) {
    if (!agent.roleSystem.currentRole) {
      return '❓ 请先激活一个专业角色，然后再进行咨询。可用角色：产品经理、架构师、内容专家'
    }
    return agent.handleExpertConsultation(args.question)
  }
}