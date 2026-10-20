import { useCallback, useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "../firebase"
import { MISSING_CONFIG } from "../lib/errors"
import { AuthContext } from "./authContext"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) return undefined

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      },
      (error) => {
        console.error("Feil i innloggingstilstanden:", error)
        setLoading(false)
      },
    )
  }, [])

  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error(MISSING_CONFIG)
    return signInWithEmailAndPassword(auth, email, password)
  }, [])

  const logout = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
