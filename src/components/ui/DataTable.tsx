// src/components/ui/DataTable.tsx
import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"
import { Loader } from "@/components/ui/Loader"
import { Inbox } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  align?: "left" | "center" | "right"
  className?: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucun élément à afficher pour le moment.",
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <Loader />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 overflow-hidden">
      {/* Table view for Desktop/Tablet */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap font-medium text-muted-foreground",
                      alignClass[col.align ?? "left"],
                      col.className,
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(alignClass[col.align ?? "left"], col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : ((row as Record<string, any>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Card view for Mobile */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {data.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "rounded-xl border border-border bg-card p-4 transition-colors",
              onRowClick && "active:bg-accent cursor-pointer"
            )}
          >
            <div className="space-y-4">
              {columns.map((col) => (
                <div key={col.key} className="flex flex-col gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {col.header}
                  </span>
                  <div className={cn("text-sm font-semibold text-foreground", col.className)}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, any>)[col.key] ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
