import type { MetadataRoute } from 'next'
import { getCourseSlugs } from '@/lib/courses'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getCourseSlugs()
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/courses`, changeFrequency: 'daily', priority: 0.9 },
    ...slugs.map((slug) => ({
      url: `${SITE_URL}/courses/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
