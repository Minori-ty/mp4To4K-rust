<template>
    <div class="clearfix">
        <div data-tauri-drag-region class="titlebar">
            <div data-tauri-drag-region class="title-aside"></div>
            <div>
                <div class="titlebar-button" id="titlebar-help" @click="goToCopyright">
                    <img src="./assets/问号.svg" alt="minimize" />
                </div>
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
            <div class="box title" @click="goToHome">
                <el-icon><HomeFilled /></el-icon> <span style="padding-left: 10px; color: #fff">视频转4K视频</span>
            </div>
            <div class="tip">注意: 视频名不要有空格</div>
        </el-aside>
        <el-main>
            <router-view v-slot="{ Component }">
                <KeepAlive>
                    <component :is="Component"></component>
                </KeepAlive>
            </router-view>
        </el-main>
    </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HomeFilled } from '@element-plus/icons-vue'
import { minimize, closeApp } from './system'
import max from './assets/最大化.svg'
import remin from './assets/还原.svg'
import { appWindow } from '@tauri-apps/api/window'
import { getffmpeg } from './script/getffmpeg'
import { useRouter } from 'vue-router'

const router = useRouter()

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

function goToCopyright() {
    router.push('/copyright')
}
function goToHome() {
    router.push('/')
}
/**
 * 切换面板
 * @param tab
 * @param event
 */
/** 当前软件是否最大化 */
const isMax = ref(false)

// 禁止右键
document.oncontextmenu = function () {
    // false为禁止
    return false
    // return true
}

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
    cursor: pointer;
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

.text-red {
    color: red;
}
.tip {
    color: red;
    margin: 50px auto;
    text-align: center;
}
</style>
