<template>
    <div class="terminalBox">
        <div class="flex">
            <img class="icon" src="../assets/视频.svg" alt="" />
            <span class="file">{{ props.fileName }}</span
            ><el-progress :percentage="100" style="flex: 1" />
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    fileName: string
}>()
</script>

<style scoped lang="scss">
.terminalBox {
    margin-top: 20px;
    background-color: #262626;
    border-radius: 9px;
    color: #fff;
    padding: 20px 0;
}
.file {
    padding: 0 20px;
}
.flex {
    display: flex;
    align-items: center;
}
.title {
    padding: 20px 0 40px 20px;
}
.icon {
    width: 40px;
    margin: 0px 0 0 20px;
}
</style>
