/**
 * 图片工具通用能力（Canvas 本地处理，无任何上传）
 * 具体实现见 utils/image.ts
 */
export function useImageUtils() {
  return {
    loadFile,
    processImage,
    downloadBlob,
    replaceExt,
    formatSize
  }
}
