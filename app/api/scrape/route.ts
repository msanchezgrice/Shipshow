import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Helper function to resolve URLs against base URL
function resolveUrl(base: URL, candidate: string | undefined | null): string {
  if (!candidate) return '';
  
  // Clean up the candidate URL
  candidate = candidate.trim();
  
  // Return data URLs and absolute URLs as-is
  if (candidate.startsWith('data:') || candidate.startsWith('blob:')) {
    return candidate;
  }
  
  // Handle protocol-relative URLs
  if (candidate.startsWith('//')) {
    return `${base.protocol}${candidate}`;
  }
  
  // Handle absolute URLs
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate;
  }
  
  // Handle relative URLs
  try {
    return new URL(candidate, base.toString()).toString();
  } catch {
    // If URL construction fails, try to handle edge cases
    if (candidate.startsWith('/')) {
      // Absolute path
      return `${base.protocol}//${base.host}${candidate}`;
    } else {
      // Relative path
      const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
      return `${base.protocol}//${base.host}${basePath}${candidate}`;
    }
  }
}

// Helper function to pick first non-empty value
function pickFirst(...candidates: (string | undefined | null)[]): string {
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

// Helper to extract clean text from HTML
function extractText($: cheerio.CheerioAPI, selector: string): string {
  return $(selector).first().text().trim().replace(/\s+/g, ' ');
}

// Helper to find the best image from the page
function findBestImage($: cheerio.CheerioAPI, baseUrl: URL): string {
  // First try Open Graph and Twitter cards (these are usually the best quality)
  const metaImages = [
    $('meta[property="og:image:secure_url"]').attr('content'),
    $('meta[property="og:image:url"]').attr('content'),
    $('meta[property="og:image"]').attr('content'),
    $('meta[name="twitter:image:src"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[itemprop="image"]').attr('content'),
    $('link[rel="image_src"]').attr('href'),
  ];
  
  // Try meta images first
  const metaImage = pickFirst(...metaImages);
  if (metaImage) {
    return resolveUrl(baseUrl, metaImage);
  }
  
  // Look for article/content images
  const contentSelectors = [
    'article img',
    'main img',
    '.content img',
    '.post img',
    '.entry-content img',
    '[role="main"] img',
    '.article-body img',
    '.post-content img',
  ];
  
  for (const selector of contentSelectors) {
    const $imgs = $(selector);
    if ($imgs.length > 0) {
      const src = $imgs.first().attr('src') || $imgs.first().attr('data-src');
      if (src) {
        return resolveUrl(baseUrl, src);
      }
    }
  }
  
  // Look for any substantial image
  const allImages = $('img').toArray();
  for (const img of allImages) {
    const $img = $(img);
    const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
    
    // Skip small images (likely icons/logos)
    const width = parseInt($img.attr('width') || '0');
    const height = parseInt($img.attr('height') || '0');
    
    if (width > 200 || height > 200) {
      if (src) {
        return resolveUrl(baseUrl, src);
      }
    }
    
    // Check for images that aren't logos/icons based on URL patterns
    if (src && 
        !src.includes('logo') && 
        !src.includes('icon') && 
        !src.includes('avatar') && 
        !src.includes('profile') &&
        !src.includes('button') &&
        !src.includes('badge') &&
        !src.endsWith('.svg')) {
      return resolveUrl(baseUrl, src);
    }
  }
  
  return '';
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Security: only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs are allowed" }, { status: 400 });
    }

    // Security: block localhost and private IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.includes('local')
    ) {
      return NextResponse.json({ error: "Private URLs are not allowed" }, { status: 400 });
    }

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Use a more comprehensive User-Agent
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        redirect: 'follow',
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: "Request timeout - website took too long to respond" }, { status: 408 });
      }
      return NextResponse.json({ error: "Failed to fetch website. The site might be down or blocking access." }, { status: 500 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Website returned ${response.status}: ${response.statusText}` 
      }, { status: 400 });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: "URL does not point to an HTML page" }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title - try multiple sources
    const title = pickFirst(
      $('meta[property="og:title"]').attr('content'),
      $('meta[name="twitter:title"]').attr('content'),
      $('meta[property="og:site_name"]').attr('content'),
      $('meta[name="title"]').attr('content'),
      extractText($, 'h1'),
      extractText($, 'title'),
    );

    // Extract description - try multiple sources
    const description = pickFirst(
      $('meta[property="og:description"]').attr('content'),
      $('meta[name="twitter:description"]').attr('content'),
      $('meta[name="description"]').attr('content'),
      $('meta[property="og:summary"]').attr('content'),
      extractText($, 'article p:first-of-type'),
      extractText($, 'main p:first-of-type'),
    );

    // Find the best image
    const imageUrl = findBestImage($, parsedUrl);

    // Detect technology stack
    const technologies: string[] = [];
    
    // Check meta tags for generators
    const generator = $('meta[name="generator"]').attr('content')?.toLowerCase() || '';
    if (generator) {
      if (generator.includes('wordpress')) technologies.push('WordPress');
      if (generator.includes('drupal')) technologies.push('Drupal');
      if (generator.includes('joomla')) technologies.push('Joomla');
      if (generator.includes('squarespace')) technologies.push('Squarespace');
      if (generator.includes('wix')) technologies.push('Wix');
      if (generator.includes('shopify')) technologies.push('Shopify');
      if (generator.includes('ghost')) technologies.push('Ghost');
      if (generator.includes('hugo')) technologies.push('Hugo');
      if (generator.includes('gatsby')) technologies.push('Gatsby');
      if (generator.includes('jekyll')) technologies.push('Jekyll');
    }

    // Check for frameworks in scripts and DOM
    const htmlContent = $.html();
    
    // Next.js detection
    if ($('script[src*="/_next/"]').length > 0 || htmlContent.includes('__NEXT_DATA__')) {
      technologies.push('Next.js');
    }
    
    // React detection
    if (htmlContent.includes('react') || htmlContent.includes('React') || 
        $('#root, #__next, [data-reactroot]').length > 0) {
      technologies.push('React');
    }
    
    // Vue detection  
    if (htmlContent.includes('Vue') || $('#app').length > 0 || $('[v-cloak]').length > 0) {
      technologies.push('Vue.js');
    }
    
    // Angular detection
    if ($('[ng-app], [ng-controller], [ng-model]').length > 0 || 
        htmlContent.includes('angular') || htmlContent.includes('Angular')) {
      technologies.push('Angular');
    }
    
    // Svelte detection
    if (htmlContent.includes('__svelte') || htmlContent.includes('svelte')) {
      technologies.push('Svelte');
    }

    // Check for CSS frameworks
    const linkHrefs = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get();
    const styleContent = $('style').text();
    
    linkHrefs.forEach((href: string) => {
      if (href.includes('bootstrap')) technologies.push('Bootstrap');
      if (href.includes('tailwind')) technologies.push('Tailwind CSS');
      if (href.includes('bulma')) technologies.push('Bulma');
      if (href.includes('materialize')) technologies.push('Materialize');
      if (href.includes('foundation')) technologies.push('Foundation');
    });
    
    // Check inline styles for Tailwind
    if ($('[class*="flex"], [class*="grid"], [class*="px-"], [class*="py-"]').length > 5) {
      technologies.push('Tailwind CSS');
    }

    // Get favicon - try multiple sources
    const faviconCandidates = [
      $('link[rel="icon"]').attr('href'),
      $('link[rel="shortcut icon"]').attr('href'),
      $('link[rel="apple-touch-icon"]').attr('href'),
      $('link[rel="apple-touch-icon-precomposed"]').attr('href'),
      '/favicon.ico',
      '/favicon.png',
    ];
    
    const favicon = resolveUrl(parsedUrl, pickFirst(...faviconCandidates));

    return NextResponse.json({
      title: title.substring(0, 200), // Limit title length
      description: description.substring(0, 500), // Limit description length
      imageUrl: imageUrl || null,
      technologies: [...new Set(technologies)], // Remove duplicates
      favicon: favicon || null,
      url: parsedUrl.toString()
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: "Failed to scrape website. Please check the URL and try again." 
    }, { status: 500 });
  }
}