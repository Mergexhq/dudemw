"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"

export function ConfirmDialog() {
    const { isOpen, options, handleConfirm, handleCancel } = useConfirmDialog()

    if (!options) return null

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{options.title}</AlertDialogTitle>
                    <AlertDialogDescription>{options.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>
                        {options.cancelText || "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            options.variant === "destructive"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : ""
                        }
                    >
                        {options.confirmText || "Confirm"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
