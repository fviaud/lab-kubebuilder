"use client"
import { updateTodo } from "@/lib/actionsTodo"
import { TodoSchema, TodoUpdateSchema } from "@/models/todo.model"
import { useRouter } from "next/navigation"
import * as z from "zod"
import TodoForm from "../../todoForm"

function pick<T, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K
): Pick<T, K[number]> {
  return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<
    T,
    K[number]
  >
}

export default function Page({ item }: { item: z.infer<typeof TodoSchema> }) {
  const router = useRouter()

  const initialData = item.id
    ? pick(item, Object.keys(TodoUpdateSchema.shape) as (keyof typeof item)[])
    : {}

  return (
    <TodoForm
      schema={TodoUpdateSchema}
      action={(formData) =>
        updateTodo({
          ...formData,
          ...(item.id ? { id: item.id } : {}),
        })
      }
      successMessage="Updated successfully!"
      initialData={initialData}
      onCancel={() => router.back()}
      onSuccess={() => router.back()}
    />
  )
}
