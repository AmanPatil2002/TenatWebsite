import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const STATIC_TITLES = {
  "/": "Home",
  "/home": "Home",
  "/login": "Sign in",
  "/register": "Create account",
  "/reset-password": "Reset password",
  "/contact": "Contact",
  "/review": "Leave a review",
  "/error-report": "Report an issue",
  "/myaccount": "My account",
  "/templates": "Templates",
  "/payment": "Payment",
  "/mysite": "My sites",
};

const humanize = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getRouteTitle = (pathname) => {
  if (STATIC_TITLES[pathname]) return STATIC_TITLES[pathname];
  if (pathname.startsWith("/site-admin/")) {
    const section = pathname.split("/")[3];
    return section ? `Site admin · ${humanize(section)}` : "Site admin";
  }
  if (pathname.startsWith("/admin")) {
    const section = pathname.split("/")[2];
    return section ? `Admin · ${humanize(section)}` : "Admin";
  }
  if (pathname.startsWith("/site/") || pathname.startsWith("/mysite/")) {
    return "Tenant site";
  }
  return "Page";
};

export default function RouteStatus() {
  const { pathname } = useLocation();
  const routeTitle = getRouteTitle(pathname);

  useEffect(() => {
    document.title = `${routeTitle} | Tenant Website`;
  }, [routeTitle]);

  return (
    <p className="route-announcer" aria-live="polite" aria-atomic="true">
      {routeTitle}
    </p>
  );
}
