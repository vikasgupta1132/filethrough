export interface FileProcessedMessage {
  type: 'file-processed';

  file: {
    name: string;
    type: string;
    sizeBytes: number;
  };
}

export interface GetLastProcessedFileMessage {
  type: 'get-last-processed-file';
}