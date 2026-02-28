import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

export interface DraftMetadata {
    id: string
    user_id: string
    draft_data: any
    updated_at: string
}

export function useProductDraft<T = any>(currentData: T) {
    const { userId, isSignedIn } = useAuth()
    const [hasDraft, setHasDraft] = useState(false)
    const [draftData, setDraftData] = useState<DraftMetadata | null>(null)
    const draftIdRef = useRef<string | null>(null)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const isRestoringRef = useRef(false)

    // Check for existing draft on mount
    useEffect(() => {
        const checkForDraft = async () => {
            if (!isSignedIn || !userId) return

            try {
                const response = await fetch('/api/admin/product-drafts/latest')
                if (!response.ok) return
                const data = await response.json()

                if (data && data.id) {
                    setHasDraft(true)
                    setDraftData(data as DraftMetadata)
                    draftIdRef.current = data.id
                } else {
                    draftIdRef.current = globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`
                }
            } catch (err) {
                draftIdRef.current = globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`
            }
        }

        checkForDraft()
    }, [isSignedIn, userId])

    // Debounced save via server action / API
    const saveDraft = useCallback(async (data: T) => {
        if (!draftIdRef.current || isRestoringRef.current || !isSignedIn) return
        if (JSON.stringify(data) === JSON.stringify({})) return

        try {
            const response = await fetch('/api/admin/product-drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: draftIdRef.current, draft_data: data }),
            })
            if (response.ok) {
                const saved = await response.json()
                setDraftData(saved)
            }
        } catch (error) {
            console.error('Error saving draft:', error)
        }
    }, [isSignedIn])

    // Auto-save effect
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        if (draftIdRef.current && !hasDraft) {
            saveTimeoutRef.current = setTimeout(() => {
                saveDraft(currentData)
            }, 2000)
        }

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        }
    }, [currentData, saveDraft, hasDraft])

    const loadDraft = useCallback((onLoad: (data: T) => void) => {
        if (draftData && draftData.draft_data) {
            isRestoringRef.current = true
            onLoad(draftData.draft_data)
            setHasDraft(false)
            setTimeout(() => { isRestoringRef.current = false }, 1000)
            toast.success("Draft restored")
        }
    }, [draftData])

    const discardDraft = useCallback(async () => {
        if (!draftIdRef.current) return

        try {
            await fetch(`/api/admin/product-drafts/${draftIdRef.current}`, { method: 'DELETE' })
            setHasDraft(false)
            setDraftData(null)
            draftIdRef.current = globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`
            toast.success("Draft discarded")
        } catch (error) {
            console.error("Error discarding draft", error)
        }
    }, [])

    const clearDraft = useCallback(async () => {
        await discardDraft()
    }, [discardDraft])

    return { hasDraft, draftData, loadDraft, clearDraft, discardDraft }
}
