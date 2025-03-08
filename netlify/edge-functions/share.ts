/// <reference lib="deno.ns" />

import type { Config, Context } from "https://edge.netlify.com"

/**
 * This edge function enhances social media sharing for shared notes.
 * It detects when a bot (like social media crawlers) accesses a shared note URL,
 * fetches the corresponding note content, and generates optimized HTML with
 * appropriate meta tags for better link previews on social media platforms.
 * For regular users, it passes the request through to the normal application flow.
 */
export default async (request: Request, context: Context) => {
  // Pass through for regular users
  if (!isBot(request.headers.get("user-agent"))) {
    return await context.next()
  }

  const url = new URL(request.url)
  const gistId = url.pathname.split("/share/")[1]

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`)

    if (!response.ok) {
      throw new Error("Not found")
    }

    const gist = await response.json()

    if (!gist.files) {
      throw new Error("No files found in gist")
    }

    const noteContent = getNoteContent(gist)
    const noteTitle = getNoteTitle(noteContent)
    const pageTitle = noteTitle || gist.description || "Untitled"
    const pageDescription = "Shared note"
    const siteName = gist?.owner?.login || "Lumen"
    const html = `<!doctype html>
<html>
  <head>
    <title>${pageTitle}</title>
    <meta charset="utf-8" />
    <meta name="description" content="${pageDescription}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="${pageDescription}" />
    <meta property="og:url" content="${url.href}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${pageTitle}" />
    <meta name="twitter:description" content="${pageDescription}" />
  </head>
  <body>
    <pre>${noteContent}</pre>
  </body>
</html>`

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (_error) {
    return await context.next()
  }
}

// Comprehensive list of bot patterns copied from the isbot package
// https://github.com/omrilotan/isbot/blob/f483f15f663b59224f1e627377e70cc8270f693b/src/patterns.json
const botPatterns = [
  " daum[ /]",
  " deusu/",
  " yadirectfetcher",
  "(?:^|[^g])news(?!sapphire)",
  "(?<! (?:channel/|google/))google(?!(app|/google| pixel))",
  "(?<! cu)bots?(?:\\b|_)",
  "(?<!(?:lib))http",
  "(?<![hg]m)score",
  "@[a-z][\\w-]+\\.",
  "\\(\\)",
  "\\.com\\b",
  "\\btime/",
  "\\|",
  "^<",
  "^[\\w \\.\\-\\(?:\\):%]+(?:/v?\\d+(?:\\.\\d+)?(?:\\.\\d{1,10})*?)?(?:,|$)",
  "^[^ ]{50,}$",
  "^\\d+\\b",
  "^\\w*search\\b",
  "^\\w+/[\\w\\(\\)]*$",
  "^active",
  "^ad muncher",
  "^amaya",
  "^avsdevicesdk/",
  "^biglotron",
  "^bot",
  "^bw/",
  "^clamav[ /]",
  "^client/",
  "^cobweb/",
  "^custom",
  "^ddg[_-]android",
  "^discourse",
  "^dispatch/\\d",
  "^downcast/",
  "^duckduckgo",
  "^email",
  "^facebook",
  "^getright/",
  "^gozilla/",
  "^hobbit",
  "^hotzonu",
  "^hwcdn/",
  "^igetter/",
  "^jeode/",
  "^jetty/",
  "^jigsaw",
  "^microsoft bits",
  "^movabletype",
  "^mozilla/5\\.0\\s[a-z\\.-]+$",
  "^mozilla/\\d\\.\\d \\(compatible;?\\)$",
  "^mozilla/\\d\\.\\d \\w*$",
  "^navermailapp",
  "^netsurf",
  "^offline",
  "^openai/",
  "^owler",
  "^php",
  "^postman",
  "^python",
  "^rank",
  "^read",
  "^reed",
  "^rest",
  "^rss",
  "^snapchat",
  "^space bison",
  "^svn",
  "^swcd ",
  "^taringa",
  "^thumbor/",
  "^track",
  "^w3c",
  "^webbandit/",
  "^webcopier",
  "^wget",
  "^whatsapp",
  "^wordpress",
  "^xenu link sleuth",
  "^yahoo",
  "^yandex",
  "^zdm/\\d",
  "^zoom marketplace/",
  "^{{.*}}$",
  "adscanner/",
  "analyzer",
  "archive",
  "ask jeeves/teoma",
  "audit",
  "bit\\.ly/",
  "bluecoat drtr",
  "browsex",
  "burpcollaborator",
  "capture",
  "catch",
  "check\\b",
  "checker",
  "chrome-lighthouse",
  "chromeframe",
  "classifier",
  "cloudflare",
  "convertify",
  "cookiehubscan",
  "crawl",
  "cypress/",
  "dareboost",
  "datanyze",
  "dejaclick",
  "detect",
  "dmbrowser",
  "download",
  "evc-batch/",
  "exaleadcloudview",
  "feed",
  "firephp",
  "functionize",
  "gomezagent",
  "headless",
  "httrack",
  "hubspot marketing grader",
  "hydra",
  "ibisbrowser",
  "images",
  "infrawatch",
  "insight",
  "inspect",
  "iplabel",
  "ips-agent",
  "java(?!;)",
  "jsjcw_scanner",
  "library",
  "linkcheck",
  "mail\\.ru/",
  "manager",
  "measure",
  "neustar wpm",
  "node",
  "nutch",
  "offbyone",
  "optimize",
  "pageburst",
  "pagespeed",
  "parser",
  "perl",
  "phantomjs",
  "pingdom",
  "powermarks",
  "preview",
  "proxy",
  "ptst[ /]\\d",
  "reputation",
  "resolver",
  "retriever",
  "rexx;",
  "rigor",
  "rss\\b",
  "scanner\\.",
  "scrape",
  "server",
  "sogou",
  "sparkler/",
  "speedcurve",
  "spider",
  "splash",
  "statuscake",
  "supercleaner",
  "synapse",
  "synthetic",
  "tools",
  "torrent",
  "trace",
  "transcoder",
  "url",
  "validator",
  "virtuoso",
  "wappalyzer",
  "webglance",
  "webkit2png",
  "whatcms/",
  "zgrab",
]

/**
 * Detects if a user agent string belongs to a bot by checking
 * for common bot patterns and identifiers. Implementation based on
 * the isbot package (https://github.com/omrilotan/isbot)
 */
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  const pattern = new RegExp(botPatterns.join("|"), "i")
  return pattern.test(userAgent)
}

type File = {
  filename?: string
  type?: string
  content?: string
}

function getNoteContent(gist: { files: Record<string, File> }) {
  // We need to locate a markdown file within the gist to use as the note content
  // If there's a README.md file, we use that. Otherwise, we use the first markdown file we find
  const readmeFile = Object.values(gist.files as Record<string, File>).find(
    (file) => file?.filename?.toLowerCase() === "readme.md",
  )
  const markdownFile =
    readmeFile ||
    Object.values(gist.files as Record<string, File>).find((file) => file?.type === "text/markdown")

  const content = removeFrontmatter(markdownFile?.content || "")

  return content
}

function removeFrontmatter(markdown: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = markdown.match(frontmatterRegex)

  if (match) {
    return match[2]
  }

  return markdown
}

function getNoteTitle(content: string) {
  // Look for the first heading level 1 (# title) anywhere in the content
  const titleRegex = /^# (.*)$/m
  const match = content.trim().match(titleRegex)

  return match?.[1] || ""
}

export const config: Config = { path: "/share/*" }
