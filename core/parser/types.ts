export interface UploadConstraints {
    minBytes?: number;
    maxBytes?: number;
    allowedFormats?: string[];

    dimensions?: {
        width: number;
        height: number;
    };
}