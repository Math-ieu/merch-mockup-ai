import React, { useState, useCallback, useRef } from 'react';
import { generateImage, editImage } from './services/geminiService';
import { fileToBase64, getMimeType } from './utils/fileUtils';
import type { Status } from './types';

const UploadIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const SparklesIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DownloadIcon: React.FC<{ className: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const App: React.FC = () => {
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState<string>('a white t-shirt');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogo(file);
      const preview = await fileToBase64(file);
      setLogoPreview(preview);
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!logo || !productDescription) {
      setError('Please upload a logo and provide a product description.');
      return;
    }

    setStatus('generating');
    setError(null);
    setGeneratedImage(null);

    try {
      const logoBase64 = await fileToBase64(logo);
      const mimeType = getMimeType(logo.type);
      if (!mimeType) {
          throw new Error('Unsupported file type.');
      }

      const result = await generateImage(logoBase64, mimeType, productDescription);
      setGeneratedImage(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setStatus('error');
    }
  }, [logo, productDescription]);

  const handleEdit = useCallback(async () => {
    if (!generatedImage || !editPrompt) {
      setError('Please generate an image and provide an edit prompt.');
      return;
    }

    setStatus('editing');
    setError(null);

    try {
      const mimeType = generatedImage.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
      const base64Data = generatedImage.split(',')[1];
      const result = await editImage(base64Data, mimeType, editPrompt);
      setGeneratedImage(result);
      setEditPrompt('');
      setStatus('success');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setStatus('error');
    }
  }, [generatedImage, editPrompt]);
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'merch-mockup.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = status === 'generating' || status === 'editing';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Merch Mockup AI
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Upload your logo, describe a product, and let AI create stunning merchandise mockups. Refine and edit with simple text prompts.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm flex flex-col gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-400 mb-2 block">1. Upload Your Logo</label>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-gray-800/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                {logoPreview ? (
                  <div className="relative group">
                     <img src={logoPreview} alt="Logo Preview" className="mx-auto max-h-32 rounded-md" />
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white font-semibold">Change Logo</span>
                     </div>
                  </div>
                ) : (
                  <>
                    <UploadIcon className="w-12 h-12 mx-auto text-gray-500" />
                    <p className="mt-2 text-gray-400">Click to upload or drag & drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="productDescription" className="text-sm font-semibold text-gray-400 mb-2 block">2. Describe the Product</label>
              <textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
                placeholder="e.g., a black hoodie on a hanger, a coffee mug on a wooden table"
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!logo || !productDescription || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-purple-900/50"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>{status === 'generating' ? 'Generating...' : 'Generate Mockup'}</span>
            </button>
            
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm flex flex-col items-center justify-center min-h-[400px]">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto"></div>
                <p className="mt-4 text-gray-400">{status === 'generating' ? 'Creating your mockup...' : 'Applying your edits...'}</p>
                <p className="text-sm text-gray-500">This can take a moment, please wait.</p>
              </div>
            ) : generatedImage ? (
              <div className="w-full flex flex-col gap-4">
                <div className="relative">
                  <img src={generatedImage} alt="Generated Mockup" className="w-full rounded-lg shadow-2xl" />
                  <button onClick={handleDownload} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                      <DownloadIcon className="w-5 h-5"/>
                  </button>
                </div>
                <div>
                  <label htmlFor="editPrompt" className="text-sm font-semibold text-gray-400 mb-2 block">3. Edit Your Image (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      id="editPrompt"
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g., Add a retro filter, remove the background"
                      className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleEdit}
                      disabled={!editPrompt || isLoading}
                      className="bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <SparklesIcon className="w-16 h-16 mx-auto" />
                <p className="mt-4">Your generated mockup will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
