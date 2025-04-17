import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Determine the correct executable path based on the environment
const getExecutablePath = async () => {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  // For local development, specify the path to your installed Chrome/Chromium
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using local Chrome path.');
    // Windows example path (adjust if necessary):
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    // macOS example path:
    // return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    // Linux example path:
    // return '/usr/bin/google-chrome'; // Or '/usr/bin/chromium-browser'
  }

  // For production (like Vercel/Netlify), use chromium-min
  console.log('Attempting to get executable path from chromium-min...');
  try {
    const path = await chromium.executablePath();
    console.log('Chromium executable path obtained:', path);
    return path;
  } catch (error) {
    console.error('Error getting chromium executable path:', error);
    throw new Error(`Failed to get chromium executable path: ${error.message}`); // Re-throw to be caught below
  }
};

export async function POST(request) {
  let browser = null; // Define browser outside try block for finally
  console.log('Received request for /api/generate-pdf');
  try {
    const { html } = await request.json();
    console.log('Parsed HTML content length:', html?.length);

    if (!html) {
      console.log('HTML content missing from request body.');
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    console.log('Getting executable path...');
    const executablePath = await getExecutablePath();
    console.log('Executable path resolved:', executablePath);

    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      args: process.env.NODE_ENV === 'production' ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: process.env.NODE_ENV === 'production' ? chromium.headless : true, // Use bundled chromium headless in prod
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
      printBackground: true, // Include background graphics and colors
      margin: { // Optional: Adjust margins
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    console.log('PDF buffer generated, size:', pdfBuffer.length);

    console.log('Closing browser...');
    await browser.close();
    browser = null; // Ensure browser is null after closing
    console.log('Browser closed.');

    // Return the PDF buffer as a response
    console.log('Returning PDF response.');
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="generated.pdf"', // Suggests filename
      },
    });

  } catch (error) {
    // Log more detailed error information to the console (visible in Netlify logs)
    console.error('*** PDF Generation Failed ***');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Full Error Object:', error);

    // Optionally close browser if it was opened and the error occurred later
    if (browser) {
      console.log('Closing browser due to error...');
      try {
        await browser.close();
        console.log('Browser closed after error.');
      } catch (closeError) {
        console.error('Error closing browser after initial error:', closeError);
      }
    }

    // Return a more detailed error response
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: {
        name: error.name,
        message: error.message,
        // Optionally include stack in non-production for easier debugging
        stack: process.env.NODE_ENV !== 'production' ? error.stack : 'Stack trace hidden in production',
      }
    }, { status: 500 });
  } finally {
      // Ensure browser is closed if something went wrong before explicit close
      if (browser) {
          console.warn('Browser instance was not null in finally block, attempting close.');
          try {
              await browser.close();
          } catch (finalCloseError) {
              console.error('Error closing browser in finally block:', finalCloseError);
          }
      }
  }
} 