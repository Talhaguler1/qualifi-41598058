import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { identityFrom, type AppIdentity } from "@/lib/accounts";
import { setDemoAuthToken } from "@/lib/demo/track";

export type SessionState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; session: Session; identity: AppIdentity; email: string };

/** Current Supabase session plus the role read from server-managed app_metadata. */
export function useAppSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  useEffect(() => {
    const apply = (session: Session | null) => {
      setDemoAuthToken(session?.access_token ?? null);
      if (!session) {
        setState({ status: "signed_out" });
        return;
      }
      const user = session.user;
      setState({
        status: "signed_in",
        session,
        email: user.email ?? "",
        identity: identityFrom(user.app_metadata as Record<string, unknown>, Boolean(user.email_confirmed_at)),
      });
    };
    void supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: Supabase recommends not awaiting inside this callback.
      setTimeout(() => apply(session), 0);
    });
    return () => {
      data.subscription.unsubscribe();
      setDemoAuthToken(null);
    };
  }, []);
  return state;
}

export function AccountChip({ email }: { email: string }) {
  return (
    <span className="qd-account">
      <span className="qd-account__email" title={email}>{email}</span>
      <button
        type="button"
        className="qd-btn qd-btn--ghost qd-btn--sm"
        onClick={() => {
          void supabase.auth.signOut().then(() => window.location.assign("/app/giris"));
        }}
        aria-label="Çıkış yap"
        title="Çıkış yap"
      >
        <LogOut size={14} />
      </button>
    </span>
  );
}
