import { fetchApi } from "@/lib/api"
import { User } from "@/models/users.model"
export const dynamic = "force-dynamic"

export default async function Page() {
  
  const apiUrl = process.env.API_URL_JSONPLACEHOLDER || "http://JSONPlaceholder"
  const apiItems = process.env.API_ITEMS_JSONPLACEHOLDER_USERS || "items"
  const items = await fetchApi<User[]>(`${apiUrl}/${apiItems}`)

  if (items.length === 0) {
    return <p>No items found.</p>
  }

  return (
    <ul>
      {items.map((item: User) => (
        <li key={item.id}>{item.name} {item.email}</li>
      ))}
    </ul>
  )
}
