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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteTodo } from "@/lib/actionsTodo"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

const todosRoute = "/todos"

export default function ButtonDeleteTodo({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const { success, error } = await deleteTodo(id)

      if (!success) {
        toast.error(error || "Failed to delete todo")
        return
      }

      toast.success("Todo deleted successfully")
      router.push(todosRoute)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={isPending}>
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this todo?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This todo will be permanently
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
