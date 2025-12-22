"use client"

import { motion } from "framer-motion"
import { Edit, Trash2, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ScreenSetting {
  id: string
  screenName: string
  department: string
  counterNumbers: string
  displayMode: string
  status: string
}

interface ScreenSettingsTableProps {
  data: ScreenSetting[]
  onEdit: (item: ScreenSetting) => void
  onDelete: (id: string) => void
}

export function ScreenSettingsTable({ data, onEdit, onDelete }: ScreenSettingsTableProps) {
  return (
    <div className="glass rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-primary/5">
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">ชื่อหน้าจอ</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">แผนก</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">เคาน์เตอร์</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">โหมดแสดงผล</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">สถานะ</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-foreground">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/30 hover:bg-primary/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/15 border border-primary/20">
                      <Monitor className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.screenName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{item.department}</td>
                <td className="px-6 py-4 text-sm text-foreground font-mono">{item.counterNumbers}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{item.displayMode}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "เปิดใช้งาน"
                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">แก้ไข</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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
