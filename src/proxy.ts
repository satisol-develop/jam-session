import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = request.cookies.get("jam_auth")?.value === "1";
  if (!authed) {
    // Idioma del destino: el de la propia URL (/es/…, /eu/…), si no, la
    // preferencia guardada; sin nada, /login elige según el navegador
    // (IrAIdioma).
    const seg = pathname.split("/")[1];
    const guardado = request.cookies.get("jam_lang")?.value;
    const lang =
      seg === "es" || seg === "eu"
        ? seg
        : guardado === "es" || guardado === "eu"
          ? guardado
          : null;
    const login = new URL(lang ? `/${lang}/login` : "/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/mi/:path*",
    "/es/mi/:path*",
    "/eu/mi/:path*",
    "/partituras/:path*",
    "/es/partituras/:path*",
    "/eu/partituras/:path*",
  ],
};
