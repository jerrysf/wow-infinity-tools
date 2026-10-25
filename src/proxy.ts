import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, detectLocale, stripLocale } from "@/i18n/config";

/**
 * Locale routing. Every page lives under /{locale}/; requests without a
 * locale prefix are redirected. `/` uses Accept-Language (302); other paths
 * permanently redirect to the default locale prefix (308) so old or shared
 * links keep working.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale } = stripLocale(pathname);
  if (locale) return NextResponse.next();

  const target = pathname === "/" ? detectLocale(request.headers.get("accept-language")) : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, pathname === "/" ? 302 : 308);
}

export const config = {
  // Skip _next internals and any path that looks like a file (robots.txt,
  // sitemap.xml, favicon.ico, images...).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
