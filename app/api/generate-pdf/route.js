import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// No need for getExecutablePath function - chromium package handles it

export async function POST(request) {
  let browser = null;
  console.log('Received request for /api/generate-pdf');
  try {
    const { html } = await request.json();
    console.log('Parsed HTML content length:', html?.length);

    if (!html) {
      console.log('HTML content missing from request body.');
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    console.log('Launching Puppeteer via @sparticuz/chromium...');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // Get path directly
      headless: chromium.headless, // Use headless mode from package
      ignoreHTTPSErrors: true,
    });
    console.log('Puppeteer launched successfully.');

    const page = await browser.newPage();
    console.log('New page created.');

    // Set content and wait for network activity to settle
    console.log('Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('Page content set.');

    console.log('Generating PDF buffer...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    console.log('PDF buffer generated, size:', pdfBuffer.length);

    console.log('Closing browser...');
    await browser.close();
    browser = null;
    console.log('Browser closed.');

    console.log('Returning PDF response.');
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="generated.pdf"',
      },
    });

  } catch (error) {
    console.error('*** PDF Generation Failed ***');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Full Error Object:', error);

    if (browser) {
      console.log('Closing browser due to error...');
      try { await browser.close(); console.log('Browser closed after error.'); } catch (closeError) { console.error('Error closing browser after initial error:', closeError); }
    }

    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : 'Stack trace hidden in production',
      }
    }, { status: 500 });

  } finally {
    if (browser) {
      console.warn('Browser instance was not null in finally block, attempting close.');
      try { await browser.close(); } catch (finalCloseError) { console.error('Error closing browser in finally block:', finalCloseError); }
    }
  }
} 