import { PDFDocument, rgb } from 'pdf-lib';

export async function compressPdf(
    file: File,
    options: {
        minBytes?: number;
        maxBytes?: number;
    }
): Promise<File> {
    const { minBytes, maxBytes } = options;

    if (file.type !== 'application/pdf') {
        throw new Error(
            `Cannot compress non-PDF file: ${file.type}`
        );
    }

    if (
        (minBytes === undefined || file.size >= minBytes) &&
        (maxBytes === undefined || file.size <= maxBytes)
    ) {
        return file;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    if (maxBytes !== undefined && file.size > maxBytes) {
        const compressed = await compressPdfToMaxSize(pdfDoc, maxBytes);
        if (compressed.size <= maxBytes) {
            return compressed;
        }
    }

    if (minBytes !== undefined && file.size < minBytes) {
        const padded = await padPdfToMinSize(pdfDoc, minBytes);
        if (padded.size >= minBytes) {
            return padded;
        }
    }

    throw new Error(
        `Unable to produce a PDF between ${minBytes ?? 0} and ${
            maxBytes ?? 'unlimited'
        } bytes.`
    );
}

async function compressPdfToMaxSize(
    pdfDoc: PDFDocument,
    maxBytes: number
): Promise<File> {
    const pages = pdfDoc.getPages();

    for (const page of pages) {
        const { width, height } = page.getSize();
        const scale = 0.9;

        page.setSize(width * scale, height * scale);
    }

    const outputBytes = await pdfDoc.save({
        useObjectStreams: false,
    });

    const blob = new Blob([outputBytes as unknown as ArrayBuffer], { type: 'application/pdf' });

    if (blob.size <= maxBytes) {
        return new File([blob], 'compressed.pdf', {
            type: 'application/pdf',
        });
    }

    return compressPdfToMaxSize(pdfDoc, maxBytes);
}

async function padPdfToMinSize(
    pdfDoc: PDFDocument,
    minBytes: number
): Promise<File> {
    const outputBytes = await pdfDoc.save({
        useObjectStreams: false,
    });

    if (outputBytes.length >= minBytes) {
        const blob = new Blob([outputBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
        return new File([blob], 'padded.pdf', {
            type: 'application/pdf',
        });
    }

    const paddingNeeded = minBytes - outputBytes.length;
    const paddingPage = pdfDoc.addPage();
    const { width, height } = paddingPage.getSize();

    paddingPage.drawText(' '.repeat(Math.ceil(paddingNeeded / 10)), {
        x: 0,
        y: height - 10,
        size: 1,
        color: rgb(1, 1, 1),
    });

    const paddedBytes = await pdfDoc.save({
        useObjectStreams: false,
    });

    const blob = new Blob([paddedBytes as unknown as ArrayBuffer], { type: 'application/pdf' });

    if (blob.size >= minBytes) {
        return new File([blob], 'padded.pdf', {
            type: 'application/pdf',
        });
    }

    return padPdfToMinSize(pdfDoc, minBytes);
}