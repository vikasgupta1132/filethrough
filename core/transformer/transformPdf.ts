import type { TransformationPlan } from '../planner/types';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && typeof browser !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = browser.runtime.getURL('pdfjs/pdf.worker.min.js');
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function transformPdf(
    file: File,
    plan: TransformationPlan
): Promise<File> {
    if (file.type !== 'application/pdf') {
        throw new Error(
            `Cannot transform non-PDF file: ${file.type}`
        );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (plan.convertTo && plan.convertTo !== 'pdf') {
        return convertPdfToImage(pdf, file, plan);
    }

    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    if (plan.resize) {
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            page.setSize(plan.resize.width, plan.resize.height);
        }
    }

    const outputBytes = await pdfDoc.save({
        useObjectStreams: false,
    });

    const outputType = getOutputMimeType(plan.convertTo, file.type);
    const extension = getExtensionForMimeType(outputType);
    const outputName = replaceExtension(file.name, extension);

    const blob = new Blob([outputBytes as unknown as ArrayBuffer], { type: outputType });

    return new File([blob], outputName, {
        type: outputType,
        lastModified: Date.now(),
    });
}

async function convertPdfToImage(
    pdf: pdfjsLib.PDFDocumentProxy,
    originalFile: File,
    plan: TransformationPlan
): Promise<File> {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not create canvas context');
    }

    let renderWidth = viewport.width;
    let renderHeight = viewport.height;

    if (plan.resize) {
        renderWidth = plan.resize.width;
        renderHeight = plan.resize.height;
        canvas.width = renderWidth;
        canvas.height = renderHeight;

        const scaleX = renderWidth / viewport.width;
        const scaleY = renderHeight / viewport.height;
        context.scale(scaleX, scaleY);
    } else {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
        canvasContext: context,
        viewport: page.getViewport({ scale: plan.resize ? 1 : 2.0 }),
        canvas: canvas,
    }).promise;

    const outputType = getOutputMimeType(plan.convertTo, originalFile.type);
    const blob = await canvasToBlob(canvas, outputType);
    const extension = getExtensionForMimeType(outputType);
    const outputName = replaceExtension(originalFile.name, extension);

    return new File([blob], outputName, {
        type: outputType,
        lastModified: Date.now(),
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
                    reject(new Error('Failed to create image.'));
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

        case 'pdf':
            return 'application/pdf';

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

        case 'application/pdf':
            return 'pdf';

        default:
            return 'pdf';
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