<template>
    <div class="terminalBox">
        <h3 class="title" v-if="show1">视频转图片的任务</h3>
        <div class="flex" v-if="show1">
            <span class="file">{{ props.file }}</span
            ><el-progress :percentage="precent1" style="flex: 1" />
        </div>

        <h3 class="title" v-if="show2">图片转4K图片的任务</h3>
        <div class="flex" v-if="show2">
            <span class="file">{{ props.file }}</span
            ><el-progress :percentage="precent2" style="flex: 1" />
        </div>

        <h3 class="title">4K图片转4K视频的任务</h3>
        <div class="flex">
            <span class="file">{{ props.file }}</span
            ><el-progress :percentage="precent3" style="flex: 1" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { createDir, readDir } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import { Command } from '@tauri-apps/api/shell'
import { pids } from '../store'
import { ref } from 'vue'
import { formatTime } from '../utils/formatTime'
import { throttle } from '../utils/throttle'

const props = defineProps<{
    file: string
    basePath: string
    ffmpegPath: string
    realesrgan: string
    model: string
}>()

const emits = defineEmits<{
    (event: 'completed', file: string): void
}>()

const precent1 = ref(0)
const precent2 = ref(0)
const precent3 = ref(0)

const show1 = ref(true)
const show2 = ref(true)
const show3 = ref(true)

