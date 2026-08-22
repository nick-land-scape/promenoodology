import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * What a crawler is welcome to read.
 *
 * Everything, which is the honest answer for a collective whose whole argument
 * is that anybody can do this — including the crawlers that feed language
 * models. A page written to be handed to a stranger has no business being shut
 * to the machine a stranger now asks first.
 *
 * Three exceptions, and none of them is content.
 *
 * /admin and /api are the back of the house: one is behind a sign-in and the
 * other answers in JSON. Neither has anything to show anybody and both cost a
 * crawler requests it could have spent on a story.
 *
 * /account is the sign-in flow, and it is left crawlable on purpose even though
 * it says noindex. That is not an oversight: a page blocked here is a page whose
 * noindex can never be read, and Google will list a blocked address it has seen
 * linked, with no title and no description under it. Letting it be fetched is
 * what makes the noindex work.
 *
 * The members' app under /app is the same case. It is linked from the front
 * page, it declares noindex in its own layout, and blocking it here would turn
 * "do not list this" into "list this with nothing under it".
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/holding"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/").replace(/\/$/, ""),
  };
}
