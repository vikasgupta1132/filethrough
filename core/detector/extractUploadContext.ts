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

    // For now, inspect the input's parent container.
    const parent = input.parentElement;

    const nearbyText =
        parent?.innerText
            ?.replace(/\s+/g, ' ')
            .trim() || '';

    return {
        label,
        nearbyText,
        accept: input.getAttribute('accept'),
    };
}