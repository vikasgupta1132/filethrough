import { extractUploadContext } from '../core/detector/extractUploadContext';

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
      const context = extractUploadContext(input);

      console.log('[FileThrough] Upload context', context);
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