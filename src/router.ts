import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomePage from './views/HomePage.vue'
import TebexCallbackView from './views/TebexCallbackView.vue'

interface LinkConfig {
    path: string
    name: string
    envKey: keyof ImportMetaEnv
}

const linkConfigs: LinkConfig[] = [
    // Internal Links
    { path: 'cfx-store', name: 'CFXStore', envKey: 'VITE_CFX_STORE_URL' },
    { path: 'cfx-bandb', name: 'BanDB', envKey: 'VITE_BAN_DB_URL' },
    { path: 'docs', name: 'Docs', envKey: 'VITE_DOCS_URL' },
    { path: 'status', name: 'Status', envKey: 'VITE_STATUS_URL' },
    // External Links
    { path: 'discord', name: 'Discord', envKey: 'VITE_DISCORD_URL' },
    { path: 'github', name: 'Github', envKey: 'VITE_GITHUB_URL' },
]

const createRedirectRoute = (config: LinkConfig): RouteRecordRaw => ({
    path: `/links/${config.path}`,
    name: config.name,
    component: { template: '<div></div>' },
    beforeEnter: () => {
        window.location.href = import.meta.env[config.envKey]
    }
})

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/callback/cfx-tebex-basket-auth',
        name: 'TebexBasketAuth',
        component: TebexCallbackView
    },
    ...linkConfigs.map(createRedirectRoute),
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
