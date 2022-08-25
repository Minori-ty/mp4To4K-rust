import { createWebHashHistory, createRouter } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import('../components/home.vue'),
        },
        {
            path: '/copyright',
            component: () => import('../components/copyright.vue'),
        },
    ],
})

export default router
