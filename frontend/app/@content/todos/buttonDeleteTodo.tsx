"use client"
import { deleteTodo } from "@/lib/actionsTodo"
import { redirect } from "next/navigation"
import { toast } from "sonner"

const todosRoute = "/todos"

export default function ButtonDeleteTodo({ id }: { id: string }) {
  const handleDelete = async () => {
    await deleteTodo(id)
    toast.success("Todo deleted successfully")
    redirect(todosRoute)
  }

  return <button onClick={handleDelete}>Delete</button>
}
