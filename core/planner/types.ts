export interface TransformationPlan {
    convertTo?: 'jpeg' | 'png' | 'webp' | 'pdf';

    resize?: {
        width: number;
        height: number;
    };

    compress?: {
        minBytes?: number;
        maxBytes?: number;
        format?: 'jpeg' | 'png' | 'webp' | 'pdf';
    };

    // New: Remove alpha channel from PNG
    removeAlpha?: boolean;
}
