import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Determine the correct executable path based on the environment
const getExecutablePath = async () => {
  // For local development, specify the path to your installed Chrome/Chromium
  if (process.env.NODE_ENV !== 'production') {
    // Windows example path (adjust if necessary):
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    // macOS example path:
    // return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    // Linux example path:
    // return '/usr/bin/google-chrome'; // Or '/usr/bin/chromium-browser'
  }

  // For production (like Vercel), use chromium-min
  return await chromium.executablePath();
};

export async function POST(request) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const executablePath = await getExecutablePath();

    const browser = await puppeteer.launch({
      args: process.env.NODE_ENV === 'production' ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: process.env.NODE_ENV === 'production' ? chromium.headless : true, // Use bundled chromium headless in prod
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set content and wait for network activity to settle
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Include background graphics and colors
      margin: { // Optional: Adjust margins
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Return the PDF buffer as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="generated.pdf"', // Suggests filename
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 });
  }
} 