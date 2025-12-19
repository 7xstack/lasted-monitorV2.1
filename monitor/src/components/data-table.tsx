"use client"

import { motion } from "framer-motion"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface DataItem {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface DataTableProps {
  data: DataItem[]
  onEdit: (item: DataItem) => void
  onDelete: (id: string) => void
}

export function DataTable({ data, onEdit, onDelete }: DataTableProps) {
  return (
    <div className="glass rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">ชื่อ</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">อีเมล</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">ตำแหน่ง</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">สถานะ</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-foreground">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/30 hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{item.email}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{item.role}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === "ใช้งาน" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">แก้ไข</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">ลบ</span>
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
