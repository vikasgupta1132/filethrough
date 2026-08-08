(function() {
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region core/parser/parseFileSize.ts
	function toBytes(value, unit) {
		switch (unit.toLowerCase()) {
			case "kb": return Math.round(value * 1024);
			case "mb": return Math.round(value * 1024 * 1024);
			case "gb": return Math.round(value * 1024 * 1024 * 1024);
			default: return Math.round(value);
		}
	}
	function parseFileSize(text) {
		const result = {};
		const normalizedText = text.replace(/\s+/g, " ").trim();
		for (const pattern of [/between\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s+and\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i, /(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s*(?:to|-|–|—)\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i]) {
			const match = normalizedText.match(pattern);
			if (match) {
				const minValue = match[1];
				const minUnit = match[2];
				const maxValue = match[3];
				const maxUnit = match[4];
				if (!minValue || !minUnit || !maxValue || !maxUnit) continue;
				result.minBytes = toBytes(Number.parseFloat(minValue), minUnit);
				result.maxBytes = toBytes(Number.parseFloat(maxValue), maxUnit);
				return result;
			}
		}
		for (const pattern of [
			/(?:maximum|max)\s+(?:file\s+)?size\s*:?\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
			/(?:file\s+)?size\s+(?:should\s+)?not\s+exceed\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
			/(?:file\s+)?(?:must\s+be\s+)?under\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
			/less\s+than\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i
		]) {
			const match = normalizedText.match(pattern);
			if (match) {
				const value = match[1];
				const unit = match[2];
				if (!value || !unit) continue;
				result.maxBytes = toBytes(Number.parseFloat(value), unit);
				return result;
			}
		}
		return result;
	}
	//#endregion
	//#region core/parser/parseFormats.ts
	function parseFormats(context) {
		const formats = /* @__PURE__ */ new Set();
		if (context.accept) {
			const acceptParts = context.accept.split(",");
			for (const part of acceptParts) {
				const value = part.trim().toLowerCase();
				if (value.startsWith(".")) formats.add(value.slice(1));
				if (value === "image/jpeg") {
					formats.add("jpg");
					formats.add("jpeg");
				}
				if (value === "image/png") formats.add("png");
				if (value === "image/webp") formats.add("webp");
				if (value === "application/pdf") formats.add("pdf");
			}
		}
		const text = context.nearbyText.toLowerCase();
		for (const format of [
			"jpg",
			"jpeg",
			"png",
			"webp",
			"pdf"
		]) if (new RegExp(`\\b${format}\\b`, "i").test(text)) formats.add(format);
		return Array.from(formats);
	}
	//#endregion
	//#region core/parser/parseDimensions.ts
	function parseDimensions(text) {
		const normalizedText = text.replace(/\s+/g, " ").trim();
		for (const pattern of [/(?:dimensions?|image\s+dimensions?|image\s+size)\s*:?\s*(\d+)\s*[x×]\s*(\d+)\s*(?:px|pixels?)?/i, /(\d+)\s*[x×]\s*(\d+)\s*(?:px|pixels?)/i]) {
			const match = normalizedText.match(pattern);
			if (match) {
				const width = match[1];
				const height = match[2];
				if (!width || !height) continue;
				return {
					width: Number.parseInt(width, 10),
					height: Number.parseInt(height, 10)
				};
			}
		}
	}
	//#endregion
	//#region core/parser/parseConstraints.ts
	function parseConstraints(context) {
		const sizeConstraints = parseFileSize(context.nearbyText);
		const allowedFormats = parseFormats(context);
		const dimensions = parseDimensions(context.nearbyText);
		return {
			...sizeConstraints,
			...allowedFormats.length > 0 && { allowedFormats },
			...dimensions && { dimensions }
		};
	}
	//#endregion
	//#region core/detector/extractUploadContext.ts
	function extractUploadContext(input) {
		let label = null;
		if (input.id) label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`)?.textContent?.trim() || null;
		if (!label) label = input.closest("label")?.textContent?.trim() || null;
		const nearbyText = input.parentElement?.innerText?.replace(/\s+/g, " ").trim() || "";
		return {
			label,
			nearbyText,
			accept: input.getAttribute("accept")
		};
	}
	//#endregion
	//#region core/inspector/inspectFile.ts
	async function inspectFile(file) {
		const extension = getExtension(file.name);
		const info = {
			name: file.name,
			mimeType: file.type,
			sizeBytes: file.size,
			extension
		};
		if (file.type.startsWith("image/")) {
			const dimensions = await getImageDimensions(file);
			info.width = dimensions.width;
			info.height = dimensions.height;
		}
		return info;
	}
	function getExtension(fileName) {
		const lastDot = fileName.lastIndexOf(".");
		if (lastDot === -1) return "";
		return fileName.slice(lastDot + 1).toLowerCase();
	}
	function getImageDimensions(file) {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const image = new Image();
			image.onload = () => {
				resolve({
					width: image.naturalWidth,
					height: image.naturalHeight
				});
				URL.revokeObjectURL(url);
			};
			image.onerror = () => {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("Unable to read image dimensions."));
			};
			image.src = url;
		});
	}
	//#endregion
	//#region core/validator/validateFile.ts
	function validateFile(file, constraints) {
		const issues = [];
		if (constraints.allowedFormats && constraints.allowedFormats.length > 0) {
			const fileFormat = file.extension.toLowerCase();
			if (!constraints.allowedFormats.some((format) => format.toLowerCase() === fileFormat)) issues.push({
				type: "format",
				message: `File format "${fileFormat}" is not allowed.`
			});
		}
		if (constraints.maxBytes !== void 0 && file.sizeBytes > constraints.maxBytes) issues.push({
			type: "size-too-large",
			message: `File is too large. Maximum allowed size is ${formatBytes(constraints.maxBytes)}.`
		});
		if (constraints.minBytes !== void 0 && file.sizeBytes < constraints.minBytes) issues.push({
			type: "size-too-small",
			message: `File is too small. Minimum required size is ${formatBytes(constraints.minBytes)}.`
		});
		if (constraints.dimensions) {
			const { width, height } = constraints.dimensions;
			if (file.width !== width || file.height !== height) issues.push({
				type: "dimensions",
				message: `Image dimensions must be ${width} × ${height}px.`
			});
		}
		return {
			isValid: issues.length === 0,
			issues
		};
	}
	function formatBytes(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1048576).toFixed(2)} MB`;
	}
	//#endregion
	//#region entrypoints/content.ts
	var content_default = defineContentScript({
		matches: ["<all_urls>"],
		main() {
			console.log("[FileThrough] Content script loaded");
			const detectedInputs = /* @__PURE__ */ new WeakSet();
			function registerFileInput(input) {
				if (detectedInputs.has(input)) return;
				detectedInputs.add(input);
				console.log("[FileThrough] Upload field detected", {
					accept: input.accept || "Not specified",
					multiple: input.multiple,
					name: input.name || "Not specified",
					id: input.id || "Not specified"
				});
				const context = extractUploadContext(input);
				console.log("[FileThrough] Upload context", context);
				const constraints = parseConstraints(context);
				console.log("[FileThrough] Upload constraints", constraints);
				input.addEventListener("change", async () => {
					const file = input.files?.[0];
					if (!file) return;
					try {
						const fileInfo = await inspectFile(file);
						console.log("[FileThrough] Selected file", fileInfo);
						const validation = validateFile(fileInfo, constraints);
						console.log("[FileThrough] Validation result", validation);
					} catch (error) {
						console.error("[FileThrough] Could not inspect file", error);
					}
				});
			}
			function scanForFileInputs(root = document) {
				root.querySelectorAll("input[type=\"file\"]").forEach(registerFileInput);
			}
			scanForFileInputs();
			new MutationObserver((mutations) => {
				for (const mutation of mutations) for (const node of mutation.addedNodes) {
					if (!(node instanceof HTMLElement)) continue;
					if (node instanceof HTMLInputElement && node.type === "file") registerFileInput(node);
					scanForFileInputs(node);
				}
			}).observe(document.documentElement, {
				childList: true,
				subtree: true
			});
		}
	});
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			if (!this.options?.noScriptStartedPostMessage) window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?/home/vikas/Desktop/filethrough/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbInByaW50IiwibG9nZ2VyIiwiYnJvd3NlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppdGlAMi43LjBfc3VwcG9ydHMtY29sb3JANy4yLjBfX3JvbGxkb3duQDEuMi4yX3R5cGVzY3JpcHRANS45XzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2dnZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3eHQtZGV2K2Jyb3dzZXJAMC4yLjUvbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaXRpQDIuNy4wX3N1cHBvcnRzLWNvbG9yQDcuMi4wX19yb2xsZG93bkAxLjIuMl90eXBlc2NyaXB0QDUuOV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppdGlAMi43LjBfc3VwcG9ydHMtY29sb3JANy4yLjBfX3JvbGxkb3duQDEuMi4yX3R5cGVzY3JpcHRANS45XzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0LnRzXG5mdW5jdGlvbiBkZWZpbmVDb250ZW50U2NyaXB0KGRlZmluaXRpb24pIHtcblx0cmV0dXJuIGRlZmluaXRpb247XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUNvbnRlbnRTY3JpcHQgfTtcbiIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcblxuZnVuY3Rpb24gdG9CeXRlcyh2YWx1ZTogbnVtYmVyLCB1bml0OiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRVbml0ID0gdW5pdC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgc3dpdGNoIChub3JtYWxpemVkVW5pdCkge1xuICAgICAgICBjYXNlICdrYic6XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMjQpO1xuXG4gICAgICAgIGNhc2UgJ21iJzpcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCAqIDEwMjQpO1xuXG4gICAgICAgIGNhc2UgJ2diJzpcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCAqIDEwMjQgKiAxMDI0KTtcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmlsZVNpemUodGV4dDogc3RyaW5nKTogVXBsb2FkQ29uc3RyYWludHMge1xuICAgIGNvbnN0IHJlc3VsdDogVXBsb2FkQ29uc3RyYWludHMgPSB7fTtcblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUZXh0ID0gdGV4dFxuICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXG4gICAgICAgIC50cmltKCk7XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIDEuIFJBTkdFIFBBVFRFUk5TXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vIEV4YW1wbGVzOlxuICAgIC8vIDIwIEtCIHRvIDEwMCBLQlxuICAgIC8vIDIwS0IgLSAxMDBLQlxuICAgIC8vIEJldHdlZW4gNTAgS0IgYW5kIDIwMCBLQlxuXG4gICAgY29uc3QgcmFuZ2VQYXR0ZXJucyA9IFtcbiAgICAgICAgL2JldHdlZW5cXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYilcXHMrYW5kXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXG5cbiAgICAgICAgLyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpXFxzKig/OnRvfC184oCTfOKAlClcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHJhbmdlUGF0dGVybnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBub3JtYWxpemVkVGV4dC5tYXRjaChwYXR0ZXJuKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IG1pblZhbHVlID0gbWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCBtaW5Vbml0ID0gbWF0Y2hbMl07XG4gICAgICAgICAgICBjb25zdCBtYXhWYWx1ZSA9IG1hdGNoWzNdO1xuICAgICAgICAgICAgY29uc3QgbWF4VW5pdCA9IG1hdGNoWzRdO1xuXG4gICAgICAgICAgICBpZiAoIW1pblZhbHVlIHx8ICFtaW5Vbml0IHx8ICFtYXhWYWx1ZSB8fCAhbWF4VW5pdCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN1bHQubWluQnl0ZXMgPSB0b0J5dGVzKFxuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KG1pblZhbHVlKSxcbiAgICAgICAgICAgICAgICBtaW5Vbml0XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXN1bHQubWF4Qnl0ZXMgPSB0b0J5dGVzKFxuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KG1heFZhbHVlKSxcbiAgICAgICAgICAgICAgICBtYXhVbml0XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAyLiBNQVhJTVVNIFBBVFRFUk5TXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vIEV4YW1wbGVzOlxuICAgIC8vIE1heGltdW0gZmlsZSBzaXplOiAyMDAgS0JcbiAgICAvLyBNYXggc2l6ZSAyIE1CXG4gICAgLy8gRmlsZSBzaXplIHNob3VsZCBub3QgZXhjZWVkIDUwMCBLQlxuICAgIC8vIEZpbGUgbXVzdCBiZSB1bmRlciAzMDAgS0JcbiAgICAvLyBMZXNzIHRoYW4gMSBNQlxuXG4gICAgY29uc3QgbWF4UGF0dGVybnMgPSBbXG4gICAgICAgIC8oPzptYXhpbXVtfG1heClcXHMrKD86ZmlsZVxccyspP3NpemVcXHMqOj9cXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcblxuICAgICAgICAvKD86ZmlsZVxccyspP3NpemVcXHMrKD86c2hvdWxkXFxzKyk/bm90XFxzK2V4Y2VlZFxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxuXG4gICAgICAgIC8oPzpmaWxlXFxzKyk/KD86bXVzdFxccytiZVxccyspP3VuZGVyXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXG5cbiAgICAgICAgL2xlc3NcXHMrdGhhblxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbWF4UGF0dGVybnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBub3JtYWxpemVkVGV4dC5tYXRjaChwYXR0ZXJuKTtcblxuXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIGNvbnN0IHVuaXQgPSBtYXRjaFsyXTtcblxuICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCAhdW5pdCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN1bHQubWF4Qnl0ZXMgPSB0b0J5dGVzKFxuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHZhbHVlKSxcbiAgICAgICAgICAgICAgICB1bml0XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZvcm1hdHMoXG4gICAgY29udGV4dDogVXBsb2FkQ29udGV4dFxuKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZvcm1hdHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIC8vIEhpZ2hlc3QtY29uZmlkZW5jZSBzb3VyY2U6IEhUTUwgYWNjZXB0IGF0dHJpYnV0ZVxuICAgIGlmIChjb250ZXh0LmFjY2VwdCkge1xuICAgICAgICBjb25zdCBhY2NlcHRQYXJ0cyA9IGNvbnRleHQuYWNjZXB0LnNwbGl0KCcsJyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIGFjY2VwdFBhcnRzKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCcuJykpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCh2YWx1ZS5zbGljZSgxKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL2pwZWcnKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ2pwZycpO1xuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdqcGVnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL3BuZycpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgncG5nJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL3dlYnAnKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ3dlYnAnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnYXBwbGljYXRpb24vcGRmJykge1xuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdwZGYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNlY29uZCBzb3VyY2U6IG5lYXJieSBpbnN0cnVjdGlvbnNcbiAgICBjb25zdCB0ZXh0ID0gY29udGV4dC5uZWFyYnlUZXh0LnRvTG93ZXJDYXNlKCk7XG5cbiAgICBjb25zdCBrbm93bkZvcm1hdHMgPSBbXG4gICAgICAgICdqcGcnLFxuICAgICAgICAnanBlZycsXG4gICAgICAgICdwbmcnLFxuICAgICAgICAnd2VicCcsXG4gICAgICAgICdwZGYnLFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IGZvcm1hdCBvZiBrbm93bkZvcm1hdHMpIHtcbiAgICAgICAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICBgXFxcXGIke2Zvcm1hdH1cXFxcYmAsXG4gICAgICAgICAgICAnaSdcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAocGF0dGVybi50ZXN0KHRleHQpKSB7XG4gICAgICAgICAgICBmb3JtYXRzLmFkZChmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZm9ybWF0cyk7XG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEaW1lbnNpb25zKFxuICAgIHRleHQ6IHN0cmluZ1xuKTogVXBsb2FkQ29uc3RyYWludHNbJ2RpbWVuc2lvbnMnXSB8IHVuZGVmaW5lZCB7XG5cbiAgICBjb25zdCBub3JtYWxpemVkVGV4dCA9IHRleHRcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxuICAgICAgICAudHJpbSgpO1xuXG4gICAgLy8gRXhhbXBsZXM6XG4gICAgLy8gRGltZW5zaW9uczogMjAwIHggMjMwIHBpeGVsc1xuICAgIC8vIDIwMHgyMzAgcHhcbiAgICAvLyAyMDAgw5cgMjMwIHBpeGVsc1xuICAgIC8vIEltYWdlIHNpemU6IDIwMCBYIDIzMFxuXG4gICAgY29uc3QgcGF0dGVybnMgPSBbXG4gICAgICAgIC8oPzpkaW1lbnNpb25zP3xpbWFnZVxccytkaW1lbnNpb25zP3xpbWFnZVxccytzaXplKVxccyo6P1xccyooXFxkKylcXHMqW3jDl11cXHMqKFxcZCspXFxzKig/OnB4fHBpeGVscz8pPy9pLFxuXG4gICAgICAgIC8oXFxkKylcXHMqW3jDl11cXHMqKFxcZCspXFxzKig/OnB4fHBpeGVscz8pL2ksXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IG1hdGNoWzJdO1xuXG4gICAgICAgICAgICBpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogTnVtYmVyLnBhcnNlSW50KHdpZHRoLCAxMCksXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBOdW1iZXIucGFyc2VJbnQoaGVpZ2h0LCAxMCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XG5pbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7IHBhcnNlRmlsZVNpemUgfSBmcm9tICcuL3BhcnNlRmlsZVNpemUnO1xuaW1wb3J0IHsgcGFyc2VGb3JtYXRzIH0gZnJvbSAnLi9wYXJzZUZvcm1hdHMnO1xuaW1wb3J0IHsgcGFyc2VEaW1lbnNpb25zIH0gZnJvbSAnLi9wYXJzZURpbWVuc2lvbnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb25zdHJhaW50cyhcbiAgICBjb250ZXh0OiBVcGxvYWRDb250ZXh0XG4pOiBVcGxvYWRDb25zdHJhaW50cyB7XG4gICAgY29uc3Qgc2l6ZUNvbnN0cmFpbnRzID0gcGFyc2VGaWxlU2l6ZShjb250ZXh0Lm5lYXJieVRleHQpO1xuICAgIGNvbnN0IGFsbG93ZWRGb3JtYXRzID0gcGFyc2VGb3JtYXRzKGNvbnRleHQpO1xuICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBwYXJzZURpbWVuc2lvbnMoY29udGV4dC5uZWFyYnlUZXh0KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC4uLnNpemVDb25zdHJhaW50cyxcblxuICAgICAgICAuLi4oYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMCAmJiB7XG4gICAgICAgICAgICBhbGxvd2VkRm9ybWF0cyxcbiAgICAgICAgfSksXG5cbiAgICAgICAgLi4uKGRpbWVuc2lvbnMgJiYge1xuICAgICAgICAgICAgZGltZW5zaW9ucyxcbiAgICAgICAgfSksXG4gICAgfTtcbn0iLCJleHBvcnQgaW50ZXJmYWNlIFVwbG9hZENvbnRleHQge1xuICAgIGxhYmVsOiBzdHJpbmcgfCBudWxsO1xuICAgIG5lYXJieVRleHQ6IHN0cmluZztcbiAgICBhY2NlcHQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VXBsb2FkQ29udGV4dChcbiAgICBpbnB1dDogSFRNTElucHV0RWxlbWVudFxuKTogVXBsb2FkQ29udGV4dCB7XG4gICAgbGV0IGxhYmVsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgIC8vIEZpbmQgPGxhYmVsIGZvcj1cImlucHV0LWlkXCI+XG4gICAgaWYgKGlucHV0LmlkKSB7XG4gICAgICAgIGNvbnN0IGxhYmVsRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTExhYmVsRWxlbWVudD4oXG4gICAgICAgICAgICBgbGFiZWxbZm9yPVwiJHtDU1MuZXNjYXBlKGlucHV0LmlkKX1cIl1gXG4gICAgICAgICk7XG5cbiAgICAgICAgbGFiZWwgPSBsYWJlbEVsZW1lbnQ/LnRleHRDb250ZW50Py50cmltKCkgfHwgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgaW5wdXRzIHdyYXBwZWQgaW5zaWRlIDxsYWJlbD5cbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudExhYmVsID0gaW5wdXQuY2xvc2VzdCgnbGFiZWwnKTtcblxuICAgICAgICBsYWJlbCA9IHBhcmVudExhYmVsPy50ZXh0Q29udGVudD8udHJpbSgpIHx8IG51bGw7XG4gICAgfVxuXG4gICAgLy8gRm9yIG5vdywgaW5zcGVjdCB0aGUgaW5wdXQncyBwYXJlbnQgY29udGFpbmVyLlxuICAgIGNvbnN0IHBhcmVudCA9IGlucHV0LnBhcmVudEVsZW1lbnQ7XG5cbiAgICBjb25zdCBuZWFyYnlUZXh0ID1cbiAgICAgICAgcGFyZW50Py5pbm5lclRleHRcbiAgICAgICAgICAgID8ucmVwbGFjZSgvXFxzKy9nLCAnICcpXG4gICAgICAgICAgICAudHJpbSgpIHx8ICcnO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWwsXG4gICAgICAgIG5lYXJieVRleHQsXG4gICAgICAgIGFjY2VwdDogaW5wdXQuZ2V0QXR0cmlidXRlKCdhY2NlcHQnKSxcbiAgICB9O1xufSIsImV4cG9ydCBpbnRlcmZhY2UgRmlsZUluZm8ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBtaW1lVHlwZTogc3RyaW5nO1xuICAgIHNpemVCeXRlczogbnVtYmVyO1xuICAgIGV4dGVuc2lvbjogc3RyaW5nO1xuICAgIHdpZHRoPzogbnVtYmVyO1xuICAgIGhlaWdodD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3BlY3RGaWxlKGZpbGU6IEZpbGUpOiBQcm9taXNlPEZpbGVJbmZvPiB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGZpbGUubmFtZSk7XG5cbiAgICBjb25zdCBpbmZvOiBGaWxlSW5mbyA9IHtcbiAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICBtaW1lVHlwZTogZmlsZS50eXBlLFxuICAgICAgICBzaXplQnl0ZXM6IGZpbGUuc2l6ZSxcbiAgICAgICAgZXh0ZW5zaW9uLFxuICAgIH07XG5cbiAgICBpZiAoZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBhd2FpdCBnZXRJbWFnZURpbWVuc2lvbnMoZmlsZSk7XG5cbiAgICAgICAgaW5mby53aWR0aCA9IGRpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIGluZm8uaGVpZ2h0ID0gZGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZm87XG59XG5cbmZ1bmN0aW9uIGdldEV4dGVuc2lvbihmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsYXN0RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcblxuICAgIGlmIChsYXN0RG90ID09PSAtMSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGVOYW1lXG4gICAgICAgIC5zbGljZShsYXN0RG90ICsgMSlcbiAgICAgICAgLnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIGdldEltYWdlRGltZW5zaW9ucyhcbiAgICBmaWxlOiBGaWxlXG4pOiBQcm9taXNlPHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG4gICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IGltYWdlLm5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGltYWdlLm5hdHVyYWxIZWlnaHQsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdVbmFibGUgdG8gcmVhZCBpbWFnZSBkaW1lbnNpb25zLicpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpbWFnZS5zcmMgPSB1cmw7XG4gICAgfSk7XG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4uL3BhcnNlci90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEZpbGVJbmZvIH0gZnJvbSAnLi4vaW5zcGVjdG9yL2luc3BlY3RGaWxlJztcblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uSXNzdWUge1xuICAgIHR5cGU6ICdmb3JtYXQnIHwgJ3NpemUtdG9vLWxhcmdlJyB8ICdzaXplLXRvby1zbWFsbCcgfCAnZGltZW5zaW9ucyc7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGlzVmFsaWQ6IGJvb2xlYW47XG4gICAgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRmlsZShcbiAgICBmaWxlOiBGaWxlSW5mbyxcbiAgICBjb25zdHJhaW50czogVXBsb2FkQ29uc3RyYWludHNcbik6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IGlzc3VlczogVmFsaWRhdGlvbklzc3VlW10gPSBbXTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBGb3JtYXRcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBpZiAoXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzICYmXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDBcbiAgICApIHtcbiAgICAgICAgY29uc3QgZmlsZUZvcm1hdCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgY29uc3QgYWxsb3dlZCA9IGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLnNvbWUoXG4gICAgICAgICAgICAoZm9ybWF0KSA9PiBmb3JtYXQudG9Mb3dlckNhc2UoKSA9PT0gZmlsZUZvcm1hdFxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghYWxsb3dlZCkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdmb3JtYXQnLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGZvcm1hdCBcIiR7ZmlsZUZvcm1hdH1cIiBpcyBub3QgYWxsb3dlZC5gLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTWF4aW11bSBmaWxlIHNpemVcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBpZiAoXG4gICAgICAgIGNvbnN0cmFpbnRzLm1heEJ5dGVzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZmlsZS5zaXplQnl0ZXMgPiBjb25zdHJhaW50cy5tYXhCeXRlc1xuICAgICkge1xuICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAnc2l6ZS10b28tbGFyZ2UnLFxuICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgaXMgdG9vIGxhcmdlLiBNYXhpbXVtIGFsbG93ZWQgc2l6ZSBpcyAke2Zvcm1hdEJ5dGVzKFxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLm1heEJ5dGVzXG4gICAgICAgICAgICApfS5gLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTWluaW11bSBmaWxlIHNpemVcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBpZiAoXG4gICAgICAgIGNvbnN0cmFpbnRzLm1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZmlsZS5zaXplQnl0ZXMgPCBjb25zdHJhaW50cy5taW5CeXRlc1xuICAgICkge1xuICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAnc2l6ZS10b28tc21hbGwnLFxuICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgaXMgdG9vIHNtYWxsLiBNaW5pbXVtIHJlcXVpcmVkIHNpemUgaXMgJHtmb3JtYXRCeXRlcyhcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5taW5CeXRlc1xuICAgICAgICAgICAgKX0uYCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIERpbWVuc2lvbnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBpZiAoY29uc3RyYWludHMuZGltZW5zaW9ucykge1xuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGNvbnN0cmFpbnRzLmRpbWVuc2lvbnM7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgZmlsZS53aWR0aCAhPT0gd2lkdGggfHxcbiAgICAgICAgICAgIGZpbGUuaGVpZ2h0ICE9PSBoZWlnaHRcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpbWVuc2lvbnMnLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBJbWFnZSBkaW1lbnNpb25zIG11c3QgYmUgJHt3aWR0aH0gw5cgJHtoZWlnaHR9cHguYCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaXNWYWxpZDogaXNzdWVzLmxlbmd0aCA9PT0gMCxcbiAgICAgICAgaXNzdWVzLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEJ5dGVzKGJ5dGVzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGlmIChieXRlcyA8IDEwMjQpIHtcbiAgICAgICAgcmV0dXJuIGAke2J5dGVzfSBCYDtcbiAgICB9XG5cbiAgICBpZiAoYnl0ZXMgPCAxMDI0ICogMTAyNCkge1xuICAgICAgICByZXR1cm4gYCR7TWF0aC5yb3VuZChieXRlcyAvIDEwMjQpfSBLQmA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAkeyhieXRlcyAvICgxMDI0ICogMTAyNCkpLnRvRml4ZWQoMil9IE1CYDtcbn0iLCJpbXBvcnQgeyBwYXJzZUNvbnN0cmFpbnRzIH0gZnJvbSAnLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cyc7XG5pbXBvcnQgeyBleHRyYWN0VXBsb2FkQ29udGV4dCB9IGZyb20gJy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQnO1xuaW1wb3J0IHsgaW5zcGVjdEZpbGUgfSBmcm9tICcuLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XG5pbXBvcnQgeyB2YWxpZGF0ZUZpbGUgfSBmcm9tICcuLi9jb3JlL3ZhbGlkYXRvci92YWxpZGF0ZUZpbGUnO1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29udGVudFNjcmlwdCh7XG4gIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxuXG4gIG1haW4oKSB7XG4gICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gQ29udGVudCBzY3JpcHQgbG9hZGVkJyk7XG5cbiAgICBjb25zdCBkZXRlY3RlZElucHV0cyA9IG5ldyBXZWFrU2V0PEhUTUxJbnB1dEVsZW1lbnQ+KCk7XG5cbiAgICBmdW5jdGlvbiByZWdpc3RlckZpbGVJbnB1dChpbnB1dDogSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgLy8gRG9uJ3QgcHJvY2VzcyB0aGUgc2FtZSBpbnB1dCB0d2ljZVxuICAgICAgaWYgKGRldGVjdGVkSW5wdXRzLmhhcyhpbnB1dCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBkZXRlY3RlZElucHV0cy5hZGQoaW5wdXQpO1xuXG4gICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgZmllbGQgZGV0ZWN0ZWQnLCB7XG4gICAgICAgIGFjY2VwdDogaW5wdXQuYWNjZXB0IHx8ICdOb3Qgc3BlY2lmaWVkJyxcbiAgICAgICAgbXVsdGlwbGU6IGlucHV0Lm11bHRpcGxlLFxuICAgICAgICBuYW1lOiBpbnB1dC5uYW1lIHx8ICdOb3Qgc3BlY2lmaWVkJyxcbiAgICAgICAgaWQ6IGlucHV0LmlkIHx8ICdOb3Qgc3BlY2lmaWVkJyxcbiAgICAgIH0pO1xuXG4gICAgICAvLzEuRXh0cmFjdCBjb250ZXh0XG4gICAgICBjb25zdCBjb250ZXh0ID0gZXh0cmFjdFVwbG9hZENvbnRleHQoaW5wdXQpO1xuICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGNvbnRleHQnLCBjb250ZXh0KTtcbiAgICAgIC8vMi5QYXJzZSBjb25zdHJhaW50c1xuICAgICAgY29uc3QgY29uc3RyYWludHMgPSBwYXJzZUNvbnN0cmFpbnRzKGNvbnRleHQpO1xuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGNvbnN0cmFpbnRzJyxcbiAgICAgICAgY29uc3RyYWludHNcbiAgICAgICk7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBpbnB1dC5maWxlcz8uWzBdO1xuXG4gICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBpbnNwZWN0RmlsZShmaWxlKTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gU2VsZWN0ZWQgZmlsZScsXG4gICAgICAgICAgICBmaWxlSW5mb1xuICAgICAgICAgICk7XG4gICAgICAgICAgLy8zLlZhbGlkYXRlIHRoZSBmaWxlXG4gICAgICAgICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRmlsZShmaWxlSW5mbywgY29uc3RyYWludHMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVmFsaWRhdGlvbiByZXN1bHQnLFxuICAgICAgICAgICAgdmFsaWRhdGlvblxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICdbRmlsZVRocm91Z2hdIENvdWxkIG5vdCBpbnNwZWN0IGZpbGUnLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuRm9yRmlsZUlucHV0cyhyb290OiBQYXJlbnROb2RlID0gZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IGlucHV0cyA9XG4gICAgICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbDxIVE1MSW5wdXRFbGVtZW50PignaW5wdXRbdHlwZT1cImZpbGVcIl0nKTtcblxuICAgICAgaW5wdXRzLmZvckVhY2gocmVnaXN0ZXJGaWxlSW5wdXQpO1xuICAgIH1cblxuICAgIC8vIFNjYW4gaW5wdXRzIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgcGFnZVxuICAgIHNjYW5Gb3JGaWxlSW5wdXRzKCk7XG5cbiAgICAvLyBXYXRjaCBmb3IgaW5wdXRzIGFkZGVkIGxhdGVyXG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xuICAgICAgICAgIGlmICghKG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFRoZSBhZGRlZCBlbGVtZW50IGl0c2VsZiBtaWdodCBiZSBhIGZpbGUgaW5wdXRcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBub2RlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJlxuICAgICAgICAgICAgbm9kZS50eXBlID09PSAnZmlsZSdcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlsZUlucHV0KG5vZGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE9yIGl0IG1pZ2h0IGNvbnRhaW4gZmlsZSBpbnB1dHNcbiAgICAgICAgICBzY2FuRm9yRmlsZUlucHV0cyhub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgfSk7XG4gIH0sXG59KTsiLCIvLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvZ2dlci50c1xuZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG5cdGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcblx0aWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSBtZXRob2QoYFt3eHRdICR7YXJncy5zaGlmdCgpfWAsIC4uLmFyZ3MpO1xuXHRlbHNlIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xufVxuLyoqIFdyYXBwZXIgYXJvdW5kIGBjb25zb2xlYCB3aXRoIGEgXCJbd3h0XVwiIHByZWZpeCAqL1xuY29uc3QgbG9nZ2VyID0ge1xuXHRkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuXHRsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG5cdHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuXHRlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBsb2dnZXIgfTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgYnJvd3NlciQxIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvYnJvd3Nlci50c1xuLyoqXG4qIENvbnRhaW5zIHRoZSBgYnJvd3NlcmAgZXhwb3J0IHdoaWNoIHlvdSBzaG91bGQgdXNlIHRvIGFjY2VzcyB0aGUgZXh0ZW5zaW9uXG4qIEFQSXMgaW4geW91ciBwcm9qZWN0OlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInO1xuKlxuKiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuKiAgIC8vIC4uLlxuKiB9KTtcbiogYGBgXG4qXG4qIEBtb2R1bGUgd3h0L2Jyb3dzZXJcbiovXG5jb25zdCBicm93c2VyID0gYnJvd3NlciQxO1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBicm93c2VyIH07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMudHNcbnZhciBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50ID0gY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcblx0c3RhdGljIEVWRU5UX05BTUUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIik7XG5cdGNvbnN0cnVjdG9yKG5ld1VybCwgb2xkVXJsKSB7XG5cdFx0c3VwZXIoV3h0TG9jYXRpb25DaGFuZ2VFdmVudC5FVkVOVF9OQU1FLCB7fSk7XG5cdFx0dGhpcy5uZXdVcmwgPSBuZXdVcmw7XG5cdFx0dGhpcy5vbGRVcmwgPSBvbGRVcmw7XG5cdH1cbn07XG4vKipcbiogUmV0dXJucyBhbiBldmVudCBuYW1lIHVuaXF1ZSB0byB0aGUgZXh0ZW5zaW9uIGFuZCBjb250ZW50IHNjcmlwdCB0aGF0J3NcbiogcnVubmluZy5cbiovXG5mdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG5cdHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCwgZ2V0VW5pcXVlRXZlbnROYW1lIH07XG4iLCJpbXBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci50c1xuY29uc3Qgc3VwcG9ydHNOYXZpZ2F0aW9uQXBpID0gdHlwZW9mIGdsb2JhbFRoaXMubmF2aWdhdGlvbj8uYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiO1xuLyoqXG4qIENyZWF0ZSBhIHV0aWwgdGhhdCB3YXRjaGVzIGZvciBVUkwgY2hhbmdlcywgZGlzcGF0Y2hpbmcgdGhlIGN1c3RvbSBldmVudCB3aGVuXG4qIGRldGVjdGVkLiBTdG9wcyB3YXRjaGluZyB3aGVuIGNvbnRlbnQgc2NyaXB0IGlzIGludmFsaWRhdGVkLiBVc2VzIE5hdmlnYXRpb25cbiogQVBJIHdoZW4gYXZhaWxhYmxlLCBvdGhlcndpc2UgZmFsbHMgYmFjayB0byBwb2xsaW5nLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcblx0bGV0IGxhc3RVcmw7XG5cdGxldCB3YXRjaGluZyA9IGZhbHNlO1xuXHRyZXR1cm4geyBydW4oKSB7XG5cdFx0aWYgKHdhdGNoaW5nKSByZXR1cm47XG5cdFx0d2F0Y2hpbmcgPSB0cnVlO1xuXHRcdGxhc3RVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdGlmIChzdXBwb3J0c05hdmlnYXRpb25BcGkpIGdsb2JhbFRoaXMubmF2aWdhdGlvbi5hZGRFdmVudExpc3RlbmVyKFwibmF2aWdhdGVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGV2ZW50LmRlc3RpbmF0aW9uLnVybCk7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgPT09IGxhc3RVcmwuaHJlZikgcmV0dXJuO1xuXHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdH0sIHsgc2lnbmFsOiBjdHguc2lnbmFsIH0pO1xuXHRcdGVsc2UgY3R4LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgIT09IGxhc3RVcmwuaHJlZikge1xuXHRcdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHRcdH1cblx0XHR9LCAxZTMpO1xuXHR9IH07XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9O1xuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgZ2V0VW5pcXVlRXZlbnROYW1lIH0gZnJvbSBcIi4vaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQudHNcbi8qKlxuKiBJbXBsZW1lbnRzXG4qIFtgQWJvcnRDb250cm9sbGVyYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0Fib3J0Q29udHJvbGxlcikuXG4qIFVzZWQgdG8gZGV0ZWN0IGFuZCBzdG9wIGNvbnRlbnQgc2NyaXB0IGNvZGUgd2hlbiB0aGUgc2NyaXB0IGlzIGludmFsaWRhdGVkLlxuKlxuKiBJdCBhbHNvIHByb3ZpZGVzIHNldmVyYWwgdXRpbGl0aWVzIGxpa2UgYGN0eC5zZXRUaW1lb3V0YCBhbmRcbiogYGN0eC5zZXRJbnRlcnZhbGAgdGhhdCBzaG91bGQgYmUgdXNlZCBpbiBjb250ZW50IHNjcmlwdHMgaW5zdGVhZCBvZlxuKiBgd2luZG93LnNldFRpbWVvdXRgIG9yIGB3aW5kb3cuc2V0SW50ZXJ2YWxgLlxuKlxuKiBUbyBjcmVhdGUgY29udGV4dCBmb3IgdGVzdGluZywgeW91IGNhbiB1c2UgdGhlIGNsYXNzJ3MgY29uc3RydWN0b3I6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH0gZnJvbSAnd3h0L3V0aWxzL2NvbnRlbnQtc2NyaXB0cy1jb250ZXh0JztcbipcbiogdGVzdCgnc3RvcmFnZSBsaXN0ZW5lciBzaG91bGQgYmUgcmVtb3ZlZCB3aGVuIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQnLCAoKSA9PiB7XG4qICAgY29uc3QgY3R4ID0gbmV3IENvbnRlbnRTY3JpcHRDb250ZXh0KCd0ZXN0Jyk7XG4qICAgY29uc3QgaXRlbSA9IHN0b3JhZ2UuZGVmaW5lSXRlbSgnbG9jYWw6Y291bnQnLCB7IGRlZmF1bHRWYWx1ZTogMCB9KTtcbiogICBjb25zdCB3YXRjaGVyID0gdmkuZm4oKTtcbipcbiogICBjb25zdCB1bndhdGNoID0gaXRlbS53YXRjaCh3YXRjaGVyKTtcbiogICBjdHgub25JbnZhbGlkYXRlZCh1bndhdGNoKTsgLy8gTGlzdGVuIGZvciBpbnZhbGlkYXRlIGhlcmVcbipcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRXaXRoKDEsIDApO1xuKlxuKiAgIGN0eC5ub3RpZnlJbnZhbGlkYXRlZCgpOyAvLyBVc2UgdGhpcyBmdW5jdGlvbiB0byBpbnZhbGlkYXRlIHRoZSBjb250ZXh0XG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgyKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiB9KTtcbiogYGBgXG4qL1xudmFyIENvbnRlbnRTY3JpcHRDb250ZXh0ID0gY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuXHRzdGF0aWMgU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmNvbnRlbnQtc2NyaXB0LXN0YXJ0ZWRcIik7XG5cdGlkO1xuXHRhYm9ydENvbnRyb2xsZXI7XG5cdGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcblx0Y29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcblx0XHR0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0XHR0aGlzLmlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG5cdFx0dGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG5cdFx0dGhpcy5zdG9wT2xkU2NyaXB0cygpO1xuXHRcdHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG5cdH1cblx0Z2V0IHNpZ25hbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuXHR9XG5cdGFib3J0KHJlYXNvbikge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuXHR9XG5cdGdldCBpc0ludmFsaWQoKSB7XG5cdFx0aWYgKGJyb3dzZXIucnVudGltZT8uaWQgPT0gbnVsbCkgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuXHR9XG5cdGdldCBpc1ZhbGlkKCkge1xuXHRcdHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG5cdH1cblx0LyoqXG5cdCogQWRkIGEgbGlzdGVuZXIgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBzY3JpcHQncyBjb250ZXh0IGlzXG5cdCogaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG5cdCogICBjb25zdCByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyID0gY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuXHQqICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcblx0KiAgIH0pO1xuXHQqICAgLy8gLi4uXG5cdCogICByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG5cdCpcblx0KiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIuXG5cdCovXG5cdG9uSW52YWxpZGF0ZWQoY2IpIHtcblx0XHR0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHRcdHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHR9XG5cdC8qKlxuXHQqIFJldHVybiBhIHByb21pc2UgdGhhdCBuZXZlciByZXNvbHZlcy4gVXNlZnVsIGlmIHlvdSBoYXZlIGFuIGFzeW5jIGZ1bmN0aW9uXG5cdCogdGhhdCBzaG91bGRuJ3QgcnVuIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcblx0KiAgICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcblx0KlxuXHQqICAgICAvLyAuLi5cblx0KiAgIH07XG5cdCovXG5cdGJsb2NrKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgoKSA9PiB7fSk7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogSW50ZXJ2YWxzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2xlYXJJbnRlcnZhbGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldFRpbWVvdXRgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIFRpbWVvdXRzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgc2V0VGltZW91dGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldFRpbWVvdXQoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFyVGltZW91dChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHNcblx0KiB0aGUgcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbEFuaW1hdGlvbkZyYW1lYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlXG5cdCogcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbElkbGVDYWxsYmFja2Bcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9LCBvcHRpb25zKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG5cdFx0aWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuXHRcdH1cblx0XHR0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLCBoYW5kbGVyLCB7XG5cdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0c2lnbmFsOiB0aGlzLnNpZ25hbFxuXHRcdH0pO1xuXHR9XG5cdC8qKlxuXHQqIEBpbnRlcm5hbFxuXHQqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuXHQqL1xuXHRub3RpZnlJbnZhbGlkYXRlZCgpIHtcblx0XHR0aGlzLmFib3J0KFwiQ29udGVudCBzY3JpcHQgY29udGV4dCBpbnZhbGlkYXRlZFwiKTtcblx0XHRsb2dnZXIuZGVidWcoYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgKTtcblx0fVxuXHRzdG9wT2xkU2NyaXB0cygpIHtcblx0XHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIHsgZGV0YWlsOiB7XG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0gfSkpO1xuXHRcdGlmICghdGhpcy5vcHRpb25zPy5ub1NjcmlwdFN0YXJ0ZWRQb3N0TWVzc2FnZSkgd2luZG93LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSwgXCIqXCIpO1xuXHR9XG5cdHZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkge1xuXHRcdGNvbnN0IGlzU2FtZUNvbnRlbnRTY3JpcHQgPSBldmVudC5kZXRhaWw/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdGNvbnN0IGlzRnJvbVNlbGYgPSBldmVudC5kZXRhaWw/Lm1lc3NhZ2VJZCA9PT0gdGhpcy5pZDtcblx0XHRyZXR1cm4gaXNTYW1lQ29udGVudFNjcmlwdCAmJiAhaXNGcm9tU2VsZjtcblx0fVxuXHRsaXN0ZW5Gb3JOZXdlclNjcmlwdHMoKSB7XG5cdFx0Y29uc3QgY2IgPSAoZXZlbnQpID0+IHtcblx0XHRcdGlmICghKGV2ZW50IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQpIHx8ICF0aGlzLnZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkpIHJldHVybjtcblx0XHRcdHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYik7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYikpO1xuXHR9XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9O1xuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDksMTAsMTEsMTIsMTMsMTRdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7O0NDREEsU0FBUyxRQUFRLE9BQWUsTUFBc0I7RUFHbEQsUUFGdUIsS0FBSyxZQUVwQixHQUFSO0dBQ0ksS0FBSyxNQUNELE9BQU8sS0FBSyxNQUFNLFFBQVEsSUFBSTtHQUVsQyxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxPQUFPLElBQUk7R0FFekMsS0FBSyxNQUNELE9BQU8sS0FBSyxNQUFNLFFBQVEsT0FBTyxPQUFPLElBQUk7R0FFaEQsU0FDSSxPQUFPLEtBQUssTUFBTSxLQUFLO0VBQy9CO0NBQ0o7Q0FFQSxTQUFnQixjQUFjLE1BQWlDO0VBQzNELE1BQU0sU0FBNEIsQ0FBQztFQUVuQyxNQUFNLGlCQUFpQixLQUNsQixRQUFRLFFBQVEsR0FBRyxDQUFDLENBQ3BCLEtBQUs7RUFpQlYsS0FBSyxNQUFNLFdBQVcsQ0FMbEIsZ0ZBRUEsNkVBR2tCLEdBQWU7R0FDakMsTUFBTSxRQUFRLGVBQWUsTUFBTSxPQUFPO0dBRTFDLElBQUksT0FBTztJQUNQLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sVUFBVSxNQUFNO0lBQ3RCLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sVUFBVSxNQUFNO0lBRXRCLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxT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