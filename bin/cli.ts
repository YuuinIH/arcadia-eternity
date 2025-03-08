import { program } from 'commander'
import path from 'path'
import fs from 'fs/promises'
import yaml from 'yaml'
import { loadGameData } from '@test-battle/data-repository'
import { PlayerParser } from '@test-battle/parser'
import { Battle } from '@test-battle/battle'
import { ConsoleUI } from '@test-battle/console'
import { Player } from '@test-battle/battle'
import { ConsoleClient } from '@test-battle/console-client'
import { PlayerSchema } from '@test-battle/schema'
import { BattleServer } from '@test-battle/server'
import DevServer from 'packages/devServer'
import { Server } from 'socket.io'
import express from 'express'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 解析玩家文件
async function parsePlayerFile(filePath: string): Promise<Player> {
  try {
    const content = await fs.readFile(path.resolve(filePath), 'utf-8')
    const rawData = yaml.parse(content)
    return PlayerParser.parse(rawData)
  } catch (err) {
    throw new Error(`无法解析玩家文件 ${filePath}: ${err instanceof Error ? err.message : err}`)
  }
}

program
  .command('online')
  .description('启动在线对战')
  .requiredOption('-d, --data <path>', '玩家数据文件路径')
  .option('-s, --server <url>', '服务器地址', 'ws://localhost:8102')
  .action(async options => {
    try {
      console.log('[🌀] 正在加载游戏数据...')
      await loadGameData()

      console.log('[🌀] 正在解析玩家数据...')
      const content = await fs.readFile(path.resolve(options.data), 'utf-8')
      const rawData = yaml.parse(content)
      const player = PlayerSchema.parse(rawData)

      const consoleUI = new ConsoleClient(options.server, player)
      consoleUI.connect()
    } catch (err) {
      console.error('[💥] 错误:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

// 主程序
program
  .command('local')
  .description('精灵对战命令行工具')
  .requiredOption('-1, --player1 <path>', '玩家1数据文件路径')
  .requiredOption('-2, --player2 <path>', '玩家2数据文件路径')
  .action(async options => {
    try {
      // 步骤1: 加载游戏数据
      console.log('[🌀] 正在加载游戏数据...')
      await loadGameData()

      // 步骤2: 解析玩家数据
      console.log('[🌀] 正在解析玩家数据...')
      const player1 = await parsePlayerFile(options.player1)
      const player2 = await parsePlayerFile(options.player2)

      // 步骤3: 开始战斗
      console.log('[⚔️] 战斗开始！')
      const battle = new Battle(player1, player2, {
        allowFaintSwitch: true,
      })
      const consoleUI = new ConsoleUI(battle, player1, player2)
      await consoleUI.run()
    } catch (err) {
      console.error('[💥] 致命错误:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

program
  .command('server')
  .description('启动对战服务器')
  .option('-p, --port <number>', '服务器端口', '8102')
  .action(async options => {
    try {
      console.log('[🌀] 正在加载游戏数据...')
      await loadGameData()

      const app = express()
      new DevServer(app)
      const httpServer = createServer(app)

      // 添加基础健康检查端点
      app.get('/health', (_, res) => {
        res.status(200).json({
          status: 'OK',
          uptime: process.uptime(),
          timestamp: Date.now(),
        })
      })

      // 配置Socket.IO
      const io = new Server(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      })

      // 初始化战斗服务器
      new BattleServer(io)

      // 启动服务器
      httpServer.listen(parseInt(options.port), () => {
        console.log(`🖥  Express服务器已启动`)
        console.log(`📡 监听端口: ${options.port}`)
        console.log(`⚔  等待玩家连接...`)
        console.log(`🏥 健康检查端点: http://localhost:${options.port}/health`)
      })
    } catch (err) {
      console.error('[💥] 服务器启动失败:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)
