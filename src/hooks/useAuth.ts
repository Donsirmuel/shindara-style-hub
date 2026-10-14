import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, login as apiLogin, logout as apiLogout, type AuthUser } from "@/lib/api";

export function useAuth() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["me"] });

  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) => {
      const id = identifier.trim();
      return apiLogin(id.includes("@") ? { email: id } : { phone: id }, password);
    },
    onSuccess: invalidate,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiLogout();
      return null;
    },
    onSuccess: () => queryClient.setQueryData(["me"], null),
  });

  const user: AuthUser | null | undefined = meQuery.data === undefined ? undefined : meQuery.data;

  return {
    user,
    isLoading: meQuery.isLoading,
    backendDown: meQuery.isError,
    login: loginMutation,
    logout: logoutMutation,
  };
}
