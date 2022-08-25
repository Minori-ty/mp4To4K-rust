/**
 * @description  将字符串的时间转成总秒数的时间 00:04:35
 * @param time   字符串的时间
 * @returns      返回秒数的时间
 */
export function formatTime(time: string) {
    const hours = Number(time.split(':')[0])
    const mimutes = Number(time.split(':')[1])
    const seconds = Number(time.split(':')[2])
    return hours * 60 * 60 + mimutes * 60 + seconds
}
