// Sitemap for wraptype.com — single-page site
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: 'https://wraptype.com',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
	]
}
