import type { BattleMessage, BattleState, playerId, PlayerSelection } from '@arcadia-eternity/const'

export interface IBattleSystem {
  getState(playerId?: playerId, showHidden?: boolean): Promise<BattleState>
  getAvailableSelection(playerId: playerId): Promise<PlayerSelection[]>

  submitAction(selection: PlayerSelection): Promise<void>

  BattleEvent(callback: (message: BattleMessage) => void): () => void
}
