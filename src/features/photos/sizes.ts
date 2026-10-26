// B5 → Files: the main file has its long side at 1600 px, the thumbnail at 320 px.
export const mainLongSide = 1600
export const thumbLongSide = 320
export const jpegQuality = 0.7

/** The resize that brings the long side to `max` (never enlarging), keeping the aspect ratio. */
export function fitLongSide(
  width: number,
  height: number,
  max: number,
): { width: number } | { height: number } {
  if (width >= height) return { width: Math.min(width, max) }
  return { height: Math.min(height, max) }
}

/** `{organization_id}/{hive_id}/{photo_id}.jpg`, ids in lowercase (Storage refuses anything else). */
export function storagePath(organizationId: string, hiveId: string, photoId: string): string {
  return `${organizationId}/${hiveId}/${photoId}.jpg`.toLowerCase()
}

export const thumbPath = (path: string) => path.replace(/\.jpg$/, '.thumb.jpg')
