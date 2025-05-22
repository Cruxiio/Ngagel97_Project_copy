import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/register", "/login", "/home", "/about", "/test"]; // public routes
const STATIC_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".ico",
  ".webp",
]; // Allowed static formats

export async function middleware(request) {
  const token = request.cookies.get("token"); // Retrieve token from cookies

  const { pathname } = request.nextUrl;
  console.log("Middleware is running. Pathname:", pathname);

  // Allow access to static files
  if (STATIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Redirect '/' to '/home'
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If there is a token, check if user is accessing /login or /register
  if (token) {
    try {
      const { payload } = await jwtVerify(
        token.value,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      // Prevent redirecting logged-in users to /login or /register
      if (PUBLIC_ROUTES.includes(pathname)) {
        // If already on /login or /register, redirect to /home
        if (pathname === "/login" || pathname === "/register") {
          return NextResponse.redirect(new URL("/home", request.url));
        }
      }

      // Role-based access control
      const { role } = payload;

      if (role.toLowerCase() === "master" && !pathname.startsWith("/master")) {
        return NextResponse.redirect(new URL("/master", request.url));
      }

      if (role.toLowerCase() === "admin" && !pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      if (
        role.toLowerCase() === "customer" &&
        (pathname.startsWith("/master") || pathname.startsWith("/admin"))
      ) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      // Attach user data for future use in the request
      request.user = payload;

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If there's no token, check for public routes (login, register)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // If no token and not a public route, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!api/|_next/|_proxy/|_static|_vercel|favicon.ico|sitemap.xml).*)",
  ],
};
