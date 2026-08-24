import { fetchApi } from "@/lib/api"
import { UserSchema } from "@/models/users.model"
import { z } from "zod"

export const dynamic = "force-dynamic"

const apiUrl = process.env.API_URL_JSONPLACEHOLDER || "http://JSONPlaceholder"
const apiItems = process.env.API_ITEMS_JSONPLACEHOLDER_USERS || "items"

export default async function Page() {
  let items
  try {
    const raw = await fetchApi<unknown>(`${apiUrl}/${apiItems}`)
    items = z.array(UserSchema).parse(raw)
  } catch (error) {
    throw new Error(
      `Unable to load users: ${
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
        <li key={item.id}>
          {item.name} {item.email}
        </li>
      ))}
    </ul>
  )
}
