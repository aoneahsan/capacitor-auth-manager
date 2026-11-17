# RSS formats

## Valid RSS 2.0

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Example — Blog &amp; Updates</title>
    <link>https://example.com/blog</link>
    <description>Product updates, guides and release notes.</description>
    <language>en-us</language>
    <lastBuildDate>Sun, 20 Jul 2026 09:00:00 GMT</lastBuildDate>
    <atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml" />

    <item>
      <title>Introducing the CSV formatter</title>
      <link>https://example.com/blog/csv-formatter</link>
      <guid isPermaLink="true">https://example.com/blog/csv-formatter</guid>
      <pubDate>Fri, 18 Jul 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[<p>Fix files that fail to import…</p>]]></description>
      <category>Guides</category>
    </item>
  </channel>
</rss>
```

This example uses the optional Atom self-link extension. When `atom:link` is present, the matching
`xmlns:atom` declaration is required for that element to be namespace-valid.

## Generation

```ts
function generateFeedXml(posts: BlogPostMeta[]): string {
  const items = posts.map((p) => `    <item>
      <title>${escapeXmlText(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <pubDate>${toRfc822(p.publishedAt)}</pubDate>
      <description>${wrapCdata(p.excerpt)}</description>
      ${p.tags.map((t) => `<category>${escapeXmlText(t)}</category>`).join('\n      ')}
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXmlText(SITE_NAME)} — Blog &amp; Updates</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXmlText(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    ${posts[0] ? `<lastBuildDate>${toRfc822(posts[0].updatedAt ?? posts[0].publishedAt)}</lastBuildDate>` : ''}
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
```

Deriving `lastBuildDate` from the newest post rather than `new Date()` keeps it honest — a feed that claims to
have been rebuilt today when nothing changed trains aggregators to ignore the field.

## Helpers

```ts
const escapeXmlText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const wrapCdata = (html: string) =>
  `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;   // split any nested terminator

const toRfc822 = (d: Date | string) => new Date(d).toUTCString();
```

The `]]>` split in `wrapCdata` is the subtle one — content containing that sequence would otherwise close the
CDATA section early and produce invalid XML.

## Post metadata

```ts
interface BlogPostMeta {
  slug: string; title: string; excerpt: string;
  publishedAt: string; updatedAt?: string;
  tags: string[]; keywords: string[];
  author: string; coverImage?: string;
}
```

## Discovery

```html
<link rel="alternate" type="application/rss+xml"
      title="Example — Blog &amp; Updates" href="/feed.xml">
```

## Validation

```bash
curl -s https://example.com/feed.xml | head -30
python3 -c "import xml.dom.minidom,urllib.request; xml.dom.minidom.parse(urllib.request.urlopen('https://example.com/feed.xml')); print('valid XML')"
```

Then run it through the W3C Feed Validation Service. Subscribe in a real reader once — a feed that validates
but renders badly is still broken for the person reading it.

## Common failures

| Symptom | Cause |
|---|---|
| Validator recommends a self reference | add `atom:link rel="self"` and declare `xmlns:atom` if the selected consumers use it |
| Items appear undated or out of order | `pubDate` not RFC-822 (`toUTCString()` produces it correctly) |
| Raw HTML tags shown as text | description HTML was neither escaped nor wrapped safely in CDATA |
| Duplicate items after a slug change | `guid` changed — it must be stable for the life of the post |
| Feed empty in a reader but valid | posts filtered by a draft flag the generator did not account for |
