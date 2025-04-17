'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Eye, Download, FileText, Loader2 } from "lucide-react"

export default function Home() {
  const [htmlInput, setHtmlInput] = useState(
    '<h1 style="color: #8B5CF6;">Hello World</h1>\n<p>This is a sample HTML document.</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGeneratePdf = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: htmlInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'generated.pdf'; // Suggests filename for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(pdfUrl); // Clean up the object URL

    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center py-10 px-4">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text mb-2">
          HTML to PDF Scribe
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Convert your HTML code into beautifully formatted PDF documents
        </p>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* HTML Source Card */}
        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-500" />
              HTML Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter HTML here..."
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              rows={20}
              className="resize-y w-full h-[400px] md:h-[500px] font-mono text-sm border rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose dark:prose-invert prose-sm max-w-none border rounded-md p-4 h-[400px] md:h-[500px] overflow-auto bg-white dark:bg-gray-800 dark:border-gray-700"
              dangerouslySetInnerHTML={{ __html: htmlInput }}
            />
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">Error: {error}</p>
      )}

      <Button
        onClick={handleGeneratePdf}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {isLoading ? 'Generating...' : 'Generate & Download PDF'}
      </Button>
    </div>
  );
}
