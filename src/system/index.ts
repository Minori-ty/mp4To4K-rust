import { appWindow } from '@tauri-apps/api/window'
import { Ref } from 'vue'
import { pids } from '../store'
import { Command } from '@tauri-apps/api/shell'

export function minimize() {
    appWindow.minimize()
}

export async function closeApp() {
    await Promise.all(
        pids.map(async (pid) => {
            return new Promise((resolve) => {
                const cmd = `taskkill /f /t /pid ${pid}`
                const command = new Command('ffmpeg', ['/C', cmd])
                command.spawn()
                command.on('close', () => {
                    resolve(0)
                })
            })
        })
    )
    appWindow.close()
}
