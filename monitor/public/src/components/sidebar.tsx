"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Monitor, Building2, Users, Settings, History, Menu, X, ChevronRight, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "หน้าจอแสดงผล",
    icon: Monitor,
    href: "/",
    description: "จัดการหน้าจอเรียกคิว",
  },
  {
    title: "แผนก",
    icon: Building2,
    href: "/departments",
    description: "จัดการแผนกต่างๆ",
  },
  {
    title: "เคาน์เตอร์",
    icon: Users,
    href: "/counters",
    description: "จัดการเคาน์เตอร์บริการ",
  },
  {
    title: "การตั้งค่าทั่วไป",
    icon: Settings,
    href: "/settings",
    description: "ตั้งค่าระบบ",
  },
  {
    title: "ประวัติการใช้งาน",
    icon: History,
    href: "/history",
    description: "ดูประวัติการใช้งาน",
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden glass"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-screen w-72 glass border-r border-border/50 z-40 lg:translate-x-0 lg:static"
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo/Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 mt-12 lg:mt-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">ระบบเรียกคิว</h2>
                <p className="text-xs text-muted-foreground">โรงพยาบาล</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "hover:bg-accent/50 text-foreground"
                      }
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? "" : "text-muted-foreground group-hover:text-foreground"}`}
                    />
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? "" : ""}`}>{item.title}</p>
                      <p className={`text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {item.description}
                      </p>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-auto pt-6 border-t border-border/50"
          >
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">พยาบาล</p>
                  <p className="text-xs text-muted-foreground">ผู้ดูแลระบบ</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  )
}
