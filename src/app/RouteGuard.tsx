"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"
import { useEconomyStore } from "@/store/useEconomyStore"
import { supabase } from "@/shared/lib/supabase/client"

interface Props {
  children: ReactNode
}

/**
 * RouteGuard — enforces the daily flow and authentication:
 *   /login, /auth/callback → allowed always
 *   /onboarding → only if authenticated
 *   /oracle → only if authenticated
 *   /dashboard, /play → only if authenticated + check-in completed
 */
export default function RouteGuard({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  const { hasCompletedDailyCheckIn, hasCompletedOnboarding, dailyPlayTimeRemaining, resetDailyIfNeeded, completeOnboarding, completeCheckIn } =
    useAppStore()

  // 1. Check Auth Session & Subscribe to Economy
  useEffect(() => {
    let econCleanup: (() => void) | undefined

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setIsReady(true)
      
      if (session?.user?.id) {
        econCleanup = useEconomyStore.getState().subscribe(session.user.id)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      if (econCleanup) {
        econCleanup()
        econCleanup = undefined
      }
      if (session?.user?.id) {
        econCleanup = useEconomyStore.getState().subscribe(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (econCleanup) econCleanup()
    }
  }, [])

  // 2. Reset daily state if needed
  useEffect(() => {
    if (isReady && isAuthenticated) resetDailyIfNeeded()
  }, [isReady, isAuthenticated, resetDailyIfNeeded])

  // 3. Navigation Logic
  useEffect(() => {
    if (!isReady || isAuthenticated === null) return

    const publicRoutes = ["/login", "/auth/callback"]
    if (publicRoutes.includes(pathname)) return

    // If not authenticated, go to login
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (pathname === "/onboarding") return
    if (pathname === "/oracle") return

    // Onboarding check (background, non-blocking)
    const checkOnboardingInDB = async () => {
      if (hasCompletedOnboarding) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("user_status")
        .select("is_onboarding_completed")
        .eq("user_id", user.id)
        .single()
      if (!error && data?.is_onboarding_completed) completeOnboarding()
    }
    checkOnboardingInDB()

    // Bypass flags
    const urlBypass = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('bypass') === 'true' : false
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      process.env.NODE_ENV === 'development'
    )
    const isDevBypass = urlBypass || (isLocal && localStorage.getItem('dev_bypass_checkin') !== 'false')

    if (isDevBypass) {
      // Dev bypass — allow access, check play time only
      if (pathname === "/play" && dailyPlayTimeRemaining <= 0) {
        router.replace("/dashboard")
      }
      return
    }

    // Check-in: store in memory first (instant), then DB as fallback
    if (hasCompletedDailyCheckIn) {
      if (pathname === "/play" && dailyPlayTimeRemaining <= 0) {
        router.replace("/dashboard")
      }
      return
    }

    // Async DB check — did the user complete their check-in today?
    const verifyCheckInInDB = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/oracle")
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from("daily_scores")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle()

      if (data) {
        // Check-in de hoy existe en DB → sincronizar store y dejar pasar
        completeCheckIn()
      } else {
        // No hay check-in hoy → ir al oracle
        router.replace("/oracle")
      }
    }

    verifyCheckInInDB()
  }, [isReady, isAuthenticated, pathname, hasCompletedOnboarding, hasCompletedDailyCheckIn, dailyPlayTimeRemaining, router, completeOnboarding, completeCheckIn, resetDailyIfNeeded])

  // Show loading while deciding
  if (!isReady || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-joycon-cyan/20 border-t-joycon-cyan rounded-full animate-spin" />
      </div>
    )
  }

  // Prevent flash of content if redirecting
  const publicRoutes = ["/login", "/auth/callback"]
  if (!isAuthenticated && !publicRoutes.includes(pathname)) return null

  return <>{children}</>
}
