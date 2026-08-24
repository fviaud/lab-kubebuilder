"use server"
import { fetchApi, mutateApi } from "@/lib/api"
import { Todo, TodoCreateSchema, TodoUpdateSchema } from "@/models/todo.model"
import { revalidatePath } from "next/cache"

const pathRoot = "/todos"

const apiUrl = process.env.API_URL || "http://backend"
const apiVersion = process.env.API_VERSION || "v2"
const apiItems = "todos"

const todosPath = `${apiUrl}/api/${apiVersion}/${apiItems}`

const getTodoPath = (id?: string) => (id ? `${todosPath}/${id}` : todosPath)

type TodoResponse = {
  items: Todo[]
  total: number
  page: number
  pageSize: number
}

export async function getTodos({ query }: { query?: string } = {}) {
  return fetchApi<TodoResponse>(`${getTodoPath()}${query}`)
}

export async function getTodo(id: string) {
  try {
    const todo = await fetchApi<Todo>(getTodoPath(id))
    return todo
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error")
  }
}

export async function createTodo(data: Record<string, unknown>) {
  const parsed = TodoCreateSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form data",
    }
  }

  const { error } = await mutateApi(getTodoPath(), "POST", parsed.data)

  if (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  revalidatePath(pathRoot)
  return { success: true, error: null }
}

export async function updateTodo(data: Record<string, unknown>) {
  const idValue = data.id as string | undefined
  if (typeof idValue !== "string") {
    return {
      success: false,
      error: "ID is required for updating a todo",
    }
  }

  const parsed = TodoUpdateSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form data",
    }
  }

  const { error } = await mutateApi(getTodoPath(idValue), "PUT", parsed.data)
  if (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
  revalidatePath(pathRoot)
  return { success: true, error: null }
}

export async function deleteTodo(id: string) {
  const { error } = await mutateApi(getTodoPath(id), "DELETE")
  if (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
  revalidatePath(pathRoot)
  return { success: true, error: null }
}
