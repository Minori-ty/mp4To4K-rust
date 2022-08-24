import { createDir, readDir } from '@tauri-apps/api/fs'
import { Command } from '@tauri-apps/api/shell'

export async function mp4ToImg(basePath: string, ffmpegPath: string, file: string) {
    await readDir(`${basePath}/test`).catch(() => {
        createDir(`${basePath}/test`)
    })
    const cmd = `${ffmpegPath} -i ${file} -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 ${basePath}/test/frame%08d.png`
    const command = new Command('ffmpeg', ['/C', cmd])
    console.log(cmd)
    command.on('close', () => {
        console.log('任务完成')
    })

    command.stderr.on('data', (line) => {
        console.log(line)
    })
    const { pid } = await command.spawn()
}
