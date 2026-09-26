/**
 * Strips EXIF and GPS metadata from images
 *
 * PRIVACY NOTE: This function automatically removes all EXIF metadata including:
 * - GPS location data (latitude, longitude, altitude)
 * - Camera make and model
 * - Date and time taken
 * - Camera settings (ISO, aperture, shutter speed)
 * - Copyright and author information
 * - Software used to edit the image
 *
 * This happens naturally when drawing to a canvas - the canvas only contains
 * pixel data, no metadata. All transformed images are metadata-free.
 */
export async function stripImageMetadata(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
        throw new Error(`Cannot strip metadata from non-image file: ${file.type}`);
    }

    const image = await loadImage(file);
    const canvas = document.createElement('canvas');

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not create canvas context.');
    }

    // Draw image to canvas (strips all metadata)
    context.drawImage(image, 0, 0);

    // Export as original format or default to JPEG
    const outputType = file.type === 'image/png' ? 'image/png' :
                       file.type === 'image/webp' ? 'image/webp' :
                       'image/jpeg';

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to create image.'));
                    return;
                }
                resolve(blob);
            },
            outputType,
            0.95 // High quality for metadata stripping
        );
    });

    return new File([blob], file.name, {
        type: outputType,
        lastModified: Date.now(),
    });
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to decode image.'));
        };

        image.src = url;
    });
}
