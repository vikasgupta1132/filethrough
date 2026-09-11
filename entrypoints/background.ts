import type {
  FileProcessedMessage,
  GetLastProcessedFileMessage,
} from '../core/messages';

let lastProcessedResult:
  FileProcessedMessage | null = null;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: FileProcessedMessage) => {
      if (message.type !== 'file-processed') {
        return;
      }

      lastProcessedResult = message;

      console.log(
        '[FileThrough] Background received processed file',
        message.final
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