import React, { useState, createContext, useContext } from "react"
import { motion } from "framer-motion"

const SidebarContext = createContext(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within SidebarProvider")
  return context
}

export const SidebarProvider = ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState
  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = ({ children, open, setOpen, animate }) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
)

export const SidebarBody = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={`h-full flex flex-col bg-[#171412] border-r border-[#2E2A27] flex-shrink-0 overflow-hidden ${className || ""}`}
      animate={{ width: animate ? (open ? "220px" : "80px") : "220px" }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
