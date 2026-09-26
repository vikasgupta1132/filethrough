import { describe, test, expect } from 'vitest';
import { parseDimensions } from '../parseDimensions';
import { parseFormats } from '../parseFormats';
import { parseFileQuantity } from '../parseFileQuantity';

describe('Enhanced Constraint Parsing', () => {
    describe('parseDimensions - Multiple Options', () => {
        test('parses multiple dimension options with "or"', () => {
            const text = 'Image dimensions: 1,280 x 800 or 640 x 400';
            const result = parseDimensions(text);

            expect(result.dimensionOptions).toEqual([
                { width: 1280, height: 800 },
                { width: 640, height: 400 },
            ]);
            expect(result.dimensions).toEqual({ width: 1280, height: 800 });
        });

        test('parses three dimension options', () => {
            const text = 'Accepted sizes: 1920x1080 or 1280x720 or 640x480';
            const result = parseDimensions(text);

            expect(result.dimensionOptions).toHaveLength(3);
            expect(result.dimensionOptions).toEqual([
                { width: 1920, height: 1080 },
                { width: 1280, height: 720 },
                { width: 640, height: 480 },
            ]);
        });

        test('handles single dimension when no "or" present', () => {
            const text = 'Image size: 800 x 600';
            const result = parseDimensions(text);

            expect(result.dimensions).toEqual({ width: 800, height: 600 });
            expect(result.dimensionOptions).toBeUndefined();
        });
    });

    describe('parseFormats - PNG Constraints', () => {
        test('detects 24-bit PNG (no alpha)', () => {
            const context = {
                nearbyText: 'JPEG or 24-bit PNG (no alpha)',
                accept: '',
                inputElement: null as any,
            };
            const result = parseFormats(context);

            expect(result.allowedFormats).toContain('png');
            expect(result.allowedFormats).toContain('jpeg');
            expect(result.formatConstraints?.png?.bitDepth).toBe(24);
            expect(result.formatConstraints?.png?.noAlpha).toBe(true);
        });

        test('detects PNG without transparency', () => {
            const context = {
                nearbyText: 'PNG without transparency or JPEG',
                accept: '',
                inputElement: null as any,
            };
            const result = parseFormats(context);

            expect(result.formatConstraints?.png?.noAlpha).toBe(true);
        });

        test('detects 32-bit PNG', () => {
            const context = {
                nearbyText: 'Upload 32-bit PNG files',
                accept: '',
                inputElement: null as any,
            };
            const result = parseFormats(context);

            expect(result.formatConstraints?.png?.bitDepth).toBe(32);
        });
    });

    describe('parseFileQuantity', () => {
        test('parses "Up to a maximum of 5"', () => {
            const text = 'Up to a maximum of 5 images';
            const result = parseFileQuantity(text);

            expect(result.maxFiles).toBe(5);
        });

        test('parses "At least one is required"', () => {
            const text = 'At least one is required';
            const result = parseFileQuantity(text);

            expect(result.minFiles).toBe(1);
            expect(result.required).toBe(true);
        });

        test('parses maximum files', () => {
            const text = 'Maximum 10 files allowed';
            const result = parseFileQuantity(text);

            expect(result.maxFiles).toBe(10);
        });

        test('parses "upload up to" pattern', () => {
            const text = 'You can upload up to 3 photos';
            const result = parseFileQuantity(text);

            expect(result.maxFiles).toBe(3);
        });

        test('detects required field', () => {
            const text = 'Profile picture (required)';
            const result = parseFileQuantity(text);

            expect(result.required).toBe(true);
            expect(result.minFiles).toBe(1);
        });

        test('detects optional field', () => {
            const text = 'Additional documents (optional)';
            const result = parseFileQuantity(text);

            expect(result.required).toBe(false);
        });

        test('handles both min and max', () => {
            const text = 'Upload at least 2 images, up to a maximum of 5';
            const result = parseFileQuantity(text);

            expect(result.minFiles).toBe(2);
            expect(result.maxFiles).toBe(5);
            expect(result.required).toBe(true);
        });
    });

    describe('Real-world example', () => {
        test('parses complex requirement text', () => {
            const requirementText = `
                Product Images
                Up to a maximum of 5
                1,280 x 800 or 640 x 400
                JPEG or 24-bit PNG (no alpha)
                At least one is required
            `;

            const dimensionResult = parseDimensions(requirementText);
            const formatResult = parseFormats({
                nearbyText: requirementText,
                accept: '',
                inputElement: null as any,
            });
            const quantityResult = parseFileQuantity(requirementText);

            // Check dimensions
            expect(dimensionResult.dimensionOptions).toEqual([
                { width: 1280, height: 800 },
                { width: 640, height: 400 },
            ]);

            // Check formats
            expect(formatResult.allowedFormats).toContain('jpeg');
            expect(formatResult.allowedFormats).toContain('png');
            expect(formatResult.formatConstraints?.png?.noAlpha).toBe(true);
            expect(formatResult.formatConstraints?.png?.bitDepth).toBe(24);

            // Check quantity
            expect(quantityResult.maxFiles).toBe(5);
            expect(quantityResult.minFiles).toBe(1);
            expect(quantityResult.required).toBe(true);
        });
    });
});
