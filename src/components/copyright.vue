<template>
    <h2 class="copyright">Copyright</h2>
    <div>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本软件使用了基于GPL协议的 ffmpeg 和基于BSD协议的 Real-ESRGAN,
        两个均是开源可商用。本软件是开源免费, 非商用, 仅供学习和日常使用。软件没有任何联网程序, 没有任何读取隐私的程序。
    </div>
    <div>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本软件允许二次开发商用, 但是本作者不对二次开发的软件承担任何后果。
    </div>
    <p style="margin-top: 20px">@本项目地址: https://github.com/Minori-ty/mp4To4K-rust</p>
    <p>@ffmpeg项目地址: https://github.com/FFmpeg/FFmpeg</p>
    <p>@Real-ESRGAN项目地址: https://github.com/xinntao/Real-ESRGAN</p>
    <p style="margin: 20px 0; text-align: center">如果这个软件对你有帮助, 可以请作者喝杯咖啡。</p>
    <div class="wechar">
        <img src="../assets/二维码.png" alt="" />
    </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
* {
    color: #fff;
}
.copyright {
    margin-bottom: 20px;
}
p {
    line-height: 30px;
}
.wechar {
    display: flex;
    justify-content: center;
}
</style>
