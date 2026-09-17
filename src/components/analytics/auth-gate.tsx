import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

import wfLogo from "@/assets/wf-logo.png";

interface Profile {
  id: string;
  display_name: string;
  role: string;
  avatar_url?: string | null;
}
interface Me {
  app_auth_enabled: boolean;
  user?: { display_name: string; role: string };
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, { credentials: "include", ...options });
  if (!response.ok) throw new Error(response.status === 401 ? "AUTH_REQUIRED" : "AUTH_UNAVAILABLE");
  return (response.status === 204 ? {} : await response.json()) as T;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState("");
  const [password, setPassword] = useState("");
  const me = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authRequest<Me>("me"),
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: 60_000,
  });
  const profiles = useQuery({
    queryKey: ["auth-profiles"],
    queryFn: () => authRequest<Profile[]>("profiles"),
    enabled: typeof window !== "undefined" && me.isError,
    retry: false,
  });
  const login = useMutation({
    mutationFn: () =>
      authRequest("login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: selectedProfile, password }),
      }),
    onSuccess: async () => {
      setPassword("");
      await queryClient.invalidateQueries();
    },
  });
  if (typeof window === "undefined" || me.isPending)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <LoaderCircle className="h-7 w-7 animate-spin text-cyan" />
      </div>
    );
  if (me.data?.user) return <>{children}</>;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedProfile && password) login.mutate();
  };
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div className="gradient-mesh" />
      <form
        onSubmit={submit}
        className="glass relative z-10 w-full max-w-[420px] rounded-2xl p-7 shadow-2xl"
      >
        <div className="flex items-center gap-4 border-b border-border/60 pb-5">
          <img src={wfLogo} alt="WF Cirúrgicos" className="h-16 w-16 object-contain" />
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-cyan">Cirúrgico Pulse</p>
            <h1 className="font-display text-xl font-semibold">Acesso comercial</h1>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm text-muted-foreground">
            Perfil
            <select
              value={selectedProfile}
              onChange={(event) => setSelectedProfile(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-secondary px-3 py-3 text-foreground outline-none focus:border-cyan"
            >
              <option value="">Selecione seu perfil</option>
              {(profiles.data ?? []).map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted-foreground">
            Senha
            <div className="relative mt-2">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary py-3 pl-10 pr-3 text-foreground outline-none focus:border-cyan"
              />
            </div>
          </label>
          {login.isError && <p className="text-sm text-red-400">Perfil ou senha inválidos.</p>}
          {profiles.isError && (
            <p className="text-sm text-red-400">Serviço de autenticação indisponível.</p>
          )}
          <button
            disabled={!selectedProfile || !password || login.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {login.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}{" "}
            Entrar
          </button>
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Mesmas credenciais e permissões do WhatsApp WF.
        </p>
      </form>
    </main>
  );
}
