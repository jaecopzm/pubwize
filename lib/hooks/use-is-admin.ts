import { useUser } from "@clerk/nextjs";

export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const isAdmin = (user?.publicMetadata as Record<string, unknown>)?.admin === true;
  return { isAdmin, isLoaded };
}
