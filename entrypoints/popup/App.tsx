import { useEffect, useState } from 'react';
import type {
  FileProcessedMessage,
  GetLastProcessedFileMessage,
} from '../../core/messages';
import './App.css';

function App() {
  const [file, setFile] =
    useState<FileProcessedMessage['file'] | null>(null);

  useEffect(() => {
    const message: GetLastProcessedFileMessage = {
      type: 'get-last-processed-file',
    };

    browser.runtime
      .sendMessage(message)
      .then((result) => {
        setFile(result);
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

      {file && (
        <div>
          <p>Last processed file:</p>
          <p>{file.name}</p>
          <p>{file.type}</p>
          <p>{file.sizeBytes} bytes</p>
        </div>
      )}
    </div>
  );
}

export default App;