import { useEffect, useState } from 'react';
import type {
  FileProcessedMessage,
  GetLastProcessedFileMessage,
} from '../../core/messages';
import './App.css';

function App() {
const [result, setResult] =
  useState<FileProcessedMessage | null>(null);

  useEffect(() => {
    const message: GetLastProcessedFileMessage = {
      type: 'get-last-processed-file',
    };

browser.runtime
  .sendMessage(message)
  .then((result) => {
    setResult(result);
  });
  }, []);

  return (
    <div className="app">
      <h1>FileThrough</h1>

      <p className="status">
        ● Active
      </p>

      <p className="description">
        Automatically prepares files for upload requirements.
      </p>

      {result && (
        <div>
          <p>Last processed file:</p>
          <p>{result.final.name}</p>
          <p>{result.final.mimeType}</p>
          <p>{result.final.sizeBytes} bytes</p>
          <p>
  Size: {result.original.sizeBytes} bytes →{' '}
  {result.final.sizeBytes} bytes
</p>
<p>
  Dimensions:{' '}
  {result.original.width} × {result.original.height}
  {' → '}
  {result.final.width} × {result.final.height}
</p>
        </div>
      )}
    </div>
  );
}

export default App;