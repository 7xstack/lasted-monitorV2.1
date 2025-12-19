"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DataItem } from "./data-table"

interface AddDataModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<DataItem, "id">) => void
  editData?: DataItem | null
}

export function AddDataModal({ isOpen, onClose, onSubmit, editData }: AddDataModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "ใช้งาน",
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        email: editData.email,
        role: editData.role,
        status: editData.status,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "",
        status: "ใช้งาน",
      })
    }
  }, [editData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: "", email: "", role: "", status: "ใช้งาน" })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            >
              <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
                <X className="h-4 w-4" />
                <span className="sr-only">ปิด</span>
              </Button>

              <h2 className="text-2xl font-bold text-foreground mb-6">{editData ? "แก้ไขข้อมูล" : "เพิ่มข้อมูลใหม่"}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="กรอกชื่อ"
                    required
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="กรอกอีเมล"
                    required
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">ตำแหน่ง</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="กรอกตำแหน่ง"
                    required
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ใช้งาน">ใช้งาน</SelectItem>
                      <SelectItem value="ไม่ใช้งาน">ไม่ใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                    ยกเลิก
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editData ? "อัปเดต" : "เพิ่ม"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
