import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface DraftMetadata {
    id: string
    user_id: string
    draft_data: any
    updated_at: string
}

export function useProductDraft<T = any>(currentData: T) {
    const supabase = useMemo(() => createClient(), [])
    const [hasDraft, setHasDraft] = useState(false)
    const [draftData, setDraftData] = useState<DraftMetadata | null>(null)
    const draftIdRef = useRef<string | null>(null)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const isRestoringRef = useRef(false)

    // Check for existing draft on mount
    useEffect(() => {
        const checkForDraft = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check Supabase for latest draft
            // Note: product_drafts table must be created via migration
            const { data, error } = await (supabase as any)
                .from('product_drafts')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data && !error) {
                // Found a draft
                setHasDraft(true)
                setDraftData(data as DraftMetadata)
                draftIdRef.current = data.id
            } else {
                // No draft found, start new session
                draftIdRef.current = globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`
            }
        }

        checkForDraft()
    }, [supabase])

    // Debounced save
    const saveDraft = useCallback(async (data: T) => {
        if (!draftIdRef.current || isRestoringRef.current) return

        // Don't save if data is empty/initial
        if (JSON.stringify(data) === JSON.stringify({})) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const draftPayload = {
                id: draftIdRef.current,
                user_id: user.id,
                draft_data: data,
                updated_at: new Date().toISOString()
            }

            const { error } = await (supabase as any)
                .from('product_drafts')
                .upsert(draftPayload)

            if (error) {
                console.error('Error saving draft:', error)
            } else {
                // Update local state to reflect latest save
                setDraftData(draftPayload as any)
            }

        } catch (error) {
            console.error('Error saving draft:', error)
        }
    }, [supabase])

    // Auto-save effect
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        // Only save if we have a draft ID (session started)
        // If hasDraft is true (banner showing), we DO NOT auto-save overwriting it 
        // until user either restores or discards (which sets hasDraft to false).

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
            setHasDraft(false) // Banner goes away
            // specific timeout to allow state to settle before resuming auto-saves
            setTimeout(() => { isRestoringRef.current = false }, 1000)
            toast.success("Draft restored")
        }
    }, [draftData])

    const discardDraft = useCallback(async () => {
        if (!draftIdRef.current) return

        try {
            await (supabase as any)
                .from('product_drafts')
                .delete()
                .eq('id', draftIdRef.current)

            setHasDraft(false)
            setDraftData(null)
            // Reset session ID
            draftIdRef.current = globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`
            toast.success("Draft discarded")
        } catch (error) {
            console.error("Error discarding draft", error)
        }
    }, [supabase])

    const clearDraft = useCallback(async () => {
        await discardDraft()
    }, [discardDraft])

    return {
        hasDraft,
        draftData,
        loadDraft,
        clearDraft,
        discardDraft
    }
}