async function init() {
    const fileName = props.file.replace('.mp4', '')
    await readDir(`${props.basePath}/img_temp/${fileName}`).catch(() => {
        createDir(`${props.basePath}/img_temp/${fileName}`)
    })
    await readDir(`${props.basePath}/img_out/${fileName}`).catch(() => {
        createDir(`${props.basePath}/img_out/${fileName}`)
    })
    let fps = ref('5')
    let duration = ref('')
    const cmd1 = `ffmpeg -i ${props.basePath}/input/${props.file}`
    const command1 = new Command('ffmpeg', ['/C', cmd1])
    command1.stderr.on('data', (line) => {
        const fpsResult = line.match(/\w{2}\.?\w{0,2}(?= fps)/)
        /** 匹配视频持续时间的信息 */
        const durationResult = line.match(/(?<=Duration: ).+(?=, start)/)
        if (fpsResult) {
            fps.value = fpsResult[0]
            console.log('fps', fps.value)
        }
        if (durationResult) {
            duration.value = durationResult[0]
            console.log('duration', duration.value)
        }
    })
    const child1 = await command1.spawn()
    pids.push(child1.pid)
    command1.on('close', async () => {
        const tempCount = await invoke<number>('read_dir_file_count', {
            path: `${props.basePath}/img_temp/${fileName}`,
        })
        if (tempCount > 10) {
            show1.value = false
            const outCount = await invoke<number>('read_dir_file_count', {
                path: `${props.basePath}/img_out/${fileName}`,
            })
            if (outCount > 10) {
                const total = formatTime(duration.value)
                show2.value = false
                const cmd4 = `${props.ffmpegPath}  -r ${fps.value} -i  ${props.basePath}/img_out/${fileName}/frame%08d.jpg -i  ${props.basePath}/input/${props.file} -map 0:v:0 -map 1:a:0 -c:a copy -c:v ${props.model} -r ${fps.value} -pix_fmt yuv420p ${props.basePath}/output/${props.file}`
                console.log(cmd4)

                const command4 = new Command('ffmpeg', ['/C', cmd4])
                const child4 = await command4.spawn()
                pids.push(child4.pid)
                command4.on('close', () => {
                    // show3.value = false
                    emits('completed', props.file)
                })
                command4.on('error', (error) => {
                    console.log(error)
                })
                command4.stderr.on('data', throttle(fn, 200))
                async function fn(data: string) {
                    /** 控制台的信息 */
                    const result = data.match(/(?<=time=).+(?= bitrate)/)
                    if (result) {
                        const current = formatTime(result[0])
                        precent3.value = Math.round((current / total) * 100)
                        console.log(current, total)
                    }
                }
            } else {
                console.log('优化图片')

                const total = formatTime(duration.value) * Number(fps.value)
                const cmd3 = `${props.realesrgan} -i ${props.basePath}/img_temp/${fileName} -o ${props.basePath}/img_out/${fileName} -n realesr-animevideov3 -s 2 -f jpg`
                const command3 = new Command('ffmpeg', ['/C', cmd3])

                command3.stderr.on('data', throttle(fn, 2000))
                async function fn() {
                    const current = await invoke<number>('read_dir_file_count', {
                        path: `${props.basePath}/img_out/${fileName}`,
                    })
                    precent2.value = Math.round((current / total) * 100)
                    console.log(current, total, (current / total) * 100)
                    // console.log(line)
                }
                const child3 = await command3.spawn()
                pids.push(child3.pid)
            }
        } else {
            const total = formatTime(duration.value) * Number(fps.value)
            console.log(duration.value, formatTime(duration.value), fps.value)

            const cmd2 = `${props.ffmpegPath}  -i ${props.basePath}/input/${props.file} -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 ${props.basePath}/img_temp/${fileName}/frame%08d.png`
            const command2 = new Command('ffmpeg', ['/C', cmd2])
            command2.stderr.on('data', async (line) => {
                const current = await invoke<number>('read_dir_file_count', {
                    path: `${props.basePath}/img_temp/${fileName}`,
                })
                console.log(current, total)

                precent1.value = Math.round((current / total) * 100)
            })
            const child2 = await command2.spawn()
            pids.push(child2.pid)
            command2.on('close', async () => {
                show1.value = false
                precent1.value = 100
                console.log('优化图片')

                const total = formatTime(duration.value) * Number(fps.value)
                const cmd3 = `${props.realesrgan} -i ${props.basePath}/img_temp/${fileName} -o ${props.basePath}/img_out/${fileName} -n realesr-animevideov3 -s 2 -f jpg`
                const command3 = new Command('ffmpeg', ['/C', cmd3])

                command3.stderr.on('data', throttle(fn, 2000))
                async function fn() {
                    const current = await invoke<number>('read_dir_file_count', {
                        path: `${props.basePath}/img_out/${fileName}`,
                    })
                    precent2.value = Math.round((current / total) * 100)
                    console.log(current, total, (current / total) * 100)
                    // console.log(line)
                }
                const child3 = await command3.spawn()
                pids.push(child3.pid)
                command3.on('close', async () => {
                    precent2.value = 100
                    const total = formatTime(duration.value)
                    show2.value = false
                    const cmd4 = `${props.ffmpegPath}  -r ${fps.value} -i  ${props.basePath}/img_out/${fileName}/frame%08d.jpg -i  ${props.basePath}/input/${props.file} -map 0:v:0 -map 1:a:0 -c:a copy -c:v ${props.model} -r ${fps.value} -pix_fmt yuv420p ${props.basePath}/output/${props.file}`
                    console.log(cmd4)

                    const command4 = new Command('ffmpeg', ['/C', cmd4])
                    const child4 = await command4.spawn()
                    pids.push(child4.pid)
                    command4.on('close', () => {
                        // show3.value = false
                        emits('completed', props.file)
                    })
                    command4.on('error', (error) => {
                        console.log(error)
                    })
                    command4.stderr.on('data', throttle(fn, 200))
                    async function fn(data: string) {
                        /** 控制台的信息 */
                        const result = data.match(/(?<=time=).+(?= bitrate)/)
                        if (result) {
                            const current = formatTime(result[0])
                            console.log(current, total)

                            precent3.value = Math.round((current / total) * 100)
                        }
                    }
                })
            })
        }
    })
}
init()
</script>

<style scoped lang="scss">
.terminalBox {
    margin-top: 40px;
    background-color: #262626;
    border-radius: 9px;
    color: #fff;
    // padding: 20px 0;
    padding-bottom: 20px;
}
.file {
    padding: 0 20px;
}
.flex {
    display: flex;
    align-items: center;
}
.title {
    padding: 30px 0 20px 20px;
}
</style>
