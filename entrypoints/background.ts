import type {
  FileProcessedMessage,
  GetLastProcessedFileMessage,
} from '../core/messages';

let lastProcessedFile:
  FileProcessedMessage['file'] | null = null;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: FileProcessedMessage) => {
      if (message.type !== 'file-processed') {
        return;
      }

      lastProcessedFile = message.file;

      console.log(
        '[FileThrough] Background received processed file',
        message.file
      );
    }
  );

  browser.runtime.onMessage.addListener(
    (message: GetLastProcessedFileMessage) => {
      if (message.type !== 'get-last-processed-file') {
        return;
      }

      return Promise.resolve(lastProcessedFile);
    }
  );
});