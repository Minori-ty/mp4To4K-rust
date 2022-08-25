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
                <el-icon><HomeFilled /></el-icon> <span style="padding-left: 10px; color: #fff">视频转4K视频</span>
            </div>
        </el-aside>
        <el-main>
            <div class="box select-box">
                <div class="box select-button" @click="select">+ 选择路径</div>
                <el-select v-model="model" class="m-2" placeholder="Select" size="large">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
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
import { Command, ChildProcess } from '@tauri-apps/api/shell'
import { createDir, readDir } from '@tauri-apps/api/fs'
import max from './assets/最大化.svg'
import remin from './assets/还原.svg'
import { ElMessageBox } from 'element-plus'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'
import { getffmpeg } from './script/getffmpeg'
import { pids } from './store'
import { formatTime } from './utils/formatTime'
import { throttle } from './utils/throttle'

const model = ref('hevc_nvenc')
const options = [
    {
        value: 'hevc_nvenc',
        label: '硬件加速',
    },
    {
        value: 'libx264',
        label: 'CPU编码',
    },
]
/** ffmpeg的路径 */
const ffmpegPath = ref('')
/** realesrgan的路径 */
const realesrgan = ref('')
const terminal = ref('')

async function init() {
    // 获取ffmpeg路径
    ;[ffmpegPath.value, realesrgan.value] = await getffmpeg()
    // const data = await invoke<number>('read_dir_file_count', { path: 'D:\\program\\rust\\img_temp\\test' })
    // console.log(data)
}
init()

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
        path.value = await invoke('trans_path', { path: selected })
        console.log('fs', path.value)
    } else {
        path.value = ''
    }
}

async function start() {
    const arr = path.value.split('/')
    console.log(arr)

    // 如果没有选择，则退出报错
    if (!path.value) return

    // 如果选择的不是input目录，则退出报错
    if (arr[arr.length - 1] !== 'input')
        return ElMessageBox.alert('请选择input目录', 'Title', {
            confirmButtonText: 'OK',
        })
    const data = await invoke<string[]>('read_dir_file', { path: path.value })
    // console.log(data)
    if (data.length === 0) return
    // console.log(path.value)
    const ls = await join(path.value)
    // console.log(ls)

    // const res = path.value.match(/.+(?=\/input)/g)
    /** input的上级路径 */
    const basePath = path.value.replace('/input', '')
    await readDir(`${basePath}/img_temp`).catch(() => {
        createDir(`${basePath}/img_temp`)
    })
    console.log(basePath)
    await readDir(`${basePath}/img_out`).catch(() => {
        createDir(`${basePath}/img_out`)
    })
    await readDir(`${basePath}/output`).catch(() => {
        createDir(`${basePath}/output`)
    })
    data.forEach(async (file) => {
        const fileName = file.replace('.mp4', '')
        await readDir(`${basePath}/img_temp/${fileName}`).catch(() => {
            createDir(`${basePath}/img_temp/${fileName}`)
        })
        await readDir(`${basePath}/img_out/${fileName}`).catch(() => {
            createDir(`${basePath}/img_out/${fileName}`)
        })
        let fps = '30'
        let duration = ''
        const cmd1 = `ffmpeg -i ${basePath}/input/${file}`
        console.log(cmd1)

        const command1 = new Command('ffmpeg', ['/C', cmd1])

        command1.stderr.on('data', (line) => {
            const fpsResult = line.match(/\w{2}\.?\w{0,2}(?= fps)/)
            /** 匹配视频持续时间的信息 */
            const durationResult = line.match(/(?<=Duration: ).+(?=, start)/)
            if (fpsResult) {
                fps = fpsResult[0]
                console.log(fps)
            }
            if (durationResult) {
                duration = durationResult[0]
                console.log(duration)
            }
        })
        const child1 = await command1.spawn()
        pids.push(child1.pid)
        console.log(fps)

        const cmd2 = `${ffmpegPath.value}  -i ${basePath}/input/${file} -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 ${basePath}/img_temp/${fileName}/frame%08d.png`
        // const cmd2 = `${ffmpegPath.value} -i "${basePath.replaceAll(
        //     '/',
        //     '\\'
        // )}\\input\\${file}" -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 "${basePath.replaceAll(
        //     '/',
        //     '\\'
        // )}\\img_temp\\${fileName}\\frame%08d.png"`

        console.log(cmd2)
        const command2 = new Command('ffmpeg', ['/C', cmd2])
        // ffmpeg任务执行完后再执行转图片
        command2.on('close', async () => {
            console.log('任务完成')
            /** 图片总数 */
            const total = formatTime(duration) * Number(fps)
            const cmd3 = `${realesrgan.value} -i ${basePath}/img_temp/${fileName} -o ${basePath}/img_out/${fileName} -n realesr-animevideov3 -s 2 -f jpg`
            const command3 = new Command('ffmpeg', ['/C', cmd3])
            console.log(cmd3)
            command3.on('close', () => {
                console.log('任务完成')
            })

            command3.stderr.on('data', throttle(fn))
            async function fn(line: string) {
                const current = await invoke<number>('read_dir_file_count', { path: `${basePath}/img_out/${fileName}` })
                console.log(current)
                terminal.value = (current / total) * 100 + '%'
                // console.log(line)
            }
            command3.on('error', (error) => {
                console.log(error)
            })
            const child3 = await command3.spawn()
            pids.push(child3.pid)
            command3.on('close', async () => {
                const cmd4 = `${ffmpegPath.value}  -r ${fps} -i  ${basePath}/img_out/${fileName}/frame%08d.jpg -i  ${basePath}/input/${file} -map 0:v:0 -map 1:a:0 -c:a copy -c:v ${model.value} -r ${fps} -pix_fmt yuv420p ${basePath}/output/${file}`
                const command4 = new Command('ffmpeg', ['/C', cmd4])
                console.log(cmd4)
                command4.on('close', () => {
                    console.log('任务完成')
                })

                command4.stderr.on('data', (line) => {
                    terminal.value = line
                    // console.log(line)
                })
                command4.on('error', (error) => {
                    console.log(error)
                })
                const child4 = await command4.spawn()
                pids.push(child4.pid)
            })
        })

        command2.stderr.on('data', (line) => {
            terminal.value = line
            console.log(line)
        })
        const child2 = await command2.spawn()
        pids.push(child2.pid)
    })
}

const precent = ref(0)

// 禁止右键
document.oncontextmenu = function () {
    // false为禁止
    // return false
    return true
}

const arr = [755, 155]

function toggleMaximize() {
    appWindow.toggleMaximize()
    isMax.value = !isMax.value
}
</script>

<style scoped lang="scss">
.box {
    background-color: #262626;
    margin: 0 auto;
    border-radius: 9px;
    color: #fff;
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
    color: #fff;
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
