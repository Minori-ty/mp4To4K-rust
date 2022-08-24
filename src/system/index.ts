import { appWindow } from '@tauri-apps/api/window'
import { Ref } from 'vue'

export function minimize() {
    appWindow.minimize()
}

export function closeApp() {
    close()
}
