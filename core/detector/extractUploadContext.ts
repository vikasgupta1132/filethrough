export interface UploadContext {
    label: string | null;
    nearbyText: string;
    accept: string | null;
}

export function extractUploadContext(
    input: HTMLInputElement
): UploadContext {
    let label: string | null = null;

    // Find <label for="input-id">
    if (input.id) {
        const labelElement = document.querySelector<HTMLLabelElement>(
            `label[for="${CSS.escape(input.id)}"]`
        );

        label = labelElement?.textContent?.trim() || null;
    }

    // Handle inputs wrapped inside <label>
    if (!label) {
        const parentLabel = input.closest('label');

        label = parentLabel?.textContent?.trim() || null;
    }

    // Extract nearby text by searching parent containers
    let nearbyText = '';
    
    // Try immediate parent first
    const parent = input.parentElement;
    if (parent) {
        nearbyText = parent.innerText?.replace(/\s+/g, ' ').trim() || '';
    }

    // If the immediate parent has limited text, try going up the DOM tree
    if (nearbyText.length < 20) {
        let currentElement: HTMLElement | null = parent;
        let attempts = 0;
        const maxAttempts = 5;

        while (currentElement && attempts < maxAttempts) {
            currentElement = currentElement.parentElement;
            attempts++;

            if (currentElement) {
                const text = currentElement.innerText?.replace(/\s+/g, ' ').trim() || '';
                
                // Use this text if it's more informative
                if (text.length > nearbyText.length && text.length < 500) {
                    nearbyText = text;
                    break;
                }
            }
        }
    }

    return {
        label,
        nearbyText,
        accept: input.getAttribute('accept'),
    };
}