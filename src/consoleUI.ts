import {
  Player,
  PlayerSelection,
  UseSkillSelection,
  SwitchPetSelection,
  BattleSystem,
  DoNothingSelection,
  BattlePhase,
} from './simulation/battleSystem'
import readline from 'readline'
import { BattleUI } from './ui'
import { BattleMessage, BattleMessageType } from './simulation/message'
import { Pet } from './simulation/pet'
import { TYPE_MAP } from './simulation/type'

export class ConsoleUI extends BattleUI {
  protected battle: BattleSystem
  constructor(
    battle: BattleSystem,
    private playerA: Player,
    private playerB: Player,
  ) {
    super(battle)
    this.battle = battle
    battle.onMessage(this.handleMessage.bind(this)) //this的上下文应该为本身
  }

  private getPetStatus = (pet: Pet) =>
    `${TYPE_MAP[pet.type].emoji}${pet.name}(${pet.species.name}) [Lv.${pet.level} HP:${pet.currentHp}/${pet.maxHp} Rage:${pet.owner?.currentRage}/100]`

  private handleMessage(message: BattleMessage) {
    switch (message.type) {
      case BattleMessageType.BattleStart:
        console.log(`⚔️ 对战开始！`)
        console.log(`玩家A: ${this.getPetStatus(this.playerA.activePet)}`)
        console.log(`玩家B: ${this.getPetStatus(this.playerB.activePet)}`)
        break

      case BattleMessageType.RoundStart:
        console.log(`\n=== 第 ${message.data.round} 回合 ===`)
        break

      case BattleMessageType.PhaseChange:
        console.log(`🔄 阶段转换：${this.translatePhase(message.data.from)} → ${this.translatePhase(message.data.to)}`)
        break

      case BattleMessageType.RageChange: {
        const d = message.data
        console.log(`⚡ ${d.pet} 怒气 ${d.before} → ${d.after} (${this.getRageReason(d.reason)})`)
        break
      }

      case BattleMessageType.SkillUse: {
        const d = message.data
        console.log(`🎯 ${d.user} 使用 ${d.skill}（消耗${d.rageCost}怒气） → ${d.target}`)
        break
      }

      case BattleMessageType.SkillMiss: {
        const d = message.data
        console.log(`❌ ${d.user} 的 ${d.skill} 未命中！ (${this.translateMissReason(d.reason)})`)
        break
      }

      case BattleMessageType.Damage: {
        const d = message.data
        let log = `💥 ${d.target} 受到 ${d.damage}点${this.getDamageType(d.damageType)}伤害`
        if (d.isCrit) log += ' (暴击)'
        if (d.effectiveness > 1) log += ' 效果拔群！'
        if (d.effectiveness < 1) log += ' 效果不佳...'
        log += ` (剩余HP: ${d.currentHp}/${d.maxHp})`
        console.log(log)
        break
      }

      case BattleMessageType.Heal:
        console.log(`💚 ${message.data.target} 恢复 ${message.data.amount}点HP`)
        break

      case BattleMessageType.PetSwitch: {
        const d = message.data
        console.log(`🔄 ${d.player} 更换精灵：${d.fromPet} → ${d.toPet}`)
        console.log(`   ${d.toPet} 剩余HP: ${d.currentHp}`)
        break
      }

      case BattleMessageType.PetDefeated:
        console.log(`☠️ ${message.data.pet} 倒下！${message.data.killer ? `(击败者: ${message.data.killer})` : ''}`)
        break

      case BattleMessageType.StatChange: {
        const d = message.data
        const arrow = d.stage > 0 ? '↑' : '↓'
        console.log(`📈 ${d.pet} ${this.translateStat(d.stat)} ${arrow.repeat(Math.abs(d.stage))} (${d.reason})`)
        break
      }

      case BattleMessageType.StatusAdd:
        console.log(
          `⚠️ ${message.data.target} 陷入【${message.data.status}】状态 ${
            message.data.source ? `(来自 ${message.data.source})` : ''
          }`,
        )
        break

      case BattleMessageType.StatusRemove:
        console.log(`✅ ${message.data.target} 解除【${message.data.status}】状态`)
        break

      case BattleMessageType.MarkApply:
        console.log(`🔖 ${message.data.target} 被施加【${message.data.markType}】印记`)
        break

      case BattleMessageType.MarkTrigger:
        console.log(`✨ ${message.data.markType} 印记触发：${message.data.effect}`)
        break

      case BattleMessageType.BattleEnd:
        console.log(`\n🎉 对战结束！胜利者：${message.data.winner}`)
        console.log(`➤ 结束原因：${this.translateEndReason(message.data.reason)}`)
        break

      case BattleMessageType.ForcedSwitch:
        console.log(`${message.data.player}必须更换倒下的精灵！`)
        break

      case BattleMessageType.Crit: {
        const d = message.data
        console.log(`🔥 ${d.attacker} 对 ${d.target} 造成了暴击伤害！`)
        break
      }

      default:
        console.warn('未知消息类型:', JSON.stringify(message))
    }
  }

  // ---------- 辅助方法 ----------
  private translatePhase(phase: BattlePhase): string {
    const phases: Record<BattlePhase, string> = {
      [BattlePhase.SwitchPhase]: '换宠阶段',
      [BattlePhase.SelectionPhase]: '指令选择',
      [BattlePhase.ExecutionPhase]: '执行阶段',
      [BattlePhase.Ended]: '战斗结束',
    }
    return phases[phase] || phase
  }

  private getRageReason(reason: string): string {
    const reasons: Record<string, string> = {
      turn: '回合增长',
      damage: '受伤获得',
      skill: '技能消耗',
      switch: '切换精灵',
    }
    return reasons[reason] || reason
  }

