"use client"

import { create } from 'zustand'

interface ConfirmOptions {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

interface ConfirmState {
    isOpen: boolean
    options: ConfirmOptions | null
    resolve: ((value: boolean) => void) | null
    confirm: (options: ConfirmOptions) => Promise<boolean>
    handleConfirm: () => void
    handleCancel: () => void
}

export const useConfirmDialog = create<ConfirmState>((set, get) => ({
    isOpen: false,
    options: null,
    resolve: null,

    confirm: (options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            set({
                isOpen: true,
                options,
                resolve,
            })
        })
    },

    handleConfirm: () => {
        const { resolve } = get()
        if (resolve) {
            resolve(true)
        }
        set({ isOpen: false, options: null, resolve: null })
    },

    handleCancel: () => {
        const { resolve } = get()
        if (resolve) {
            resolve(false)
        }
        set({ isOpen: false, options: null, resolve: null })
    },
}))
