/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// Vanta.js types
interface VantaWavesOptions {
    el: string | HTMLElement
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    scale?: number
    scaleMobile?: number
    color?: number
    waveSpeed?: number
}

interface VantaEffect {
    destroy: () => void
}

interface VANTA {
    WAVES: (options: VantaWavesOptions) => VantaEffect
}

declare const VANTA: VANTA

// Magic Snowflakes types
interface SnowflakesOptions {
    color?: string
    count?: number
    maxSize?: number
    minSize?: number
    speed?: number
    wind?: boolean
    zIndex?: number
}

declare class Snowflakes {
    constructor(options?: SnowflakesOptions)
    destroy(): void
    start(): void
    stop(): void
}
