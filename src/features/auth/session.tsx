import type { Session } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { supabase } from '@/lib/supabase'
import { wipeLocalData } from '@/lib/wipe'
import {
  cachedMemberships,
  fetchMemberships,
  type Membership,
  pickActive,
  type Role,
  storeActiveOrganizationId,
  storedActiveOrganizationId,
} from './memberships'

const lastEmailKey = 'last_user_email'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | {
      status: 'signedIn'
      session: Session
      memberships: Membership[]
      activeOrganizationId: string | null
    }

type SessionContext = {
  state: AuthState
  /** Reloads `my_memberships()`; offline it keeps the cached list. */
  refreshMemberships: () => Promise<Membership[]>
  setActiveOrganization: (id: string) => Promise<void>
}

const Context = createContext<SessionContext | null>(null)

export const lastSignedInEmail = () => SecureStore.getItemAsync(lastEmailKey)

async function loadMemberships(): Promise<Membership[]> {
  try {
    return await fetchMemberships()
  } catch {
    return cachedMemberships()
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const userId = useRef<string | null>(null)

  const enter = useCallback(async (session: Session, isNewSignIn: boolean) => {
    userId.current = session.user.id
    const email = session.user.email ?? ''
    if (isNewSignIn) {
      // Data kept after an expired session belongs to the previous person; another account starts clean.
      const previous = await SecureStore.getItemAsync(lastEmailKey)
      if (previous && previous !== email) await wipeLocalData()
      await SecureStore.setItemAsync(lastEmailKey, email)
    }
    const memberships = isNewSignIn ? await loadMemberships() : await cachedMemberships()
    const activeOrganizationId = pickActive(memberships, await storedActiveOrganizationId())
    setState({ status: 'signedIn', session, memberships, activeOrganizationId })
    if (!isNewSignIn) {
      const fresh = await loadMemberships()
      setState((s) =>
        s.status === 'signedIn'
          ? {
              ...s,
              memberships: fresh,
              activeOrganizationId: pickActive(fresh, s.activeOrganizationId),
            }
          : s,
      )
    }
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // supabase-js warns against awaiting its own calls inside this callback.
      setTimeout(() => {
        if (!session) {
          userId.current = null
          return setState({ status: 'signedOut' })
        }
        if (userId.current !== session.user.id) {
          return void enter(session, event !== 'INITIAL_SESSION')
        }
        // Token refreshes and repeated SIGNED_IN events only swap the session.
        setState((s) => (s.status === 'signedIn' ? { ...s, session } : s))
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [enter])

  const refreshMemberships = useCallback(async () => {
    const memberships = await loadMemberships()
    setState((s) =>
      s.status === 'signedIn'
        ? {
            ...s,
            memberships,
            activeOrganizationId: pickActive(memberships, s.activeOrganizationId),
          }
        : s,
    )
    return memberships
  }, [])

  const setActiveOrganization = useCallback(async (id: string) => {
    await storeActiveOrganizationId(id)
    setState((s) => (s.status === 'signedIn' ? { ...s, activeOrganizationId: id } : s))
  }, [])

  return (
    <Context.Provider value={{ state, refreshMemberships, setActiveOrganization }}>
      {children}
    </Context.Provider>
  )
}

export function useSession(): SessionContext {
  const context = useContext(Context)
  if (!context) throw new Error('useSession outside SessionProvider')
  return context
}

/** Role in the active finca; the UI hides what RLS would refuse, the server still decides. */
export function useRole(): Role | null {
  const { state } = useSession()
  if (state.status !== 'signedIn') return null
  return (
    state.memberships.find((m) => m.organization_id === state.activeOrganizationId)?.role ?? null
  )
}

/** Explicit sign-out: server first (needs signal), then the local data of this person. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  await wipeLocalData()
}
