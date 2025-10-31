#!/usr/bin/env node

/**
 * PromptX Mini - 核心理念演示
 * 
 * 这是一个极简版的PromptX实现，展示核心概念：
 * 1. 🧠 认知记忆系统 - 智能的知识存储和检索
 * 2. 🎭 角色专业化系统 - AI瞬间变身专业专家  
 * 3. 🔧 工具集成系统 - 动态工具调用和管理
 * 4. 💬 自然语言交互 - 像和真人专家对话
 */

import { PromptXAgent } from './src/agent.js'
import readline from 'readline'

// 创建AI代理实例
const agent = new PromptXAgent()

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '💬 您: '
})

// 自动演示模式
async function runDemo() {
  console.log('🎬 开始自动演示...\n')
  
  const demoCommands = [
    '创建角色：数据分析师，专门分析数据和制作报表',
    '激活数据分析师',
    '如何分析用户留存率数据？',
    '激活产品经理',
    '如何设计一个用户注册流程？',
    '计算 (100 * 0.05) + 50',
    '分析文本: 人工智能正在改变我们的生活方式，从智能手机到自动驾驶汽车，AI技术无处不在。',
    '创建角色：UI设计师，专注界面设计和用户体验',
    '激活UI设计师',
    '移动端登录页面应该如何设计？',
    '显示状态'
  ]

  for (const command of demoCommands) {
    console.log(`\n⏱️  自动执行: ${command}`)
    await new Promise(resolve => setTimeout(resolve, 1500)) // 延迟1.5秒
    await agent.processInput(command)
    await new Promise(resolve => setTimeout(resolve, 2000)) // 延迟2秒
  }

  console.log('\n🎉 自动演示完成！现在您可以自由交互...\n')
}

// 交互式对话循环
function startInteractiveMode() {
  rl.prompt()

  rl.on('line', async (input) => {
    const trimmedInput = input.trim()
    
    if (trimmedInput === 'exit' || trimmedInput === 'quit') {
      console.log('👋 再见！感谢体验 PromptX Mini!')
      rl.close()
      return
    }

    if (trimmedInput === 'demo') {
      await runDemo()
      rl.prompt()
      return
    }

    if (trimmedInput === 'clear') {
      console.clear()
      agent.showWelcome()
      rl.prompt()
      return
    }

    if (trimmedInput) {
      await agent.processInput(trimmedInput)
    }
    
    rl.prompt()
  })

  rl.on('close', () => {
    console.log('\n👋 再见！')
    process.exit(0)
  })
}

// 主程序入口
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--demo') || args.includes('-d')) {
    await runDemo()
    console.log('\n💡 输入任意内容继续交互，或输入 "exit" 退出...')
    startInteractiveMode()
  } else {
    console.log('💡 提示: 输入 "demo" 查看自动演示，输入 "exit" 退出程序')
    startInteractiveMode()
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 程序错误:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason)
})

// 启动程序
main().catch(console.error)