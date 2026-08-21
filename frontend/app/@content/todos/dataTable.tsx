import { Todo } from "@/models/todo.model"
import Link from "next/link"
import ButtonDeleteTodo from "./buttonDeleteTodo"
import Menu from "./menu"

export default async function DataTable({ items }: { items: Todo[] }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Menu />
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul>
            {items.map((item: Todo) => (
              <li key={item.id} className="flex flex-row justify-between gap-2">
                <div className="flex flex-row gap-2">
                  <span>{item.title}</span>
                  <span>{item.completed ? " (Completed)" : " (Pending)"}</span>
                </div>
                <div className="flex flex-row gap-2">
                  <Link
                    href={`/todos/${item.id}/edit`}
                    prefetch={false}
                    style={{ marginLeft: "10px" }}
                  >
                    Edit
                  </Link>
                  <ButtonDeleteTodo id={item.id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
