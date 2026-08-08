import type { TransformationPlan } from '../planner/types';

export async function transformImage(
    file: File,
    plan: TransformationPlan
): Promise<File> {
    if (!file.type.startsWith('image/')) {
        throw new Error(
            `Cannot transform non-image file: ${file.type}`
        );
    }

    const image = await loadImage(file);

    const width =
        plan.resize?.width ?? image.naturalWidth;

    const height =
        plan.resize?.height ?? image.naturalHeight;

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not create canvas context.');
    }

    // Prevent transparent PNG backgrounds from becoming black
    // when converting to JPEG.
    if (plan.convertTo === 'jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
    }

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    const outputType = getOutputMimeType(
        plan.convertTo,
        file.type
    );

    const blob = await canvasToBlob(
        canvas,
        outputType
    );

    const extension = getExtensionForMimeType(
        outputType
    );

    const outputName = replaceExtension(
        file.name,
        extension
    );

    return new File(
        [blob],
        outputName,
        {
            type: outputType,
            lastModified: Date.now(),
        }
    );
}

function loadImage(
    file: File
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(
                new Error('Unable to decode image.')
            );
        };

        image.src = url;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(
                        new Error('Failed to create image.')
                    );
                    return;
                }

                resolve(blob);
            },
            type
        );
    });
}

function getOutputMimeType(
    format: TransformationPlan['convertTo'],
    originalType: string
): string {
    switch (format) {
        case 'jpeg':
            return 'image/jpeg';

        case 'png':
            return 'image/png';

        case 'webp':
            return 'image/webp';

        default:
            return originalType;
    }
}

function getExtensionForMimeType(
    mimeType: string
): string {
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg';

        case 'image/png':
            return 'png';

        case 'image/webp':
            return 'webp';

        default:
            return 'img';
    }
}

function replaceExtension(
    fileName: string,
    extension: string
): string {
    const lastDot = fileName.lastIndexOf('.');

    if (lastDot === -1) {
        return `${fileName}.${extension}`;
    }

    return `${fileName.slice(0, lastDot)}.${extension}`;
}