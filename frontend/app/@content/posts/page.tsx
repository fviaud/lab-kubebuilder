import { fetchApi } from "@/lib/api"
import { Post } from "@/models/post.model"
export const dynamic = "force-dynamic"

export default async function Page() {
  const apiUrl = "https://jsonplaceholder.typicode.com/"
  const apiItems = "posts"

  const items = await fetchApi<Post[]>(`${apiUrl}/${apiItems}`)

  if (items.length === 0) {
    return <p>No items found.</p>
  }

  return (
    <ul>
      {items.map((item: Post) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  )
}
