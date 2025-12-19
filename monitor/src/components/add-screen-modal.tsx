"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ScreenSetting } from "./screen-settings-table"

interface AddScreenModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<ScreenSetting, "id">) => void
  editData?: ScreenSetting | null
}

export function AddScreenModal({ isOpen, onClose, onSubmit, editData }: AddScreenModalProps) {
  const [formData, setFormData] = useState({
    screenName: "",
    department: "",
    counterNumbers: "",
    displayMode: "แนวนอน",
    status: "เปิดใช้งาน",
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        screenName: editData.screenName,
        department: editData.department,
        counterNumbers: editData.counterNumbers,
        displayMode: editData.displayMode,
        status: editData.status,
      })
    } else {
      setFormData({
        screenName: "",
        department: "",
        counterNumbers: "",
        displayMode: "แนวนอน",
        status: "เปิดใช้งาน",
      })
    }
  }, [editData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      screenName: "",
      department: "",
      counterNumbers: "",
      displayMode: "แนวนอน",
      status: "เปิดใช้งาน",
    })
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
              className="glass rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
            >
              <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
                <X className="h-4 w-4" />
                <span className="sr-only">ปิด</span>
              </Button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/15 border border-primary/20">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{editData ? "แก้ไขการตั้งค่าหน้าจอ" : "เพิ่มหน้าจอใหม่"}</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="screenName" className="text-sm font-medium">
                    ชื่อหน้าจอ
                  </Label>
                  <Input
                    id="screenName"
                    value={formData.screenName}
                    onChange={(e) => setFormData({ ...formData, screenName: e.target.value })}
                    placeholder="เช่น หน้าจอห้องตรวจ 1"
                    required
                    className="glass h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    แผนก
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger className="glass h-11">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="อายุรกรรม">อายุรกรรม</SelectItem>
                      <SelectItem value="ศัลยกรรม">ศัลยกรรม</SelectItem>
                      <SelectItem value="กุมารเวชกรรม">กุมารเวชกรรม</SelectItem>
                      <SelectItem value="สูติ-นรีเวชกรรม">สูติ-นรีเวชกรรม</SelectItem>
                      <SelectItem value="ออร์โธปิดิกส์">ออร์โธปิดิกส์</SelectItem>
                      <SelectItem value="จักษุวิทยา">จักษุวิทยา</SelectItem>
                      <SelectItem value="โสต ศอ นาสิก">โสต ศอ นาสิก</SelectItem>
                      <SelectItem value="ทันตกรรม">ทันตกรรม</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="counterNumbers" className="text-sm font-medium">
                    หมายเลขเคาน์เตอร์
                  </Label>
                  <Input
                    id="counterNumbers"
                    value={formData.counterNumbers}
                    onChange={(e) => setFormData({ ...formData, counterNumbers: e.target.value })}
                    placeholder="เช่น 1-5 หรือ 1,3,5"
                    required
                    className="glass h-11 font-mono"
                  />
                  <p className="text-xs text-muted-foreground">ระบุหมายเลขเคาน์เตอร์ที่ต้องการแสดง</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayMode" className="text-sm font-medium">
                    โหมดแสดงผล
                  </Label>
                  <Select
                    value={formData.displayMode}
                    onValueChange={(value) => setFormData({ ...formData, displayMode: value })}
                  >
                    <SelectTrigger className="glass h-11">
                      <SelectValue placeholder="เลือกโหมดแสดงผล" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="แนวนอน">แนวนอน (Landscape)</SelectItem>
                      <SelectItem value="แนวตั้ง">แนวตั้ง (Portrait)</SelectItem>
                      <SelectItem value="เต็มจอ">เต็มจอ (Fullscreen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    สถานะ
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="glass h-11">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="เปิดใช้งาน">เปิดใช้งาน</SelectItem>
                      <SelectItem value="ปิดใช้งาน">ปิดใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 bg-transparent">
                    ยกเลิก
                  </Button>
                  <Button type="submit" className="flex-1 h-11">
                    {editData ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มหน้าจอ"}
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
