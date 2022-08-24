import { resourceDir, join } from '@tauri-apps/api/path'

/**
 * @description  获取`ffmpeg`的路径
 * @returns      返回`ffmpeg`的路径
 */
export async function getffmpeg() {
    const resourcePath = await resourceDir()
    const res = await join(resourcePath, '_up_', 'ffmpeg', 'bin', 'ffmpeg.exe')
    return res.replaceAll('\\', '/').slice(4)
}
