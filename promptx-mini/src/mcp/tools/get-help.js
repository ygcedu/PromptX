/**
 * 获取帮助工具
 */

export const getHelpTool = {
  name: 'get_help',
  description: '获取系统帮助信息',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  
  async execute(args, agent) {
    return agent.handleHelp()
  }
}