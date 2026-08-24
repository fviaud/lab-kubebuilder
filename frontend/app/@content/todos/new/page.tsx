"use client"
import { createTodo } from "@/lib/actionsTodo"
import { TodoCreateSchema } from "@/models/todo.model"
import { useRouter } from "next/navigation"
import TodoForm from "../todoForm"

const pathRoot = "/todos"

export default function Page() {
  const router = useRouter()

  return (
    <TodoForm
      schema={TodoCreateSchema}
      action={createTodo}
      successMessage="Todo created successfully!"
      onCancel={() => router.push(pathRoot)}
      onSuccess={() => router.push(pathRoot)}
    />
  )
}
