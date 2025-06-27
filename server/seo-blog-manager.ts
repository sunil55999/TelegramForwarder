import { storage } from "./storage";
import { errorHandler } from "./error-handler";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  canonicalUrl?: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  readingTime: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoSettings {
  id: number;
  siteName: string;
  siteUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultKeywords: string[];
  googleAnalyticsId?: string;
  googleSearchConsoleId?: string;
  bingWebmasterToolsId?: string;
  socialMediaMeta: {
    twitterHandle?: string;
    facebookAppId?: string;
    defaultOgImage?: string;
  };
  robotsTxt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SearchConsoleData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  query: string;
  page: string;
  date: Date;
}

export class SeoAndBlogManager {
  private static instance: SeoAndBlogManager;

  static getInstance(): SeoAndBlogManager {
    if (!SeoAndBlogManager.instance) {
      SeoAndBlogManager.instance = new SeoAndBlogManager();
    }
    return SeoAndBlogManager.instance;
  }

  // Blog Post Management
  async createBlogPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'readingTime'>): Promise<BlogPost> {
    const slug = this.generateSlug(postData.title);
    const readingTime = this.calculateReadingTime(postData.content);
    
    const post: Omit<BlogPost, 'id'> = {
      ...postData,
      slug,
      readingTime,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await storage.createBlogPost(post);
    const createdPost = { ...post, id };

    // Generate sitemap after creating post
    if (post.status === 'published') {
      await this.updateSitemap();
    }

    return createdPost;
  }

  async updateBlogPost(postId: number, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const existingPost = await storage.getBlogPostById(postId);
    if (!existingPost) return null;

    // Update slug if title changed
    if (updates.title && updates.title !== existingPost.title) {
      updates.slug = this.generateSlug(updates.title);
    }

    // Recalculate reading time if content changed
    if (updates.content) {
      updates.readingTime = this.calculateReadingTime(updates.content);
    }

    updates.updatedAt = new Date();

    const success = await storage.updateBlogPost(postId, updates);
    if (!success) return null;

    const updatedPost = { ...existingPost, ...updates };

    // Update sitemap if status changed to published
    if (updates.status === 'published' || existingPost.status === 'published') {
      await this.updateSitemap();
    }

    return updatedPost;
  }

  async deleteBlogPost(postId: number): Promise<boolean> {
    const success = await storage.deleteBlogPost(postId);
    if (success) {
      await this.updateSitemap();
    }
    return success;
  }

  async getAllBlogPosts(filters?: {
    status?: BlogPost['status'];
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: BlogPost[]; total: number }> {
    return await storage.getBlogPosts(filters);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return await storage.getBlogPostBySlug(slug);
  }

  async incrementViewCount(postId: number): Promise<void> {
    await storage.incrementBlogPostViews(postId);
  }

  // SEO Settings Management
  async updateSeoSettings(settings: Partial<SeoSettings>): Promise<SeoSettings> {
    const existingSettings = await storage.getSeoSettings();
    
    if (existingSettings) {
      const updatedSettings = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date(),
      };
      await storage.updateSeoSettings(updatedSettings);
      return updatedSettings;
    } else {
      const newSettings: Omit<SeoSettings, 'id'> = {
        siteName: 'AutoForwardX',
        siteUrl: 'https://autoforwardx.com',
        defaultMetaTitle: 'AutoForwardX - Telegram Message Forwarding',
        defaultMetaDescription: 'Professional Telegram message forwarding platform with advanced automation.',
        defaultKeywords: ['telegram', 'forwarding', 'automation', 'messaging'],
        socialMediaMeta: {},
        robotsTxt: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://autoforwardx.com/sitemap.xml`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...settings,
      };

      const id = await storage.createSeoSettings(newSettings);
      return { ...newSettings, id };
    }
  }

  async getSeoSettings(): Promise<SeoSettings | null> {
    return await storage.getSeoSettings();
  }

  // Sitemap Management
  async generateSitemap(): Promise<string> {
    const entries: SitemapEntry[] = [];
    const settings = await this.getSeoSettings();
    const baseUrl = settings?.siteUrl || 'https://autoforwardx.com';

    // Add static pages
    entries.push({
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    });

    entries.push({
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    });

    entries.push({
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Add blog posts
    const { posts } = await this.getAllBlogPosts({ status: 'published' });
    for (const post of posts) {
      entries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Generate XML
    const xml = this.generateSitemapXml(entries);
    
    // Save to storage
    await storage.saveSitemap(xml);
    
    return xml;
  }

  async updateSitemap(): Promise<void> {
    try {
      await this.generateSitemap();
      
      // Ping search engines
      await this.pingSearchEngines();
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        errorType: 'system',
        context: { operation: 'update_sitemap' },
      });
    }
  }

  private async pingSearchEngines(): Promise<void> {
    const settings = await this.getSeoSettings();
    if (!settings?.siteUrl) return;

    const sitemapUrl = `${settings.siteUrl}/sitemap.xml`;
    
    const pingUrls = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    ];

    for (const pingUrl of pingUrls) {
      try {
        await fetch(pingUrl, { method: 'GET' });
      } catch (error) {
        console.warn(`Failed to ping ${pingUrl}:`, error);
      }
    }
  }

  // Meta Tag Generation
  generateMetaTags(data: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: string;
    twitterCard?: string;
  }): string {
    const settings = this.getSeoSettings();
    
    const title = data.title || 'AutoForwardX - Telegram Message Forwarding';
    const description = data.description || 'Professional Telegram message forwarding platform with advanced automation.';
    const keywords = data.keywords || ['telegram', 'forwarding', 'automation'];

    return `
    <title>${this.escapeHtml(title)}</title>
    <meta name="description" content="${this.escapeHtml(description)}">
    <meta name="keywords" content="${keywords.map(k => this.escapeHtml(k)).join(', ')}">
    ${data.canonicalUrl ? `<link rel="canonical" href="${this.escapeHtml(data.canonicalUrl)}">` : ''}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${this.escapeHtml(title)}">
    <meta property="og:description" content="${this.escapeHtml(description)}">
    <meta property="og:type" content="${data.ogType || 'website'}">
    ${data.ogImage ? `<meta property="og:image" content="${this.escapeHtml(data.ogImage)}">` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="${data.twitterCard || 'summary_large_image'}">
    <meta name="twitter:title" content="${this.escapeHtml(title)}">
    <meta name="twitter:description" content="${this.escapeHtml(description)}">
    ${data.ogImage ? `<meta name="twitter:image" content="${this.escapeHtml(data.ogImage)}">` : ''}
    `.trim();
  }

  // JSON-LD Schema Generation
  generateJsonLdSchema(type: 'BlogPosting' | 'Organization' | 'WebSite', data: any): string {
    const baseUrl = 'https://autoforwardx.com';
    
    let schema: any;

    switch (type) {
      case 'BlogPosting':
        schema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": data.title,
          "description": data.excerpt || data.description,
          "author": {
            "@type": "Person",
            "name": data.author || "AutoForwardX Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "AutoForwardX",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`
            }
          },
          "datePublished": data.publishedAt,
          "dateModified": data.updatedAt,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${baseUrl}/blog/${data.slug}`
          }
        };
        break;

      case 'Organization':
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "AutoForwardX",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
          "description": "Professional Telegram message forwarding platform with advanced automation.",
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@autoforwardx.com"
          },
          "sameAs": [
            "https://twitter.com/autoforwardx",
            "https://t.me/autoforwardx"
          ]
        };
        break;

      case 'WebSite':
        schema = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "AutoForwardX",
          "url": baseUrl,
          "description": "Professional Telegram message forwarding platform with advanced automation.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        };
        break;
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  // Search Console Integration
  async getSearchConsoleData(dateRange: { start: Date; end: Date }): Promise<SearchConsoleData[]> {
    // This would integrate with Google Search Console API
    // For now, return mock data structure
    return [];
  }

  async submitUrlToSearchConsole(url: string): Promise<boolean> {
    // This would submit URL to Google Search Console for indexing
    // Requires Google Search Console API setup
    return true;
  }

  // Utility Methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private generateSitemapXml(entries: SitemapEntry[]): string {
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const footer = '</urlset>';
    
    const urls = entries.map(entry => `
  <url>
    <loc>${this.escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return header + urls + footer;
  }

  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as any;
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Analytics
  async getBlogAnalytics(postId?: number): Promise<{
    totalViews: number;
    topPosts: Array<{ id: number; title: string; views: number }>;
    viewsByDate: Array<{ date: string; views: number }>;
  }> {
    if (postId) {
      const post = await storage.getBlogPostById(postId);
      return {
        totalViews: post?.viewCount || 0,
        topPosts: [],
        viewsByDate: [],
      };
    }

    const { posts } = await this.getAllBlogPosts({ status: 'published' });
    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0);
    const topPosts = posts
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)
      .map(post => ({ id: post.id, title: post.title, views: post.viewCount }));

    return {
      totalViews,
      topPosts,
      viewsByDate: [], // Would implement detailed analytics
    };
  }

  async getContentOptimizationSuggestions(postId: number): Promise<{
    seoScore: number;
    suggestions: string[];
    improvements: Array<{ type: string; description: string; priority: 'high' | 'medium' | 'low' }>;
  }> {
    const post = await storage.getBlogPostById(postId);
    if (!post) {
      return { seoScore: 0, suggestions: ['Post not found'], improvements: [] };
    }

    const suggestions: string[] = [];
    const improvements: Array<{ type: string; description: string; priority: 'high' | 'medium' | 'low' }> = [];
    let score = 100;

    // Check meta title
    if (!post.metaTitle || post.metaTitle.length < 30) {
      score -= 15;
      suggestions.push('Add a meta title (30-60 characters)');
      improvements.push({
        type: 'meta_title',
        description: 'Meta title is missing or too short',
        priority: 'high'
      });
    }

    // Check meta description
    if (!post.metaDescription || post.metaDescription.length < 120) {
      score -= 15;
      suggestions.push('Add a meta description (120-160 characters)');
      improvements.push({
        type: 'meta_description',
        description: 'Meta description is missing or too short',
        priority: 'high'
      });
    }

    // Check keywords
    if (post.keywords.length === 0) {
      score -= 10;
      suggestions.push('Add relevant keywords');
      improvements.push({
        type: 'keywords',
        description: 'No keywords defined',
        priority: 'medium'
      });
    }

    // Check content length
    if (post.content.length < 1000) {
      score -= 20;
      suggestions.push('Consider expanding content (aim for 1000+ words)');
      improvements.push({
        type: 'content_length',
        description: 'Content is shorter than recommended',
        priority: 'medium'
      });
    }

    return {
      seoScore: Math.max(0, score),
      suggestions,
      improvements
    };
  }
}

export const seoAndBlogManager = SeoAndBlogManager.getInstance();