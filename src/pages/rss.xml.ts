import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import { SITE } from "@consts"

type Context = {
  site: string
}

export async function GET(context: Context) {
	const posts = await getCollection("blog")
  const projects = await getCollection("projects")

  const items = [...posts, ...projects]

  const dateOf = (item: (typeof items)[number]) => ("date" in item.data ? item.data.date : undefined)
  items.sort((a, b) => (dateOf(b)?.getTime() ?? 0) - (dateOf(a)?.getTime() ?? 0))

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: dateOf(item),
      link: item.slug.startsWith("blog")
        ? `/blog/${item.slug}/`
        : `/projects/${item.slug}/`,
    })),
  })
}
