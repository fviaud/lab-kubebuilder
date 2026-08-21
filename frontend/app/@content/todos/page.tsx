import { getTodos } from "@/lib/actionsTodo"
import { Todo } from "@/models/todo.model"
import DataTable from "./dataTable"
import Pagination from "./pagination"

type TodoResponse = {
  items: Todo[]
  total: number
  page: number
  pageSize: number
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 10)
  const query = `?page=${currentPage}&pageSize=${pageSize}`
  const data = (await getTodos({ query })) as TodoResponse
  const { items, ...rest } = data

  return (
    <>
      <DataTable items={items} />
      <Pagination {...rest} currentPage={currentPage} />
    </>
  )
}
