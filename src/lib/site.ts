import "server-only";
import { headers } from "next/headers";

/** Absolute base URL of the site, for links in emails. */
export async function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function publicAssetUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** The address this request came in on (e.g. https://rwcll-sponsorships.vercel.app). */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/** HTML to paste into the league website to show the sign-up form there. */
export function embedSnippet(origin: string) {
  return `<!-- RWCLL sponsor sign-up form. The <script> part is optional: it makes the frame fit the form. -->
<iframe id="rwcll-sponsor-form" src="${origin}/embed" title="Sponsor Redwood City Little League"
  style="width:100%;height:2400px;border:0;" loading="lazy"></iframe>
<script>
(function () {
  var frame = document.getElementById("rwcll-sponsor-form"), loaded = false;
  window.addEventListener("message", function (e) {
    if (e.origin !== "${origin}" || !e.data || !e.data.height) return;
    frame.style.height = e.data.height + "px";
    if (e.data.type === "rwcll-sponsor-page") {
      if (loaded) frame.scrollIntoView({ behavior: "smooth" });
      loaded = true;
    }
  });
})();
</script>`;
}

/** Plain HTML (a button image + text link) for sites that strip iframes and scripts. */
export function linkSnippet(origin: string) {
  return `<p><a href="${origin}/" target="_blank"><img src="${origin}/sponsor-button.png" alt="Become a Sponsor" width="320" height="64" /></a></p>
<p><a href="${origin}/" target="_blank">Sign up to sponsor a team or banner</a></p>`;
}
