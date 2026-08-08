export interface TransformationPlan {
    convertTo?: 'jpeg' | 'png' | 'webp' | 'pdf';

    resize?: {
        width: number;
        height: number;
    };

    compress?: {
        maxBytes: number;
    };
}