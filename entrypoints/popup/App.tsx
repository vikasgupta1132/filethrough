import { useEffect, useState } from 'react';
import type {
  FileProcessedMessage,
  GetLastProcessedFileMessage,
} from '../../core/messages';
import './App.css';

function App() {
  const [result, setResult] = useState<FileProcessedMessage | null>(null);

  useEffect(() => {
    const message: GetLastProcessedFileMessage = {
      type: 'get-last-processed-file',
    };

    browser.runtime.sendMessage(message).then((result) => {
      setResult(result);
    });
  }, []);

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const openWebsite = () => {
    browser.tabs.create({ url: 'https://filethrough.io' });
  };

  return (
    <div className="app">
      <header>
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2563eb" />
            <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1>FileThrough</h1>
        </div>
      </header>

      <main>
        <div className="status-card">
          <div className="status-indicator">
            <span className={result ? (result.changed ? 'processed' : 'compliant') : 'idle'} />
          </div>
          <div className="status-text">
            <p className="status-title">
              {result
                ? result.changed
                  ? 'File Processed'
                  : 'Already Compliant'
                : 'Ready to Process'}
            </p>
            <p className="status-subtitle">
              {result
                ? result.changed
                  ? 'Your file has been optimized for upload'
                  : 'No changes needed - file meets requirements'
                : 'FileThrough will automatically optimize files on upload pages'}
            </p>
          </div>
        </div>

        {result && (
          <div className="details">
            <h3>Last Processed</h3>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>{result.final.name}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{result.final.mimeType}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>
                  {formatBytes(result.original.sizeBytes)} → {formatBytes(result.final.sizeBytes)}
                  {result.changed && (
                    <span className="reduction">
                      (-{Math.round((1 - result.final.sizeBytes / result.original.sizeBytes) * 100)}%)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd>
                  {result.original.width} × {result.original.height}
                  {' → '}
                  {result.final.width} × {result.final.height}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </main>

      <footer>
        <div className="footer-links">
          <button onClick={openOptions} className="link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
          <button onClick={openWebsite} className="link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Website
          </button>
        </div>
        <p className="version">v1.0.0</p>
      </footer>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default App;