import { fetchApi } from "@/lib/api"
import { PostSchema } from "@/models/post.model"
import { z } from "zod"

export const dynamic = "force-dynamic"

const apiUrl = process.env.API_URL_JSONPLACEHOLDER || "http://JSONPlaceholder"
const apiItems = process.env.API_ITEMS_JSONPLACEHOLDER_POSTS || "items"

export default async function Page() {
  let items
  try {
    const raw = await fetchApi<unknown>(`${apiUrl}/${apiItems}`)
    items = z.array(PostSchema).parse(raw)
  } catch (error) {
    throw new Error(
      `Unable to load posts: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
  }

  if (items.length === 0) {
    return <p>No items found.</p>
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  )
}
