import { useUser } from "@clerk/nextjs";

function isAdminValue(val: unknown): boolean {
  return val === true || val === "true";
}

export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const raw = (user?.publicMetadata as Record<string, unknown>)?.admin;
  const isAdmin = isAdminValue(raw);
  return { isAdmin, isLoaded };
}
