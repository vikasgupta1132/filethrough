import type { FileInfo } from './inspector/inspectFile';

export interface FileProcessedMessage {

  type: 'file-processed';

  changed: boolean;

  original: FileInfo;

  final: FileInfo;

  fileData: number[];
}
export interface FileProcessingFailedMessage {
  type: 'file-processing-failed';

  original: FileInfo;

  error: string;
}
export interface GetLastProcessedFileMessage {
  type: 'get-last-processed-file';
}
export interface DownloadLastProcessedFileMessage {
  type: 'download-last-processed-file';
}