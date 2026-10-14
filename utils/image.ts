/** 图片处理核心：全部基于 Canvas 在浏览器本地完成 */

export interface ImageProcessOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp'
  background?: string
}

export interface ImageResult {
  blob: Blob
  url: string
  width: number
  height: number
}

export async function loadFile(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = url
  })
  return { img, url }
}

export async function processImage(
  img: HTMLImageElement,
  opts: ImageProcessOptions
): Promise<ImageResult> {
  const {
    maxWidth = 0,
    maxHeight = 0,
    quality = 0.85,
    type = 'image/jpeg',
    background = ''
  } = opts

  let w = img.naturalWidth
  let h = img.naturalHeight

  if (maxWidth > 0 && w > maxWidth) {
    h = Math.round((h * maxWidth) / w)
    w = maxWidth
  }
  if (maxHeight > 0 && h > maxHeight) {
    w = Math.round((w * maxHeight) / h)
    h = maxHeight
  }
  w = Math.max(1, w)
  h = Math.max(1, h)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, w, h)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('encode failed'))),
      type,
      type === 'image/png' || type === 'image/bmp' ? undefined : quality
    )
  })

  return { blob, url: URL.createObjectURL(blob), width: w, height: h }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function replaceExt(name: string, ext: string) {
  const base = name.replace(/\.[^.]+$/, '')
  return `${base}.${ext}`
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
