export interface FileInfo {
    name: string;
    mimeType: string;
    sizeBytes: number;
    extension: string;
    width?: number;
    height?: number;
}

export async function inspectFile(file: File): Promise<FileInfo> {
    const extension = getExtension(file.name);

    const info: FileInfo = {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        extension,
    };

    if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file);

        info.width = dimensions.width;
        info.height = dimensions.height;
    }

    return info;
}

function getExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');

    if (lastDot === -1) {
        return '';
    }

    return fileName
        .slice(lastDot + 1)
        .toLowerCase();
}

function getImageDimensions(
    file: File
): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            resolve({
                width: image.naturalWidth,
                height: image.naturalHeight,
            });

            URL.revokeObjectURL(url);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to read image dimensions.'));
        };

        image.src = url;
    });
}