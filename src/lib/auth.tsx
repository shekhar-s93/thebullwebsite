import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, ready: false });

/** Single auth listener for the app: keeps the session fresh and refreshes data on sign-in/out. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthContextValue>({ session: null, ready: false });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data: { session } }) => setState({ session, ready: true }));
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
