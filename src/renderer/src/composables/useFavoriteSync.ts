import { watch, type Ref } from 'vue'
import type { GameRecord } from '../../../shared/types'
import type { UICollection } from './useCollections'

export function useFavoriteSync(
  collections: Ref<UICollection[]>,
  collectionGames: Ref<Map<string, GameRecord[]>>,
  effectiveGames: Ref<GameRecord[]>,
  defaultCollection: Ref<UICollection | undefined>
): { cleanup: () => void } {
  let favSyncTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => effectiveGames.value.filter((g) => g.favorite).map((g) => g.id),
    async (favIds) => {
      if (favSyncTimer) clearTimeout(favSyncTimer)
      if (collections.value.length === 0) return
      favSyncTimer = setTimeout(async () => {
        const def = defaultCollection.value
        if (!def) return
        const colId = def.id
        const currentIds = new Set(collectionGames.value.get(colId)?.map((g) => g.id) || [])
        for (const id of favIds) {
          if (!currentIds.has(id)) {
            try {
              await window.api.addGameToCollection(id, colId)
            } catch {
              /* */
            }
          }
        }
        const games = await window.api.getCollectionGames(colId)
        collectionGames.value.set(colId, games)
        def.gameIds = games.map((g) => g.id)
      }, 500)
    },
    { immediate: true }
  )

  const cleanup = (): void => {
    if (favSyncTimer) clearTimeout(favSyncTimer)
  }

  return { cleanup }
}