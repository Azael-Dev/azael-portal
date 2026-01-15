import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomePage from './views/HomePage.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/links/discord',
        name: 'Discord',
        component: { template: '<div></div>' },
        beforeEnter: () => {
            window.location.href = import.meta.env.VITE_DISCORD_URL
        }
    },
    {
        path: '/links/github',
        name: 'Github',
        component: { template: '<div></div>' },
        beforeEnter: () => {
            window.location.href = import.meta.env.VITE_GITHUB_URL
        }
    },
    {
        path: '/links/cfx-store',
        name: 'CFXStore',
        component: { template: '<div></div>' },
        beforeEnter: () => {
            window.location.href = import.meta.env.VITE_CFX_STORE_URL
        }
    },
    {
        path: '/links/cfx-bandb',
        name: 'BanDB',
        component: { template: '<div></div>' },
        beforeEnter: () => {
            window.location.href = import.meta.env.VITE_BAN_DB_URL
        }
    },
    {
        path: '/links/docs',
        name: 'Docs',
        component: { template: '<div></div>' },
        beforeEnter: () => {
            window.location.href = import.meta.env.VITE_DOCS_URL
        }
    },
    {
        path: '/links/status',
        name: 'Status',
        component: { template: '<div></div>' },
        beforeEnter: () => {
            window.location.href = import.meta.env.VITE_STATUS_URL
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.isReady().then(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');

    if (redirectPath) {
        sessionStorage.removeItem('redirectPath');
        router.replace(redirectPath);
    }
});

export default router
