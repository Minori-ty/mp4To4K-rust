<template>
    <div class="clearfix">
        <div data-tauri-drag-region class="titlebar">
            <div class="title-aside"></div>
            <div>
                <div class="titlebar-button" id="titlebar-minimize">
                    <img src="./assets/最小化.svg" alt="minimize" />
                </div>
                <div class="titlebar-button" id="titlebar-maximize">
                    <img :src="isMax ? remin : max" alt="maximize" />
                </div>
                <div class="titlebar-button" id="titlebar-close">
                    <img src="./assets/关闭.svg" alt="close" />
                </div>
            </div>
        </div>
    </div>
    <el-container>
        <el-aside>
            <div class="box title">
                <el-icon><HomeFilled /></el-icon> <span style="padding-left: 10px">视频转4K视频</span>
            </div>
        </el-aside>
        <el-main>
            <div class="box select-box">
                <div class="box select-button" @click="select">+ 选择路径</div>
            </div>
            <div class="box terminal"></div>
            <el-button @click="ffmpeg" type="primary">开始</el-button>
        </el-main>
    </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { HomeFilled } from '@element-plus/icons-vue'
import { ElContainer, ElAside, ElIcon, ElMain, ElMessage, ElMessageBox, ElButton, type Action } from 'element-plus'
import { appWindow } from '@tauri-apps/api/window'
import { open, confirm } from '@tauri-apps/api/dialog'
import { appDir } from '@tauri-apps/api/path'
import { Command } from '@tauri-apps/api/shell'
import { createDir, BaseDirectory } from '@tauri-apps/api/fs'
import max from './assets/最大化.svg'
import remin from './assets/还原.svg'

const isMax = ref(false)
const path = ref('')
async function select() {
    const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: await appDir(),
    })
    if (selected) {
        path.value = selected as string
        console.log(selected)
    } else {
        path.value = ''
    }
}
const input = 'D:\\program\\electron-vite-vue\\1.mp4'
const img = 'D:\\program\\electron-vite-vue\\output/frame%08d.png'

async function ffmpeg() {
    if (!path.value)
        return ElMessageBox.alert('请选择文件目录', 'Title', {
            confirmButtonText: 'OK',
        })
    const command = new Command('ffmpeg', ['/C', `ffmpeg -i ${input} -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 ${img}`])

    command.on('close', (data) => {
        console.log(`command finished with code ${data.code} and signal ${data.signal}`)
    })
    command.on('error', (error) => console.error(`command error: "${error}"`))
    command.stdout.on('data', (line) => console.log(`command stdout: "${line}"`))
    command.stderr.on('data', (line) => console.log(`command stderr: "${line}"`))
    const child = await command.spawn()
    console.log('pid:', child)
    await createDir('D:\\program\\rust\\tauri-app\\ffmpeg', { dir: BaseDirectory.App, recursive: true })
}

async function init() {
    // await appWindow.onCloseRequested(async (event) => {
    //     const confirmed = await confirm('Are you sure?')
    //     await createDir('D:\\program\\rust\\tauri-app\\ffmpeg', { dir: BaseDirectory.App, recursive: true })
    // })
}
init()
onMounted(() => {
    document.getElementById('titlebar-minimize')!.addEventListener('click', () => appWindow.minimize())
    document.getElementById('titlebar-maximize')!.addEventListener('click', () => {
        appWindow.toggleMaximize()
        isMax.value = !isMax.value
    })
    document.getElementById('titlebar-close')!.addEventListener('click', async () => {
        close()
    })
})
const precent = ref(0)

const start = () => {
    ElMessage({
        message: '开始下载',
        type: 'success',
    })
    const timer = setInterval(() => {
        if (precent.value >= 100) {
            ElMessage({
                message: '下载完成！',
                type: 'success',
            })
            return clearInterval(timer)
        }
        precent.value += 10
        console.log(precent.value)
    }, 200)
}

/** 禁止右键 */
document.oncontextmenu = function () {
    // return false
    return true
}

const arr = [755, 155]

async function close() {
    await Promise.all(
        arr.map(async (pid) => {
            await createDir(`D:\\program\\rust\\tauri-app\\${pid}`, { dir: BaseDirectory.App, recursive: true })
        })
    )
    appWindow.close()
}
</script>

<style scoped lang="scss">
.box {
    background-color: #262626;
    margin: 0 auto;
    border-radius: 9px;
}
.el-card {
    width: 500px;
}

.el-container {
    width: 100vw;
    height: 100vh;
    // padding-top: 30px;
}

.title {
    width: 170px;
    height: 50px;
    // margin-top: 20px;
    text-align: center;
    line-height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.select-box {
    height: 150px;
    display: flex;
    align-items: center;
}
.select-button {
    width: 150px;
    height: 50px;
    background-color: #01c2ce;
    text-align: center;
    line-height: 50px;
    cursor: pointer;
    &:hover {
        box-shadow: 0px 0px 5px #01c2ce;
    }
}

.terminal {
    margin-top: 40px;
    height: 80px;
}

.text-red {
    color: red;
}
</style>
