import { ref } from 'vue'
import type { Collection as DBCollection } from '../../../shared/types'

export interface UICollection {
  id: string
  name: string
  icon: string
  iconColor: string
  gameIds: string[]
  createdAt: number
  updatedAt: number
}

const defaultIconColor = '#4f46e5'

const mapDBCollection = (db: DBCollection): UICollection => ({
  id: db.id,
  name: db.name,
  icon: 'folder',
  iconColor: defaultIconColor,
  gameIds: [],
  createdAt: db.created_at,
  updatedAt: db.updated_at
})

export function useCollections() {
  const collections = ref<UICollection[]>([])

  const loadCollections = async (): Promise<void> => {
    try {
      let dbCols = await window.api.getCollections()
      const defaultName = '最喜欢的游戏'
      let defaultCol = dbCols.find((c) => c.name === defaultName)
      if (!defaultCol) {
        defaultCol = await window.api.createCollection(defaultName)
        dbCols = [...dbCols, defaultCol]
      }
      const defaultId = defaultCol.id
      collections.value = dbCols.map(mapDBCollection)
      const def = collections.value.find((c) => c.id === defaultId)
      if (def) {
        def.icon = 'heart'
        def.iconColor = '#ec4899'
      }
    } catch {
      collections.value = []
    }
  }

  const createCollection = async (name: string): Promise<void> => {
    if (!name.trim()) return
    try {
      const dbCol = await window.api.createCollection(name.trim())
      const ui = mapDBCollection(dbCol)
      collections.value.push(ui)
    } catch { /* ignore */ }
  }

  const renameCollection = async (id: string, name: string): Promise<void> => {
    if (!name.trim()) return
    try {
      await window.api.renameCollection(id, name.trim())
      const col = collections.value.find((c) => c.id === id)
      if (col) col.name = name.trim()
    } catch { /* ignore */ }
  }

  const deleteCollection = async (id: string): Promise<void> => {
    try {
      await window.api.deleteCollection(id)
      collections.value = collections.value.filter((c) => c.id !== id)
    } catch { /* ignore */ }
  }

  return {
    collections,
    loadCollections,
    createCollection,
    renameCollection,
    deleteCollection
  }
}
