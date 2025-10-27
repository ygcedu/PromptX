const PouchStateMachine = require('./state/PouchStateMachine')
const PouchRegistry = require('./PouchRegistry')
const commands = require('./commands')
const { COMMANDS } = require('~/constants')
const logger = require('@promptx/logger')

/**
 * 锦囊CLI主入口
 * 提供命令行接口和统一的执行入口
 */
class PouchCLI {
  constructor () {
    this.stateMachine = new PouchStateMachine()
    this.registry = new PouchRegistry()
    this.initialized = false
  }

  /**
   * 初始化CLI
   */
  async initialize () {
    if (this.initialized) {
      return
    }

    // 批量注册所有命令
    this.registry.registerBatch({
      project: commands.ProjectCommand,
      discover: commands.DiscoverCommand,
      action: commands.ActionCommand,
      learn: commands.LearnCommand,
      recall: commands.RecallCommand,
      remember: commands.RememberCommand,
      think: commands.ThinkCommand,
      toolx: commands.ToolCommand
    })

    // 将命令注册到状态机
    for (const name of this.registry.list()) {
      const command = this.registry.get(name)
      this.stateMachine.registerCommand(name, command)
    }

    // 加载历史状态
    await this.stateMachine.loadState()

    this.initialized = true
  }

  /**
   * 执行命令
   * @param {string} commandName - 命令名称
   * @param {Array} args - 命令参数
   * @param {boolean} silent - 静默模式，不输出到console（用于MCP）
   * @returns {Promise<PouchOutput>} 执行结果
   */
  async execute (commandName, args = [], silent = false) {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize()
    }

    // 验证命令是否存在
    if (!this.registry.validate(commandName)) {
      throw new Error(`未知命令: ${commandName}\n使用 '${COMMANDS.HELP}' 查看可用命令`)
    }

    try {
      // 通过状态机执行命令！！！
      const result = await this.stateMachine.transition(commandName, args)

      // 只在非静默模式下输出（避免干扰MCP协议）
      if (!silent) {
        // 如果结果有 toString 方法，打印人类可读格式
        if (result && result.toString && typeof result.toString === 'function') {
          logger.log(result.toString())
        } else {
          logger.log(JSON.stringify(result, null, 2))
        }
      }

      return result
    } catch (error) {
      // 错误输出始终使用stderr，不干扰MCP协议
      if (!silent) {
        logger.error(`执行命令出错: ${error.message}`)
      }
      throw error
    }
  }
}

module.exports = PouchCLI
