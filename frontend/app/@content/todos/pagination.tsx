import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"

type Props = {
  total: number
  page: number
  pageSize: number
  currentPage: number
}

export default function PaginationSimple({
  total,
  pageSize,
  currentPage,
}: Props) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <Pagination>
      <PaginationContent>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PaginationItem key={p}>
            <PaginationLink href={`?page=${p}`} isActive={p === currentPage}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  )
}
