import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { marked } from 'marked';
import htmlToDocx from 'html-to-docx';

// No need for getExecutablePath function - chromium package handles it

export async function POST(request) {
  let browser = null;
  console.log('Received request for /api/generate-pdf (now supports DOCX)');
  try {
    const body = await request.json();
    let htmlContent = body.html;
    const markdownContent = body.markdown;
    const outputFormat = body.outputFormat === 'docx' ? 'docx' : 'pdf';

    console.log('Parsed request body keys:', Object.keys(body));
    console.log('Requested output format:', outputFormat);

    if (!htmlContent && !markdownContent) {
      console.log('HTML or Markdown content missing from request body.');
      return NextResponse.json({ error: 'Either \'html\' or \'markdown\' content is required' }, { status: 400 });
    }

    if (htmlContent && markdownContent) {
      console.log('Both HTML and Markdown content provided. Please send only one.');
      return NextResponse.json({ error: 'Provide either \'html\' or \'markdown\', not both' }, { status: 400 });
    }

    if (markdownContent) {
      console.log('Processing Markdown content...');
      htmlContent = await marked.parse(markdownContent);
      console.log('Markdown converted to HTML length:', htmlContent?.length);
    } else {
      console.log('Processing HTML content...');
      console.log('HTML content length:', htmlContent?.length);
    }

    let fileBuffer;
    let headers = {};
    const filename = `generated.${outputFormat}`;

    if (outputFormat === 'docx') {
      console.log('Generating DOCX buffer...');
      fileBuffer = await htmlToDocx(htmlContent);
      console.log('DOCX buffer generated, size:', fileBuffer.length);
      headers = {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      };
    } else {
      console.log('Generating PDF buffer...');
      console.log('Launching Puppeteer via @sparticuz/chromium...');
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      console.log('Puppeteer launched successfully.');

      const page = await browser.newPage();
      console.log('New page created.');

      console.log('Setting page content...');
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      console.log('Page content set.');

      fileBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });
      console.log('PDF buffer generated, size:', fileBuffer.length);

      console.log('Closing browser...');
      await browser.close();
      browser = null;
      console.log('Browser closed.');

      headers = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      };
    }

    console.log(`Returning ${outputFormat.toUpperCase()} response.`);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error(`*** ${outputFormat?.toUpperCase() ?? 'File'} Generation Failed ***`);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Full Error Object:', error);

    if (browser) {
      console.log('Closing browser due to error...');
      try { await browser.close(); console.log('Browser closed after error.'); } catch (closeError) { console.error('Error closing browser after initial error:', closeError); }
    }

    return NextResponse.json({
      error: `Failed to generate ${outputFormat?.toUpperCase() ?? 'file'}`,
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