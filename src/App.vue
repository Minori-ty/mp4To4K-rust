<template>
    <div class="clearfix">
        <div data-tauri-drag-region class="titlebar">
            <div data-tauri-drag-region class="title-aside"></div>
            <div>
                <div class="titlebar-button" id="titlebar-minimize" @click="minimize">
                    <img src="./assets/最小化.svg" alt="minimize" />
                </div>
                <div class="titlebar-button" id="titlebar-maximize" @click="toggleMaximize">
                    <img :src="isMax ? remin : max" alt="maximize" />
                </div>
                <div class="titlebar-button" id="titlebar-close" @click="closeApp">
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
                <div class="box" :class="[path ? 'start-button' : 'default-button']" @click="start">开始转码</div>
            </div>

            <div class="box terminal">{{ terminal }}</div>
            <!-- <el-button @click="ffmpeg" type="primary">开始</el-button> -->
        </el-main>
    </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { HomeFilled } from '@element-plus/icons-vue'
import { minimize, closeApp } from './system'
import { open, confirm } from '@tauri-apps/api/dialog'
import { appDir, resourceDir, join } from '@tauri-apps/api/path'
import { Command } from '@tauri-apps/api/shell'
import { createDir, BaseDirectory, readDir } from '@tauri-apps/api/fs'
import max from './assets/最大化.svg'
import remin from './assets/还原.svg'
import { ElMessageBox } from 'element-plus'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'

/** ffmpeg的路径 */
const ffmpegPath = ref('')
const terminal = ref('')

/**
 * @description  获取ffmpeg的路径
 */
async function getffmpeg() {
    const path = await resourceDir()
    const res = await join(path, '_up_', 'ffmpeg', 'bin', 'ffmpeg.exe')
    ffmpegPath.value = res.replaceAll('\\', '/').slice(4)
}
getffmpeg()

async function fn() {
    const command = new Command('ffmpeg', ['/C', `${ffmpegPath.value} -i D:/program/rust/mp4To4K-rust/test.mp4`])
    // command.on('close', (data) => {
    //     console.log(`command finished with code ${data.code} and signal ${data.signal}`)
    // })
    // command.on('error', (error) => console.error(`command error: "${error}"`))

    // command.stdout.on('data', (line) => {
    //     console.log(line)
    // })

    // command.stderr.on('data', (line) => {
    //     terminal.value = line
    //     console.log(line)
    // })
    const child = await command.spawn()
    console.log('pid:', child.pid)
}

async function queue() {
    await getffmpeg()
    await fn()
}
queue()

/** 当前软件是否最大化 */
const isMax = ref(false)

/** 选择的目录路径 */
const path = ref('')

/** 选择目录 */
async function select() {
    const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: await appDir(),
    })
    if (selected) {
        // 当选择时才修改path的值
        path.value = selected as string
        console.log(selected)
    } else {
        path.value = ''
    }
}
const input = 'D:\\program\\electron-vite-vue\\1.mp4'
const img = 'D:\\program\\electron-vite-vue\\output/frame%08d.png'

async function start() {
    const arr = path.value.split('\\')
    // 如果没有选择，则退出报错
    if (!path.value) return

    // 如果选择的不是input目录，则退出报错
    if (arr[arr.length - 1] !== 'input')
        return ElMessageBox.alert('请选择input目录', 'Title', {
            confirmButtonText: 'OK',
        })
    const data = await invoke('read_dir_file', { path: path.value })
    console.log(data)

    // const command = new Command('ffmpeg', ['/C', `ffmpeg -i ${input} -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 ${img}`])
    // command.on('close', (data) => {
    //     console.log(`command finished with code ${data.code} and signal ${data.signal}`)
    // })
    // command.on('error', (error) => console.error(`command error: "${error}"`))
    // command.stdout.on('data', (line) => console.log(`command stdout: "${line}"`))
    // command.stderr.on('data', (line) => console.log(`command stderr: "${line}"`))
    // const child = await command.spawn()
    // console.log('pid:', child)
    // await createDir('D:\\program\\rust\\tauri-app\\ffmpeg', { dir: BaseDirectory.App, recursive: true })
    // const entries = await readDir('users', { dir: BaseDirectory.Data, recursive: true })
    // function processEntries(entries: any) {
    //     for (const entry of entries) {
    //         console.log(`Entry: ${entry.path}`)
    //         if (entry.children) {
    //             processEntries(entry.children)
    //         }
    //     }
    // }
    // processEntries(entries)
}

async function init() {
    // await appWindow.onCloseRequested(async (event) => {
    //     const confirmed = await confirm('Are you sure?')
    //     await createDir('D:\\program\\rust\\tauri-app\\ffmpeg', { dir: BaseDirectory.App, recursive: true })
    // })
}
init()

const precent = ref(0)

// const start = () => {
//     ElMessage({
//         message: '开始下载',
//         type: 'success',
//     })
//     const timer = setInterval(() => {
//         if (precent.value >= 100) {
//             ElMessage({
//                 message: '下载完成！',
//                 type: 'success',
//             })
//             return clearInterval(timer)
//         }
//         precent.value += 10
//         console.log(precent.value)
//     }, 200)
// }

// 禁止右键
document.oncontextmenu = function () {
    // return false
    return true
}

const arr = [755, 155]

function toggleMaximize() {
    appWindow.toggleMaximize()
    isMax.value = !isMax.value
}
async function close() {
    // await Promise.all(
    //     arr.map(async (pid) => {
    //         await createDir(`D:\\program\\rust\\tauri-app\\${pid}`, { dir: BaseDirectory.App, recursive: true })
    //     })
    // )
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

%btn {
    width: 150px;
    height: 50px;
    text-align: center;
    line-height: 50px;
    cursor: pointer;
}
.select-button {
    background-color: #01c2ce;
    @extend %btn;
    &:hover {
        box-shadow: 0px 0px 5px #01c2ce;
    }
}
.default-button {
    background-color: #555;
    @extend %btn;
    &:hover {
        box-shadow: 0px 0px 5px #444;
    }
}
.start-button {
    background-color: #409eff;
    @extend %btn;
    &:hover {
        box-shadow: 0px 0px 5px #409eff;
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
