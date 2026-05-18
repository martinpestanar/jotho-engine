"use client"

import { type ReactNode } from "react"
import RouteGuard from "./RouteGuard"

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>
}
