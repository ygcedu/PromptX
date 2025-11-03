/**
 * 计算工具
 */

export const calculateTool = {
  name: 'calculate',
  description: '执行数学计算',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: '数学表达式，如：2+3*4' }
    },
    required: ['expression']
  },
  
  async execute(args, agent) {
    return agent.handleCalculation(`计算 ${args.expression}`)
  }
}