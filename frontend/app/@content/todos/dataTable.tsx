"use client"

import { useState, useTransition } from "react"
import { Todo } from "@/models/todo.model"
import Link from "next/link"
import Menu from "./menu"
import { deleteTodo } from "@/lib/actionsTodo"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

function TodoActions({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const { success, error } = await deleteTodo(id)

      if (!success) {
        toast.error(error || "Failed to delete todo")
        return
      }

      toast.success("Todo deleted successfully")
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open todo actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/todos/${id}/edit`} prefetch={false}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive" disabled={isPending}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this todo?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This todo will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function DataTable({ items }: { items: Todo[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const allSelected = selectedIds.length === items.length

  const toggleSelection = (id: string, checked: boolean | "indeterminate") => {
    setSelectedIds((current) =>
      checked === true
        ? [...current, id]
        : current.filter((selectedId) => selectedId !== id)
    )
  }

  const toggleAll = (checked: boolean | "indeterminate") => {
    setSelectedIds(checked === true ? items.map((item) => item.id) : [])
  }

  const handleDeleteSelected = () => {
    startTransition(async () => {
      const results = await Promise.all(selectedIds.map((id) => deleteTodo(id)))
      const failed = results.find((result) => !result.success)

      if (failed) {
        toast.error(failed.error || "Failed to delete selected todos")
        return
      }

      toast.success("Selected todos deleted successfully")
      setSelectedIds([])
      router.refresh()
    })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Menu />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              disabled={selectedIds.length === 0 || isPending}
            >
              {isPending ? "Deleting..." : `Delete selected (${selectedIds.length})`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected todos?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected todos will be permanently
                removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDeleteSelected}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all todos"
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: Todo) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${item.title}`}
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) => toggleSelection(item.id, checked)}
                  />
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.completed ? "Completed" : "Pending"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <TodoActions id={item.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
