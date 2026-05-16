import type { GameRecord } from '../../../shared/types'

export interface DetailTarget {
  title?: string
  titleCn?: string
  developer?: string
  publisher?: string
  releaseDate?: string
  description?: string
  customTags?: string
  cover?: string
  rating?: number
}

export function fillGameFromDetail(
  detail: Partial<GameRecord>,
  target: DetailTarget
): void {
  if (detail.title) target.title = detail.title_cn || detail.title || target.title
  if (detail.title_cn) target.titleCn = detail.title_cn
  if (detail.developer) target.developer = detail.developer
  if (detail.publisher) target.publisher = detail.publisher
  if (detail.release_date) target.releaseDate = detail.release_date
  if (detail.description) target.description = detail.description
  if (detail.custom_tags) target.customTags = detail.custom_tags
  if (detail.cover) target.cover = detail.cover
  if (detail.rating) target.rating = detail.rating
}
