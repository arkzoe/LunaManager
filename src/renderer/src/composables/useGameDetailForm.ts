import { ref, type Ref } from 'vue'
import type { GameRecord, GameStatus } from '../../../shared/types'

export interface GameDetailForm {
  tempStatus: Ref<GameStatus>
  tempRating: Ref<number>
  tempNotes: Ref<string>
  tempTitle: Ref<string>
  tempTitleCn: Ref<string>
  tempDeveloper: Ref<string>
  tempReleaseDate: Ref<string>
  tempTags: Ref<string>
  tempExecutablePath: Ref<string>
  tempDescription: Ref<string>
  tempDataSource: Ref<string>
  tempVndbId: Ref<string>
  tempBangumiId: Ref<string>
  resetForm: (game: GameRecord) => void
}

export function useGameDetailForm(): GameDetailForm {
  const tempStatus = ref<GameStatus>('want')
  const tempRating = ref<number>(0)
  const tempNotes = ref('')
  const tempTitle = ref('')
  const tempTitleCn = ref('')
  const tempDeveloper = ref('')
  const tempReleaseDate = ref('')
  const tempTags = ref('[]')
  const tempExecutablePath = ref('')
  const tempDescription = ref('')
  const tempDataSource = ref<string>('')
  const tempVndbId = ref('')
  const tempBangumiId = ref('')

  function resetForm(game: GameRecord): void {
    tempStatus.value = (game.status as GameStatus) || 'want'
    tempRating.value = game.personal_rating || 0
    tempNotes.value = game.notes || ''
    tempTitle.value = game.title || ''
    tempTitleCn.value = game.title_cn || ''
    tempDeveloper.value = game.developer || ''
    tempReleaseDate.value = game.release_date || ''
    tempTags.value = game.custom_tags || '[]'
    tempExecutablePath.value = game.executable_path || ''
    tempDescription.value = game.description || ''
    tempDataSource.value = game.vndb_id ? 'vndb' : game.bangumi_id ? 'bangumi' : ''
    tempVndbId.value = game.vndb_id || ''
    tempBangumiId.value = game.bangumi_id || ''
  }

  return {
    tempStatus,
    tempRating,
    tempNotes,
    tempTitle,
    tempTitleCn,
    tempDeveloper,
    tempReleaseDate,
    tempTags,
    tempExecutablePath,
    tempDescription,
    tempDataSource,
    tempVndbId,
    tempBangumiId,
    resetForm
  }
}