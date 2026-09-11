import type { FileInfo } from './inspector/inspectFile';

export interface FileProcessedMessage {
  type: 'file-processed';

  original: FileInfo;

  final: FileInfo;
}

export interface GetLastProcessedFileMessage {
  type: 'get-last-processed-file';
}