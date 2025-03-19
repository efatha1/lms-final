import { createContext, PropsWithChildren, useContext, useEffect, useLayoutEffect, useState } from "react";
import { FineClient, User } from "@fine-dev/fine-js";
import { fine } from "@/lib/fine";

type FineContextValue = {
  /** Available if the user is authenticated */
  user: User | null;
  /** Indicates that authentication state has been loaded */
  authLoaded: boolean;
};

export const initialFineContext: FineContextValue = { user: null, authLoaded: false };
const FineContext = createContext(initialFineContext);

export const useFine = () => useContext(FineContext);

/**
 * If you have a `FineClient` set up, this provider will provide the client for use in the app, as well as load the authenticated user into the context.
 */
export const FineProvider = ({ children }: PropsWithChildren) => {
  const [context, setContext] = useState(initialFineContext);

  useLayoutEffect(() => {
    const listener = fine?.auth.onAuthStateChange(async (_, session) => {
      setContext((state) => ({ ...state, user: session?.user ?? null, authLoaded: true }));
    });

    return () => listener?.data.subscription?.unsubscribe();
  }, []);

  return <FineContext.Provider value={context}>{children}</FineContext.Provider>;
};
