import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">Página não encontrada.</p>
        <Link to="/" className="mt-6 inline-block text-cyan underline">Voltar</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-cyan px-4 py-2 text-sm font-medium text-background"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WF Cirúrgicos — CRM & Comunicações" },
      { name: "description", content: "Plataforma B2B premium para WF Cirúrgicos." },
      { property: "og:title", content: "WF Cirúrgicos — CRM & Comunicações" },
      { name: "twitter:title", content: "WF Cirúrgicos — CRM & Comunicações" },
      { property: "og:description", content: "Plataforma B2B premium para WF Cirúrgicos." },
      { name: "twitter:description", content: "Plataforma B2B premium para WF Cirúrgicos." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/39d1c0ff-f530-4cc3-9a25-7c888f46cbe3/id-preview-97f14b66--d684826d-7eb7-473f-a2d9-d6462ba601dc.lovable.app-1779440849650.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/39d1c0ff-f530-4cc3-9a25-7c888f46cbe3/id-preview-97f14b66--d684826d-7eb7-473f-a2d9-d6462ba601dc.lovable.app-1779440849650.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(13,21,38,0.95)',
            color: '#F0F4FF',
            border: '1px solid rgba(28,46,74,0.8)',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
