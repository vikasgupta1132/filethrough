export interface UploadConstraints {
    minBytes?: number;
    maxBytes?: number;
    allowedFormats?: string[];

    dimensions?: {
        width: number;
        height: number;
    };

    // New: Support multiple dimension options
    dimensionOptions?: Array<{
        width: number;
        height: number;
    }>;

    // New: Maximum number of files
    maxFiles?: number;

    // New: Minimum number of files required
    minFiles?: number;

    // New: Format-specific constraints
    formatConstraints?: {
        png?: {
            noAlpha?: boolean;
            bitDepth?: number;
        };
        jpeg?: {
            quality?: number;
        };
    };

    // New: Whether file is required or optional
    required?: boolean;
}
