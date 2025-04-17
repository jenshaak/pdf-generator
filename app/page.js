'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Code, Eye, Download, Loader2, FileText, Type } from "lucide-react"
import { marked } from 'marked'

export default function Home() {
  const defaultHtml = '<h1 style="color: #8B5CF6;">Hello World</h1>\n<p>This is a sample HTML document.</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>';
  const defaultMarkdown = '# Hello World\n\nThis is a sample *Markdown* document.\n\n- Item 1\n- Item 2\n- Item 3';

  const [inputMode, setInputMode] = useState('html');
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [textInput, setTextInput] = useState(defaultHtml);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(defaultHtml);

  const handleInputChange = (value) => {
    setTextInput(value);
    try {
      if (inputMode === 'markdown') {
        setPreviewHtml(marked.parse(value));
      } else {
        setPreviewHtml(value);
      }
      setError(null);
    } catch (parseError) {
      console.error("Preview parsing error:", parseError);
      setError(`Preview Error: ${parseError.message}`);
      setPreviewHtml("<p class='text-red-500'>Error rendering preview.</p>");
    }
  };

  const handleInputModeChange = (mode) => {
    setInputMode(mode);
    if (mode === 'markdown') {
      setTextInput(defaultMarkdown);
      setPreviewHtml(marked.parse(defaultMarkdown));
    } else {
      setTextInput(defaultHtml);
      setPreviewHtml(defaultHtml);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const requestBody = {
        [inputMode]: textInput,
        outputFormat: outputFormat
      };

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const filename = `generated.${outputFormat}`;

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(fileUrl);

    } catch (err) {
      console.error(`Failed to generate ${outputFormat}:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center py-10 px-4">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text mb-2">
          Scribe Engine
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Convert your HTML or Markdown into beautifully formatted documents
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-6 w-full max-w-3xl justify-center">
        <RadioGroup defaultValue="html" onValueChange={handleInputModeChange} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <Label className="font-semibold mr-2">Input:</Label>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="html" id="html" />
            <Label htmlFor="html">HTML</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="markdown" id="markdown" />
            <Label htmlFor="markdown">Markdown</Label>
          </div>
        </RadioGroup>

        <RadioGroup defaultValue="pdf" onValueChange={setOutputFormat} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
           <Label className="font-semibold mr-2">Output:</Label>
           <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf">PDF</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="docx" id="docx" />
            <Label htmlFor="docx">DOCX</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {inputMode === 'html' ? <Code className="w-5 h-5 text-purple-500" /> : <Type className="w-5 h-5 text-purple-500" />}
              {inputMode === 'html' ? 'HTML' : 'Markdown'} Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={`Enter ${inputMode === 'html' ? 'HTML' : 'Markdown'} here...`}
              value={textInput}
              onChange={(e) => handleInputChange(e.target.value)}
              rows={20}
              className="resize-y w-full h-[400px] md:h-[500px] font-mono text-sm border rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Preview (HTML Rendered)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose dark:prose-invert prose-sm max-w-none border rounded-md p-4 h-[400px] md:h-[500px] overflow-auto bg-white dark:bg-gray-800 dark:border-gray-700"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">Error: {error}</p>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {isLoading ? 'Generating...' : `Generate & Download ${outputFormat.toUpperCase()}`}
      </Button>
    </div>
  );
}