  private translateMissReason(reason: string): string {
    return (
      {
        accuracy: '命中未达标',
        dodge: '被对方闪避',
        immune: '属性免疫',
      }[reason] || reason
    )
  }

  private getDamageType(type: string): string {
    return (
      {
        physical: '物理',
        special: '特殊',
        fixed: '固定',
      }[type] || type
    )
  }

  private translateStat(stat: string): string {
    const stats: Record<string, string> = {
      atk: '攻击',
      def: '防御',
      spd: '速度',
      critRate: '暴击率',
    }
    return stats[stat] || stat
  }

  private translateEndReason(reason: string): string {
    return reason === 'all_pet_fainted' ? '全部精灵失去战斗能力' : '玩家投降'
  }

  // 修改操作提示逻辑
  private async getPlayerAction(player: Player): Promise<PlayerSelection> {
    // 强制换宠时限制只能选择换宠
    if (this.battle.pendingDefeatedPlayer === player) {
      return this.getForcedSwitchAction(player)
    }
    return this.getNormalAction(player)
  }

  private async getNormalAction(player: Player): Promise<PlayerSelection> {
    console.log(this.getPetStatus(player.activePet))

    const actions = this.battle.getAvailableSelection(player)
    console.log('可用操作：')

    // 1. 显示可用技能
    const validSkills = actions.filter((a): a is UseSkillSelection => a.type === 'use-skill')
    validSkills.forEach((a, i) =>
      console.log(`${i + 1}. 使用技能: ${a.skill.name} (威力:${a.skill.power}, 消耗:${a.skill.rageCost})`),
    )

    // 2. 显示更换精灵选项
    const switchActions = actions.filter((a): a is SwitchPetSelection => a.type === 'switch-pet')
    switchActions.forEach((a, i) => console.log(`${validSkills.length + i + 1}. 更换精灵: ${this.getPetStatus(a.pet)}`))

    // 3. 显示什么都不做选项
    const doNothingIndex = actions.filter((a): a is DoNothingSelection => a.type === 'do-nothing')
    doNothingIndex.forEach(() => console.log(`${validSkills.length + switchActions.length + 1}. 什么都不做`))

    // 4. 获取玩家选择
    while (true) {
      const choice = parseInt(await this.question('选择操作编号: '))
      const action = this.getSelectionByChoice(player, choice, validSkills, switchActions)
      if (action) return action

      console.log('无效选择，请输入正确的操作编号！')
    }
  }

  private getSelectionByChoice(
    player: Player,
    choice: number,
    validSkills: UseSkillSelection[],
    switchActions: SwitchPetSelection[],
  ): PlayerSelection | null {
    // 选择技能
    if (choice >= 1 && choice <= validSkills.length) {
      return validSkills[choice - 1]
    }

    // 选择更换精灵
    if (choice > validSkills.length && choice <= validSkills.length + switchActions.length) {
      return switchActions[choice - validSkills.length - 1]
    }

    // 选择什么都不做
    if (choice === validSkills.length + switchActions.length + 1) {
      return { type: 'do-nothing', source: player }
    }

    // 无效选择
    return null
  }

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
      rl.question(prompt, answer => {
        rl.close()
        resolve(answer)
      })
    })
  }

  public async run(): Promise<void> {
    const battle = this.battle.startBattle()
    let generator = battle.next() // 初始化生成器

    while (!generator.done) {
      if (this.battle.pendingDefeatedPlayer) {
        const action = await this.getForcedSwitchAction(this.battle.pendingDefeatedPlayer)
        generator = battle.next(action)
        continue
      }

      // 处理击败方换宠
      if (this.battle.lastKiller && this.battle.allowKillerSwitch) {
        const action = await this.handleKillerSwitch(this.battle.lastKiller)
        generator = battle.next(action)
        continue
      }
      const currentPlayer = this.getCurrentActivePlayer()
      if (!currentPlayer) break

      // 获取玩家选择
      const selection = await this.getPlayerAction(currentPlayer)

      // 将选择发送给生成器
      generator = battle.next(selection)
    }
    const victor = generator.value as Player
    console.log(`胜利者是: ${victor.name}`)
  }

  private getCurrentActivePlayer(): Player | null {
    // 优先处理强制换宠
    if (this.battle.pendingDefeatedPlayer) {
      return this.battle.pendingDefeatedPlayer
    }

    // 正常回合按顺序处理
    if (!this.playerA.selection) return this.playerA
    if (!this.playerB.selection) return this.playerB
    return null
  }

  private async handleKillerSwitch(player: Player): Promise<PlayerSelection> {
    console.log(`\n==== ${player.name} 可以更换精灵(击破奖励) ====`)
    const actions = this.battle.getAvailableSwitch(player)

    // 显示可选操作
    console.log('1. 保持当前精灵')
    actions.forEach((a, i) => console.log(`${i + 2}. 更换精灵: ${this.getPetStatus(a.pet)}`))

    while (true) {
      const choice = parseInt(await this.question('请选择操作: '))
      if (choice === 1) {
        return { type: 'do-nothing', source: player }
      }
      if (choice >= 2 && choice <= actions.length + 1) {
        return actions[choice - 2]
      }
      console.log('无效的选择！')
    }
  }

  private async getForcedSwitchAction(player: Player): Promise<PlayerSelection> {
    const actions = this.battle.getAvailableSwitch(player) as SwitchPetSelection[]
    console.log('必须更换精灵！可用选项：')
    actions.forEach((a, i) => console.log(`${i + 1}. 更换精灵: ${this.getPetStatus(a.pet)}`))

    while (true) {
      const choice = parseInt(await this.question('请选择更换的精灵：'))
      if (choice >= 1 && choice <= actions.length) {
        return actions[choice - 1]
      }
      console.log('无效选择！')
    }
  }
}
