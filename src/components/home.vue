<template>
    <el-scrollbar>
        <div class="box select-box">
            <div class="box select-button" @click="select">+ 选择路径</div>
            <el-select v-model="model" class="m-2" placeholder="Select" size="large">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="box" :class="[path ? 'start-button' : 'default-button']" @click="start">开始转码</div>
        </div>

        <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
            <el-tab-pane label="正在转换" name="first">
                <Terminal
                    v-for="file in scheduleList"
                    :key="file"
                    :file="file"
                    :basePath="basePath"
                    :ffmpeg-path="ffmpegPath"
                    :realesrgan="realesrgan"
                    :model="model"
                    @completed="completed"
                />
            </el-tab-pane>
            <el-tab-pane label="完成" name="second">
                <Complete v-for="file in completeList" :key="file" :file-name="file" />
            </el-tab-pane>
        </el-tabs>
    </el-scrollbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { open } from '@tauri-apps/api/dialog'
import { appDir } from '@tauri-apps/api/path'
import { createDir, readDir } from '@tauri-apps/api/fs'
import { ElMessageBox } from 'element-plus'
import { invoke } from '@tauri-apps/api/tauri'
import { getffmpeg } from '../script/getffmpeg'
import Terminal from './terminal.vue'
import type { TabsPaneContext } from 'element-plus'
import Complete from './complete.vue'

const activeName = ref('first')
const scheduleList = ref<string[]>([])
const completeList = ref<string[]>([])
const model = ref<'hevc_nvenc' | 'libx264'>('libx264')
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

/** 初始化时要做的事情 */
async function init() {
    // 获取ffmpeg路径
    ;[ffmpegPath.value, realesrgan.value] = await getffmpeg()
}
init()

/**
 * 切换面板
 * @param tab
 * @param event
 */
const handleClick = (tab: TabsPaneContext, event: Event) => {}

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

function completed(file: string) {
    scheduleList.value = scheduleList.value.filter((name: string) => name !== file)
    completeList.value.push(file)
}
let basePath = ref('')
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
    const fileList = await invoke<string[]>('read_dir_file', { path: path.value })
    // console.log(fileList)
    if (fileList.length === 0) return

    /** input的上级路径 */
    basePath.value = path.value.replace('/input', '')
    await readDir(`${basePath.value}/output`).catch(() => {
        createDir(`${basePath.value}/output`)
    })
    await readDir(`${basePath.value}/img_temp`).catch(() => {
        createDir(`${basePath.value}/img_temp`)
    })
    console.log(basePath.value)
    await readDir(`${basePath.value}/img_out`).catch(() => {
        createDir(`${basePath.value}/img_out`)
    })

    const existList = await invoke<string[]>('read_dir_file', { path: `${basePath.value}/output` })
    scheduleList.value = fileList.filter((file) => {
        return !existList.includes(file)
    })
    // scheduleList.value = fileList
    console.log(basePath.value)
    return
}

// 禁止右键
document.oncontextmenu = function () {
    // false为禁止
    // return false
    return true
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
    background-color: #409eff;
    @extend %btn;
    &:hover {
        box-shadow: 0px 0px 5px #409eff;
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
    background-color: #67c23a;
    @extend %btn;
    &:hover {
        box-shadow: 0px 0px 5px #67c23a;
    }
}

.text-red {
    color: red;
}
.tip {
    color: red;
    margin: 50px auto;
    text-align: center;
}
</style>
