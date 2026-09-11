import type {
  FileProcessedMessage,
  FileProcessingFailedMessage,
  GetLastProcessedFileMessage,
} from '../core/messages';

let lastProcessedResult:
  FileProcessedMessage | null = null;

let lastProcessingError:
  FileProcessingFailedMessage | null = null;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: FileProcessedMessage) => {
      if (message.type !== 'file-processed') {
        return;
      }

      lastProcessedResult = message;
      lastProcessingError = null;

      console.log(
        '[FileThrough] Background received processed file',
        message.final
      );
    }
  );
  browser.runtime.onMessage.addListener(
  (message: FileProcessingFailedMessage) => {
    if (message.type !== 'file-processing-failed') {
      return;
    }

    lastProcessingError = message;
    lastProcessedResult = null;

    console.error(
      '[FileThrough] Processing failed',
      message.error
    );
  }
);
  browser.runtime.onMessage.addListener(
    (message: GetLastProcessedFileMessage) => {
      if (message.type !== 'get-last-processed-file') {
        return;
      }

      return Promise.resolve(lastProcessedResult);
    }
  );
});