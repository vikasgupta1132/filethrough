import type { FileProcessedMessage } from '../core/messages';
import { parseConstraints } from '../core/parser/parseConstraints';
import { extractUploadContext } from '../core/detector/extractUploadContext';
import { inspectFile } from '../core/inspector/inspectFile';
import { validateFile } from '../core/validator/validateFile';
import { createTransformationPlan } from '../core/planner/createTransformationPlan';
import { transformImage } from '../core/transformer/transformImage';
import { compressImage } from '../core/transformer/compressImage';
export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    console.log('[FileThrough] Content script loaded');

    const detectedInputs = new WeakSet<HTMLInputElement>();

    function registerFileInput(input: HTMLInputElement) {
      // Don't process the same input twice
      if (detectedInputs.has(input)) {
        return;
      }

      detectedInputs.add(input);

      console.log('[FileThrough] Upload field detected', {
        accept: input.accept || 'Not specified',
        multiple: input.multiple,
        name: input.name || 'Not specified',
        id: input.id || 'Not specified',
      });

      //1.Extract context
      const context = extractUploadContext(input);
      console.log('[FileThrough] Upload context', context);
      //2.Parse constraints
      const constraints = parseConstraints(context);

      console.log(
        '[FileThrough] Upload constraints',
        constraints
      );
      input.addEventListener('change', async (event) => {
        if (event.isTrusted === false) {
  return;
}
        const file = input.files?.[0];

        if (!file) {
          return;
        }

        try {
          const fileInfo = await inspectFile(file);

          console.log(
            '[FileThrough] Selected file',
            fileInfo
          );
          //3.Validate the file
          const validation = validateFile(fileInfo, constraints);
          console.log(
            '[FileThrough] Validation result',
            validation
          );

          //4.Create transformation plan
          const plan = createTransformationPlan(fileInfo, constraints);
          console.log('[FileThrough] Transformation plan', plan);
       if (Object.keys(plan).length > 0) {
  let transformedFile = file;
  let finalFile = file;
  let finalInfo = fileInfo;

  try {
    transformedFile =
      await transformImage(file, plan);

    const transformedInfo =
      await inspectFile(transformedFile);

    console.log(
      '[FileThrough] Transformed file',
      transformedInfo
    );

    finalFile = transformedFile;
    finalInfo = transformedInfo;
  }
  catch (error) {
    console.error(
      '[FileThrough] Transformation failed',
      error
    );
  }

  if (plan.compress) {
    try {
      finalFile = await compressImage(
        transformedFile,
        {
          minBytes: plan.compress.minBytes,
          maxBytes: plan.compress.maxBytes,
          format: plan.compress.format,
        }
      );

      finalInfo =
        await inspectFile(finalFile);

      console.log(
        '[FileThrough] Compressed file',
        finalInfo
      );
    }
    catch (error) {
      console.error(
        '[FileThrough] Compression failed',
        error
      );
    }
  }

  replaceInputFile(input, finalFile);

  input.dispatchEvent(
    new Event('change', {
      bubbles: true,
    })
  );

  console.log(
    '[FileThrough] Final file injected',
    {
      name: finalFile.name,
      type: finalFile.type,
      sizeBytes: finalFile.size,
    }
  );

  const message: FileProcessedMessage = {
    type: 'file-processed',
    original: fileInfo,
    final: finalInfo,
  };

  browser.runtime.sendMessage(message);
}

        }
        catch (error) {
          console.error('[FileThrough] Could not inspect file', error);
        }
      });
    }

    function replaceInputFile(
  input: HTMLInputElement,
  file: File
) {
  const dataTransfer = new DataTransfer();

  dataTransfer.items.add(file);

  input.files = dataTransfer.files;
}

    function scanForFileInputs(root: ParentNode = document) {
      const inputs =
        root.querySelectorAll<HTMLInputElement>('input[type="file"]');

      inputs.forEach(registerFileInput);
    }

    // Scan inputs already present on the page
    scanForFileInputs();

    // Watch for inputs added later
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }

          // The added element itself might be a file input
          if (
            node instanceof HTMLInputElement &&
            node.type === 'file'
          ) {
            registerFileInput(node);
          }

          // Or it might contain file inputs
          scanForFileInputs(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  },
});