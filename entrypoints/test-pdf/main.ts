import { inspectFile } from '../../core/inspector/inspectFile';
import { parseConstraints } from '../../core/parser/parseConstraints';
import { extractUploadContext } from '../../core/detector/extractUploadContext';
import { validateFile } from '../../core/validator/validateFile';
import { createTransformationPlan } from '../../core/planner/createTransformationPlan';
import { transformPdf } from '../../core/transformer/transformPdf';

const fileInput = document.getElementById('pdf-input') as HTMLInputElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;
const resultInfo = document.getElementById('result-info') as HTMLParagraphElement;
const resultImage = document.getElementById('result-image') as HTMLImageElement;

// Get format from URL parameter or default to jpeg
const urlParams = new URLSearchParams(window.location.search);
const targetFormat = (urlParams.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg';

fileInput.addEventListener('change', async (event) => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
        console.log('Processing file:', file.name, file.type, file.size);
        
        const context = extractUploadContext(fileInput);
        console.log('Upload context:', context);
        
        const constraints = parseConstraints(context);
        console.log('Constraints:', constraints);

        const fileInfo = await inspectFile(file);
        console.log('File info:', fileInfo);

        const validation = validateFile(fileInfo, constraints);
        console.log('Validation:', validation);

        const plan = createTransformationPlan(fileInfo, constraints);
        console.log('Plan:', plan);

        // Override plan to convert to target format
        plan.convertTo = targetFormat;

        const transformedFile = await transformPdf(file, plan);
        console.log('Transformed file:', transformedFile);

        const transformedInfo = await inspectFile(transformedFile);
        console.log('Transformed info:', transformedInfo);

        (window as any).__filethroughResult = {
            original: fileInfo,
            final: transformedInfo,
            changed: true,
        };

        resultInfo.textContent = `Original: ${fileInfo.mimeType} ${fileInfo.sizeBytes} bytes → Transformed: ${transformedInfo.mimeType} ${transformedInfo.sizeBytes} bytes (${transformedInfo.width}x${transformedInfo.height})`;
        resultImage.src = URL.createObjectURL(transformedFile);
        resultDiv.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        resultInfo.textContent = `Error: ${error}`;
        resultDiv.style.display = 'block';
    }
});