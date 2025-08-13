import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

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
      hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)
    ) {
      return NextResponse.json({ error: "Private URLs are not allowed" }, { status: 400 });
    }

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShipShow-Bot/1.0; +https://shipshow.io)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: "Request timeout - website took too long to respond" }, { status: 408 });
      }
      return NextResponse.json({ error: "Failed to fetch website" }, { status: 500 });
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

    // Extract title
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').first().text() ||
      '';

    // Extract description
    const description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    // Extract image
    let imageUrl = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    // If no og:image, try to find a significant image
    if (!imageUrl) {
      const images = $('img').toArray();
      for (const img of images) {
        const src = $(img).attr('src');
        if (src && !src.includes('logo') && !src.includes('icon')) {
          imageUrl = src;
          break;
        }
      }
    }

    // Make image URL absolute if it's relative
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, parsedUrl.origin).toString();
      } catch {
        imageUrl = ''; // Invalid relative URL
      }
    }

    // Detect technology stack
    const technologies: string[] = [];
    
    // Check meta tags
    const generator = $('meta[name="generator"]').attr('content');
    if (generator) {
      if (generator.toLowerCase().includes('wordpress')) technologies.push('WordPress');
      if (generator.toLowerCase().includes('drupal')) technologies.push('Drupal');
      if (generator.toLowerCase().includes('joomla')) technologies.push('Joomla');
      if (generator.toLowerCase().includes('squarespace')) technologies.push('Squarespace');
      if (generator.toLowerCase().includes('wix')) technologies.push('Wix');
      if (generator.toLowerCase().includes('shopify')) technologies.push('Shopify');
    }

    // Check for Next.js
    if ($('script[src*="/_next/"]').length > 0 || $('script').text().includes('__NEXT_DATA__')) {
      technologies.push('Next.js');
    }

    // Check for React
    if ($('script').text().includes('React') || $('div[id="root"]').length > 0) {
      technologies.push('React');
    }

    // Check for Vue
    if ($('script').text().includes('Vue') || $('div[id="app"]').length > 0) {
      technologies.push('Vue.js');
    }

    // Check for Angular
    if ($('script').text().includes('Angular') || $('[ng-app]').length > 0) {
      technologies.push('Angular');
    }

    // Check for popular frameworks by script sources
    const scriptSrcs = $('script[src]').map((_, el) => $(el).attr('src')).get();
    scriptSrcs.forEach((src: string) => {
      if (src.includes('bootstrap')) technologies.push('Bootstrap');
      if (src.includes('jquery')) technologies.push('jQuery');
      if (src.includes('tailwind')) technologies.push('Tailwind CSS');
    });

    // Get favicon
    let favicon = 
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      '/favicon.ico';

    // Make favicon URL absolute
    if (favicon && !favicon.startsWith('http')) {
      try {
        favicon = new URL(favicon, parsedUrl.origin).toString();
      } catch {
        favicon = '';
      }
    }

    return NextResponse.json({
      title: title.trim().substring(0, 200), // Limit title length
      description: description.trim().substring(0, 500), // Limit description length
      imageUrl: imageUrl || null,
      technologies: [...new Set(technologies)], // Remove duplicates
      favicon: favicon || null,
      url: parsedUrl.toString()
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: "Failed to scrape website" 
    }, { status: 500 });
  }
}
