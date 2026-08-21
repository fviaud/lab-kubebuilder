"use client"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import type { z } from "zod"

type MutationResult = { error?: string | null }

type UseFormSubmitOptions<S extends z.ZodType> = {
  schema: S
  action: (data: z.infer<S>) => Promise<MutationResult>
  successMessage: string
  loadingMessage?: string
  onSuccess?: () => void
}

export function useFormSubmit<S extends z.ZodType>({
  schema,
  action,
  successMessage,
  loadingMessage = "Saving...",
  onSuccess,
}: UseFormSubmitOptions<S>) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: unknown) {
    setError(null)

    const fail = (message: string, toastId?: string | number) => {
      setError(message)
      toast.error(message, toastId ? { id: toastId } : undefined)
    }

    const result = schema.safeParse(formData)
    if (!result.success) {
      fail("Validation error: " + result.error.message)
      return
    }

    startTransition(async () => {
      const toastId = toast.loading(loadingMessage)
      try {
        const { error } = await action(result.data)
        if (error) {
          fail(error, toastId)
          return
        }
        toast.success(successMessage, { id: toastId })
        onSuccess?.()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error submitting form"
        fail(message, toastId)
      }
    })
  }

  return { submit, isPending, error }
}
