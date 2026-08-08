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
	//#region core/planner/createTransformationPlan.ts
	function createTransformationPlan(file, constraints) {
		const plan = {};
		if (constraints.allowedFormats && constraints.allowedFormats.length > 0) {
			const currentFormat = file.extension.toLowerCase();
			if (!constraints.allowedFormats.includes(currentFormat)) {
				const targetFormat = chooseTargetFormat(constraints.allowedFormats);
				if (targetFormat) plan.convertTo = targetFormat;
			}
		}
		if (constraints.dimensions) {
			const { width, height } = constraints.dimensions;
			if (file.width !== width || file.height !== height) plan.resize = {
				width,
				height
			};
		}
		if (constraints.maxBytes !== void 0 && file.sizeBytes > constraints.maxBytes) plan.compress = { maxBytes: constraints.maxBytes };
		return plan;
	}
	function chooseTargetFormat(allowedFormats) {
		const normalized = allowedFormats.map((format) => format.toLowerCase());
		if (normalized.includes("jpeg")) return "jpeg";
		if (normalized.includes("jpg")) return "jpeg";
		if (normalized.includes("png")) return "png";
		if (normalized.includes("webp")) return "webp";
	}
	//#endregion
	//#region core/transformer/transformImage.ts
	async function transformImage(file, plan) {
		if (!file.type.startsWith("image/")) throw new Error(`Cannot transform non-image file: ${file.type}`);
		const image = await loadImage(file);
		const width = plan.resize?.width ?? image.naturalWidth;
		const height = plan.resize?.height ?? image.naturalHeight;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not create canvas context.");
		if (plan.convertTo === "jpeg") {
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, width, height);
		}
		context.drawImage(image, 0, 0, width, height);
		const outputType = getOutputMimeType(plan.convertTo, file.type);
		const blob = await canvasToBlob(canvas, outputType);
		const extension = getExtensionForMimeType(outputType);
		const outputName = replaceExtension(file.name, extension);
		return new File([blob], outputName, {
			type: outputType,
			lastModified: Date.now()
		});
	}
	function loadImage(file) {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const image = new Image();
			image.onload = () => {
				URL.revokeObjectURL(url);
				resolve(image);
			};
			image.onerror = () => {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("Unable to decode image."));
			};
			image.src = url;
		});
	}
	function canvasToBlob(canvas, type) {
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(/* @__PURE__ */ new Error("Failed to create image."));
					return;
				}
				resolve(blob);
			}, type);
		});
	}
	function getOutputMimeType(format, originalType) {
		switch (format) {
			case "jpeg": return "image/jpeg";
			case "png": return "image/png";
			case "webp": return "image/webp";
			default: return originalType;
		}
	}
	function getExtensionForMimeType(mimeType) {
		switch (mimeType) {
			case "image/jpeg": return "jpg";
			case "image/png": return "png";
			case "image/webp": return "webp";
			default: return "img";
		}
	}
	function replaceExtension(fileName, extension) {
		const lastDot = fileName.lastIndexOf(".");
		if (lastDot === -1) return `${fileName}.${extension}`;
		return `${fileName.slice(0, lastDot)}.${extension}`;
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
						const plan = createTransformationPlan(fileInfo, constraints);
						console.log("[FileThrough] Transformation plan", plan);
						if (Object.keys(plan).length > 0) try {
							const transformedInfo = await inspectFile(await transformImage(file, plan));
							console.log("[FileThrough] Transformed file", transformedInfo);
						} catch (error) {
							console.error("[FileThrough] Transformation failed", error);
						}
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbInByaW50IiwibG9nZ2VyIiwiYnJvd3NlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4udHMiLCIuLi8uLi8uLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjIuNS9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaXRpQDIuNy4wX3N1cHBvcnRzLWNvbG9yQDcuMi4wX19yb2xsZG93bkAxLjIuMl90eXBlc2NyaXB0QDUuOV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppdGlAMi43LjBfc3VwcG9ydHMtY29sb3JANy4yLjBfX3JvbGxkb3duQDEuMi4yX3R5cGVzY3JpcHRANS45XzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaXRpQDIuNy4wX3N1cHBvcnRzLWNvbG9yQDcuMi4wX19yb2xsZG93bkAxLjIuMl90eXBlc2NyaXB0QDUuOV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4vdHlwZXMnO1xuXG5mdW5jdGlvbiB0b0J5dGVzKHZhbHVlOiBudW1iZXIsIHVuaXQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFVuaXQgPSB1bml0LnRvTG93ZXJDYXNlKCk7XG5cbiAgICBzd2l0Y2ggKG5vcm1hbGl6ZWRVbml0KSB7XG4gICAgICAgIGNhc2UgJ2tiJzpcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCk7XG5cbiAgICAgICAgY2FzZSAnbWInOlxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0ICogMTAyNCk7XG5cbiAgICAgICAgY2FzZSAnZ2InOlxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0ICogMTAyNCAqIDEwMjQpO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlU2l6ZSh0ZXh0OiBzdHJpbmcpOiBVcGxvYWRDb25zdHJhaW50cyB7XG4gICAgY29uc3QgcmVzdWx0OiBVcGxvYWRDb25zdHJhaW50cyA9IHt9O1xuXG4gICAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSB0ZXh0XG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAgICAgLnRyaW0oKTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gMS4gUkFOR0UgUEFUVEVSTlNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLy8gRXhhbXBsZXM6XG4gICAgLy8gMjAgS0IgdG8gMTAwIEtCXG4gICAgLy8gMjBLQiAtIDEwMEtCXG4gICAgLy8gQmV0d2VlbiA1MCBLQiBhbmQgMjAwIEtCXG5cbiAgICBjb25zdCByYW5nZVBhdHRlcm5zID0gW1xuICAgICAgICAvYmV0d2VlblxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKVxccythbmRcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcblxuICAgICAgICAvKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYilcXHMqKD86dG98LXzigJN84oCUKVxccyooXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcmFuZ2VQYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbWluVmFsdWUgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIGNvbnN0IG1pblVuaXQgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgIGNvbnN0IG1heFZhbHVlID0gbWF0Y2hbM107XG4gICAgICAgICAgICBjb25zdCBtYXhVbml0ID0gbWF0Y2hbNF07XG5cbiAgICAgICAgICAgIGlmICghbWluVmFsdWUgfHwgIW1pblVuaXQgfHwgIW1heFZhbHVlIHx8ICFtYXhVbml0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdC5taW5CeXRlcyA9IHRvQnl0ZXMoXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQobWluVmFsdWUpLFxuICAgICAgICAgICAgICAgIG1pblVuaXRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJlc3VsdC5tYXhCeXRlcyA9IHRvQnl0ZXMoXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQobWF4VmFsdWUpLFxuICAgICAgICAgICAgICAgIG1heFVuaXRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIDIuIE1BWElNVU0gUEFUVEVSTlNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLy8gRXhhbXBsZXM6XG4gICAgLy8gTWF4aW11bSBmaWxlIHNpemU6IDIwMCBLQlxuICAgIC8vIE1heCBzaXplIDIgTUJcbiAgICAvLyBGaWxlIHNpemUgc2hvdWxkIG5vdCBleGNlZWQgNTAwIEtCXG4gICAgLy8gRmlsZSBtdXN0IGJlIHVuZGVyIDMwMCBLQlxuICAgIC8vIExlc3MgdGhhbiAxIE1CXG5cbiAgICBjb25zdCBtYXhQYXR0ZXJucyA9IFtcbiAgICAgICAgLyg/Om1heGltdW18bWF4KVxccysoPzpmaWxlXFxzKyk/c2l6ZVxccyo6P1xccyooXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxuXG4gICAgICAgIC8oPzpmaWxlXFxzKyk/c2l6ZVxccysoPzpzaG91bGRcXHMrKT9ub3RcXHMrZXhjZWVkXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXG5cbiAgICAgICAgLyg/OmZpbGVcXHMrKT8oPzptdXN0XFxzK2JlXFxzKyk/dW5kZXJcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcblxuICAgICAgICAvbGVzc1xccyt0aGFuXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBtYXhQYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuXG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgdW5pdCA9IG1hdGNoWzJdO1xuXG4gICAgICAgICAgICBpZiAoIXZhbHVlIHx8ICF1bml0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdC5tYXhCeXRlcyA9IHRvQnl0ZXMoXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQodmFsdWUpLFxuICAgICAgICAgICAgICAgIHVuaXRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29udGV4dCB9IGZyb20gJy4uL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRm9ybWF0cyhcbiAgICBjb250ZXh0OiBVcGxvYWRDb250ZXh0XG4pOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZm9ybWF0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgLy8gSGlnaGVzdC1jb25maWRlbmNlIHNvdXJjZTogSFRNTCBhY2NlcHQgYXR0cmlidXRlXG4gICAgaWYgKGNvbnRleHQuYWNjZXB0KSB7XG4gICAgICAgIGNvbnN0IGFjY2VwdFBhcnRzID0gY29udGV4dC5hY2NlcHQuc3BsaXQoJywnKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgYWNjZXB0UGFydHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcGFydC50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKHZhbHVlLnNsaWNlKDEpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2UvanBlZycpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgnanBnJyk7XG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ2pwZWcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2UvcG5nJykge1xuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdwbmcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2Uvd2VicCcpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgnd2VicCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdhcHBsaWNhdGlvbi9wZGYnKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ3BkZicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2Vjb25kIHNvdXJjZTogbmVhcmJ5IGluc3RydWN0aW9uc1xuICAgIGNvbnN0IHRleHQgPSBjb250ZXh0Lm5lYXJieVRleHQudG9Mb3dlckNhc2UoKTtcblxuICAgIGNvbnN0IGtub3duRm9ybWF0cyA9IFtcbiAgICAgICAgJ2pwZycsXG4gICAgICAgICdqcGVnJyxcbiAgICAgICAgJ3BuZycsXG4gICAgICAgICd3ZWJwJyxcbiAgICAgICAgJ3BkZicsXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIGtub3duRm9ybWF0cykge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIGBcXFxcYiR7Zm9ybWF0fVxcXFxiYCxcbiAgICAgICAgICAgICdpJ1xuICAgICAgICApO1xuXG4gICAgICAgIGlmIChwYXR0ZXJuLnRlc3QodGV4dCkpIHtcbiAgICAgICAgICAgIGZvcm1hdHMuYWRkKGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gQXJyYXkuZnJvbShmb3JtYXRzKTtcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZURpbWVuc2lvbnMoXG4gICAgdGV4dDogc3RyaW5nXG4pOiBVcGxvYWRDb25zdHJhaW50c1snZGltZW5zaW9ucyddIHwgdW5kZWZpbmVkIHtcblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUZXh0ID0gdGV4dFxuICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXG4gICAgICAgIC50cmltKCk7XG5cbiAgICAvLyBFeGFtcGxlczpcbiAgICAvLyBEaW1lbnNpb25zOiAyMDAgeCAyMzAgcGl4ZWxzXG4gICAgLy8gMjAweDIzMCBweFxuICAgIC8vIDIwMCDDlyAyMzAgcGl4ZWxzXG4gICAgLy8gSW1hZ2Ugc2l6ZTogMjAwIFggMjMwXG5cbiAgICBjb25zdCBwYXR0ZXJucyA9IFtcbiAgICAgICAgLyg/OmRpbWVuc2lvbnM/fGltYWdlXFxzK2RpbWVuc2lvbnM/fGltYWdlXFxzK3NpemUpXFxzKjo/XFxzKihcXGQrKVxccypbeMOXXVxccyooXFxkKylcXHMqKD86cHh8cGl4ZWxzPyk/L2ksXG5cbiAgICAgICAgLyhcXGQrKVxccypbeMOXXVxccyooXFxkKylcXHMqKD86cHh8cGl4ZWxzPykvaSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZFRleHQubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gbWF0Y2hbMl07XG5cbiAgICAgICAgICAgIGlmICghd2lkdGggfHwgIWhlaWdodCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIucGFyc2VJbnQod2lkdGgsIDEwKSxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IE51bWJlci5wYXJzZUludChoZWlnaHQsIDEwKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29udGV4dCB9IGZyb20gJy4uL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcbmltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcblxuaW1wb3J0IHsgcGFyc2VGaWxlU2l6ZSB9IGZyb20gJy4vcGFyc2VGaWxlU2l6ZSc7XG5pbXBvcnQgeyBwYXJzZUZvcm1hdHMgfSBmcm9tICcuL3BhcnNlRm9ybWF0cyc7XG5pbXBvcnQgeyBwYXJzZURpbWVuc2lvbnMgfSBmcm9tICcuL3BhcnNlRGltZW5zaW9ucyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbnN0cmFpbnRzKFxuICAgIGNvbnRleHQ6IFVwbG9hZENvbnRleHRcbik6IFVwbG9hZENvbnN0cmFpbnRzIHtcbiAgICBjb25zdCBzaXplQ29uc3RyYWludHMgPSBwYXJzZUZpbGVTaXplKGNvbnRleHQubmVhcmJ5VGV4dCk7XG4gICAgY29uc3QgYWxsb3dlZEZvcm1hdHMgPSBwYXJzZUZvcm1hdHMoY29udGV4dCk7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IHBhcnNlRGltZW5zaW9ucyhjb250ZXh0Lm5lYXJieVRleHQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc2l6ZUNvbnN0cmFpbnRzLFxuXG4gICAgICAgIC4uLihhbGxvd2VkRm9ybWF0cy5sZW5ndGggPiAwICYmIHtcbiAgICAgICAgICAgIGFsbG93ZWRGb3JtYXRzLFxuICAgICAgICB9KSxcblxuICAgICAgICAuLi4oZGltZW5zaW9ucyAmJiB7XG4gICAgICAgICAgICBkaW1lbnNpb25zLFxuICAgICAgICB9KSxcbiAgICB9O1xufSIsImV4cG9ydCBpbnRlcmZhY2UgVXBsb2FkQ29udGV4dCB7XG4gICAgbGFiZWw6IHN0cmluZyB8IG51bGw7XG4gICAgbmVhcmJ5VGV4dDogc3RyaW5nO1xuICAgIGFjY2VwdDogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RVcGxvYWRDb250ZXh0KFxuICAgIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50XG4pOiBVcGxvYWRDb250ZXh0IHtcbiAgICBsZXQgbGFiZWw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgLy8gRmluZCA8bGFiZWwgZm9yPVwiaW5wdXQtaWRcIj5cbiAgICBpZiAoaW5wdXQuaWQpIHtcbiAgICAgICAgY29uc3QgbGFiZWxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTGFiZWxFbGVtZW50PihcbiAgICAgICAgICAgIGBsYWJlbFtmb3I9XCIke0NTUy5lc2NhcGUoaW5wdXQuaWQpfVwiXWBcbiAgICAgICAgKTtcblxuICAgICAgICBsYWJlbCA9IGxhYmVsRWxlbWVudD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCBudWxsO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBpbnB1dHMgd3JhcHBlZCBpbnNpZGUgPGxhYmVsPlxuICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgY29uc3QgcGFyZW50TGFiZWwgPSBpbnB1dC5jbG9zZXN0KCdsYWJlbCcpO1xuXG4gICAgICAgIGxhYmVsID0gcGFyZW50TGFiZWw/LnRleHRDb250ZW50Py50cmltKCkgfHwgbnVsbDtcbiAgICB9XG5cbiAgICAvLyBGb3Igbm93LCBpbnNwZWN0IHRoZSBpbnB1dCdzIHBhcmVudCBjb250YWluZXIuXG4gICAgY29uc3QgcGFyZW50ID0gaW5wdXQucGFyZW50RWxlbWVudDtcblxuICAgIGNvbnN0IG5lYXJieVRleHQgPVxuICAgICAgICBwYXJlbnQ/LmlubmVyVGV4dFxuICAgICAgICAgICAgPy5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAgICAgICAgIC50cmltKCkgfHwgJyc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbCxcbiAgICAgICAgbmVhcmJ5VGV4dCxcbiAgICAgICAgYWNjZXB0OiBpbnB1dC5nZXRBdHRyaWJ1dGUoJ2FjY2VwdCcpLFxuICAgIH07XG59IiwiZXhwb3J0IGludGVyZmFjZSBGaWxlSW5mbyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIG1pbWVUeXBlOiBzdHJpbmc7XG4gICAgc2l6ZUJ5dGVzOiBudW1iZXI7XG4gICAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gICAgd2lkdGg/OiBudW1iZXI7XG4gICAgaGVpZ2h0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zcGVjdEZpbGUoZmlsZTogRmlsZSk6IFByb21pc2U8RmlsZUluZm8+IHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZmlsZS5uYW1lKTtcblxuICAgIGNvbnN0IGluZm86IEZpbGVJbmZvID0ge1xuICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgIG1pbWVUeXBlOiBmaWxlLnR5cGUsXG4gICAgICAgIHNpemVCeXRlczogZmlsZS5zaXplLFxuICAgICAgICBleHRlbnNpb24sXG4gICAgfTtcblxuICAgIGlmIChmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IGF3YWl0IGdldEltYWdlRGltZW5zaW9ucyhmaWxlKTtcblxuICAgICAgICBpbmZvLndpZHRoID0gZGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgaW5mby5oZWlnaHQgPSBkaW1lbnNpb25zLmhlaWdodDtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5mbztcbn1cblxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxhc3REb3QgPSBmaWxlTmFtZS5sYXN0SW5kZXhPZignLicpO1xuXG4gICAgaWYgKGxhc3REb3QgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZU5hbWVcbiAgICAgICAgLnNsaWNlKGxhc3REb3QgKyAxKVxuICAgICAgICAudG9Mb3dlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW1hZ2VEaW1lbnNpb25zKFxuICAgIGZpbGU6IEZpbGVcbik6IFByb21pc2U8eyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICB3aWR0aDogaW1hZ2UubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byByZWFkIGltYWdlIGRpbWVuc2lvbnMuJykpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICB9KTtcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi4vcGFyc2VyL3R5cGVzJztcbmltcG9ydCB0eXBlIHsgRmlsZUluZm8gfSBmcm9tICcuLi9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRpb25Jc3N1ZSB7XG4gICAgdHlwZTogJ2Zvcm1hdCcgfCAnc2l6ZS10b28tbGFyZ2UnIHwgJ3NpemUtdG9vLXNtYWxsJyB8ICdkaW1lbnNpb25zJztcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgaXNWYWxpZDogYm9vbGVhbjtcbiAgICBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVGaWxlKFxuICAgIGZpbGU6IEZpbGVJbmZvLFxuICAgIGNvbnN0cmFpbnRzOiBVcGxvYWRDb25zdHJhaW50c1xuKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXSA9IFtdO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIEZvcm1hdFxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGlmIChcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMgJiZcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgICBjb25zdCBmaWxlRm9ybWF0ID0gZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBjb25zdCBhbGxvd2VkID0gY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMuc29tZShcbiAgICAgICAgICAgIChmb3JtYXQpID0+IGZvcm1hdC50b0xvd2VyQ2FzZSgpID09PSBmaWxlRm9ybWF0XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFhbGxvd2VkKSB7XG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Zvcm1hdCcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgZm9ybWF0IFwiJHtmaWxlRm9ybWF0fVwiIGlzIG5vdCBhbGxvd2VkLmAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBNYXhpbXVtIGZpbGUgc2l6ZVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGlmIChcbiAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBmaWxlLnNpemVCeXRlcyA+IGNvbnN0cmFpbnRzLm1heEJ5dGVzXG4gICAgKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6ICdzaXplLXRvby1sYXJnZScsXG4gICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBpcyB0b28gbGFyZ2UuIE1heGltdW0gYWxsb3dlZCBzaXplIGlzICR7Zm9ybWF0Qnl0ZXMoXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXNcbiAgICAgICAgICAgICl9LmAsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBNaW5pbXVtIGZpbGUgc2l6ZVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGlmIChcbiAgICAgICAgY29uc3RyYWludHMubWluQnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBmaWxlLnNpemVCeXRlcyA8IGNvbnN0cmFpbnRzLm1pbkJ5dGVzXG4gICAgKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6ICdzaXplLXRvby1zbWFsbCcsXG4gICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBpcyB0b28gc21hbGwuIE1pbmltdW0gcmVxdWlyZWQgc2l6ZSBpcyAke2Zvcm1hdEJ5dGVzKFxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLm1pbkJ5dGVzXG4gICAgICAgICAgICApfS5gLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRGltZW5zaW9uc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGlmIChjb25zdHJhaW50cy5kaW1lbnNpb25zKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gY29uc3RyYWludHMuZGltZW5zaW9ucztcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBmaWxlLndpZHRoICE9PSB3aWR0aCB8fFxuICAgICAgICAgICAgZmlsZS5oZWlnaHQgIT09IGhlaWdodFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGltZW5zaW9ucycsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEltYWdlIGRpbWVuc2lvbnMgbXVzdCBiZSAke3dpZHRofSDDlyAke2hlaWdodH1weC5gLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpc1ZhbGlkOiBpc3N1ZXMubGVuZ3RoID09PSAwLFxuICAgICAgICBpc3N1ZXMsXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0Qnl0ZXMoYnl0ZXM6IG51bWJlcik6IHN0cmluZyB7XG4gICAgaWYgKGJ5dGVzIDwgMTAyNCkge1xuICAgICAgICByZXR1cm4gYCR7Ynl0ZXN9IEJgO1xuICAgIH1cblxuICAgIGlmIChieXRlcyA8IDEwMjQgKiAxMDI0KSB7XG4gICAgICAgIHJldHVybiBgJHtNYXRoLnJvdW5kKGJ5dGVzIC8gMTAyNCl9IEtCYDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCR7KGJ5dGVzIC8gKDEwMjQgKiAxMDI0KSkudG9GaXhlZCgyKX0gTUJgO1xufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuLi9wYXJzZXIvdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBGaWxlSW5mbyB9IGZyb20gJy4uL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XG5pbXBvcnQgdHlwZSB7IFRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuKFxuICAgIGZpbGU6IEZpbGVJbmZvLFxuICAgIGNvbnN0cmFpbnRzOiBVcGxvYWRDb25zdHJhaW50c1xuKTogVHJhbnNmb3JtYXRpb25QbGFuIHtcbiAgICBjb25zdCBwbGFuOiBUcmFuc2Zvcm1hdGlvblBsYW4gPSB7fTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBGb3JtYXQgY29udmVyc2lvblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGlmIChcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMgJiZcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgICBjb25zdCBjdXJyZW50Rm9ybWF0ID0gZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBjb25zdCBmb3JtYXRBbGxvd2VkID1cbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLmluY2x1ZGVzKGN1cnJlbnRGb3JtYXQpO1xuXG4gICAgICAgIGlmICghZm9ybWF0QWxsb3dlZCkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Rm9ybWF0ID0gY2hvb3NlVGFyZ2V0Rm9ybWF0KFxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0Rm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcGxhbi5jb252ZXJ0VG8gPSB0YXJnZXRGb3JtYXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRGltZW5zaW9uc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGlmIChjb25zdHJhaW50cy5kaW1lbnNpb25zKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gY29uc3RyYWludHMuZGltZW5zaW9ucztcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBmaWxlLndpZHRoICE9PSB3aWR0aCB8fFxuICAgICAgICAgICAgZmlsZS5oZWlnaHQgIT09IGhlaWdodFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHBsYW4ucmVzaXplID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRmlsZSBzaXplXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKFxuICAgICAgICBjb25zdHJhaW50cy5tYXhCeXRlcyAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXNcbiAgICApIHtcbiAgICAgICAgcGxhbi5jb21wcmVzcyA9IHtcbiAgICAgICAgICAgIG1heEJ5dGVzOiBjb25zdHJhaW50cy5tYXhCeXRlcyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGxhbjtcbn1cblxuZnVuY3Rpb24gY2hvb3NlVGFyZ2V0Rm9ybWF0KFxuICAgIGFsbG93ZWRGb3JtYXRzOiBzdHJpbmdbXVxuKTogVHJhbnNmb3JtYXRpb25QbGFuWydjb252ZXJ0VG8nXSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGFsbG93ZWRGb3JtYXRzLm1hcCgoZm9ybWF0KSA9PlxuICAgICAgICBmb3JtYXQudG9Mb3dlckNhc2UoKVxuICAgICk7XG5cbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnanBlZycpKSB7XG4gICAgICAgIHJldHVybiAnanBlZyc7XG4gICAgfVxuXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ2pwZycpKSB7XG4gICAgICAgIHJldHVybiAnanBlZyc7XG4gICAgfVxuXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ3BuZycpKSB7XG4gICAgICAgIHJldHVybiAncG5nJztcbiAgICB9XG5cbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnd2VicCcpKSB7XG4gICAgICAgIHJldHVybiAnd2VicCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn0iLCJpbXBvcnQgdHlwZSB7IFRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4uL3BsYW5uZXIvdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJhbnNmb3JtSW1hZ2UoXG4gICAgZmlsZTogRmlsZSxcbiAgICBwbGFuOiBUcmFuc2Zvcm1hdGlvblBsYW5cbik6IFByb21pc2U8RmlsZT4ge1xuICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBDYW5ub3QgdHJhbnNmb3JtIG5vbi1pbWFnZSBmaWxlOiAke2ZpbGUudHlwZX1gXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgaW1hZ2UgPSBhd2FpdCBsb2FkSW1hZ2UoZmlsZSk7XG5cbiAgICBjb25zdCB3aWR0aCA9XG4gICAgICAgIHBsYW4ucmVzaXplPy53aWR0aCA/PyBpbWFnZS5uYXR1cmFsV2lkdGg7XG5cbiAgICBjb25zdCBoZWlnaHQgPVxuICAgICAgICBwbGFuLnJlc2l6ZT8uaGVpZ2h0ID8/IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG5cbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY3JlYXRlIGNhbnZhcyBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIC8vIFByZXZlbnQgdHJhbnNwYXJlbnQgUE5HIGJhY2tncm91bmRzIGZyb20gYmVjb21pbmcgYmxhY2tcbiAgICAvLyB3aGVuIGNvbnZlcnRpbmcgdG8gSlBFRy5cbiAgICBpZiAocGxhbi5jb252ZXJ0VG8gPT09ICdqcGVnJykge1xuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmZmZmJztcbiAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBjb250ZXh0LmRyYXdJbWFnZShcbiAgICAgICAgaW1hZ2UsXG4gICAgICAgIDAsXG4gICAgICAgIDAsXG4gICAgICAgIHdpZHRoLFxuICAgICAgICBoZWlnaHRcbiAgICApO1xuXG4gICAgY29uc3Qgb3V0cHV0VHlwZSA9IGdldE91dHB1dE1pbWVUeXBlKFxuICAgICAgICBwbGFuLmNvbnZlcnRUbyxcbiAgICAgICAgZmlsZS50eXBlXG4gICAgKTtcblxuICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBjYW52YXNUb0Jsb2IoXG4gICAgICAgIGNhbnZhcyxcbiAgICAgICAgb3V0cHV0VHlwZVxuICAgICk7XG5cbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb25Gb3JNaW1lVHlwZShcbiAgICAgICAgb3V0cHV0VHlwZVxuICAgICk7XG5cbiAgICBjb25zdCBvdXRwdXROYW1lID0gcmVwbGFjZUV4dGVuc2lvbihcbiAgICAgICAgZmlsZS5uYW1lLFxuICAgICAgICBleHRlbnNpb25cbiAgICApO1xuXG4gICAgcmV0dXJuIG5ldyBGaWxlKFxuICAgICAgICBbYmxvYl0sXG4gICAgICAgIG91dHB1dE5hbWUsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IG91dHB1dFR5cGUsXG4gICAgICAgICAgICBsYXN0TW9kaWZpZWQ6IERhdGUubm93KCksXG4gICAgICAgIH1cbiAgICApO1xufVxuXG5mdW5jdGlvbiBsb2FkSW1hZ2UoXG4gICAgZmlsZTogRmlsZVxuKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gICAgICAgICAgICByZXNvbHZlKGltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgICAgICAgICAgcmVqZWN0KFxuICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5hYmxlIHRvIGRlY29kZSBpbWFnZS4nKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpbWFnZS5zcmMgPSB1cmw7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNhbnZhc1RvQmxvYihcbiAgICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxuICAgIHR5cGU6IHN0cmluZ1xuKTogUHJvbWlzZTxCbG9iPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY2FudmFzLnRvQmxvYihcbiAgICAgICAgICAgIChibG9iKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFibG9iKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBpbWFnZS4nKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShibG9iKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0eXBlXG4gICAgICAgICk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldE91dHB1dE1pbWVUeXBlKFxuICAgIGZvcm1hdDogVHJhbnNmb3JtYXRpb25QbGFuWydjb252ZXJ0VG8nXSxcbiAgICBvcmlnaW5hbFR5cGU6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICBjYXNlICdqcGVnJzpcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2UvanBlZyc7XG5cbiAgICAgICAgY2FzZSAncG5nJzpcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2UvcG5nJztcblxuICAgICAgICBjYXNlICd3ZWJwJzpcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2Uvd2VicCc7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFR5cGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25Gb3JNaW1lVHlwZShcbiAgICBtaW1lVHlwZTogc3RyaW5nXG4pOiBzdHJpbmcge1xuICAgIHN3aXRjaCAobWltZVR5cGUpIHtcbiAgICAgICAgY2FzZSAnaW1hZ2UvanBlZyc6XG4gICAgICAgICAgICByZXR1cm4gJ2pwZyc7XG5cbiAgICAgICAgY2FzZSAnaW1hZ2UvcG5nJzpcbiAgICAgICAgICAgIHJldHVybiAncG5nJztcblxuICAgICAgICBjYXNlICdpbWFnZS93ZWJwJzpcbiAgICAgICAgICAgIHJldHVybiAnd2VicCc7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnaW1nJztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VFeHRlbnNpb24oXG4gICAgZmlsZU5hbWU6IHN0cmluZyxcbiAgICBleHRlbnNpb246IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgICBjb25zdCBsYXN0RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcblxuICAgIGlmIChsYXN0RG90ID09PSAtMSkge1xuICAgICAgICByZXR1cm4gYCR7ZmlsZU5hbWV9LiR7ZXh0ZW5zaW9ufWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAke2ZpbGVOYW1lLnNsaWNlKDAsIGxhc3REb3QpfS4ke2V4dGVuc2lvbn1gO1xufSIsImltcG9ydCB7IHBhcnNlQ29uc3RyYWludHMgfSBmcm9tICcuLi9jb3JlL3BhcnNlci9wYXJzZUNvbnN0cmFpbnRzJztcbmltcG9ydCB7IGV4dHJhY3RVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vY29yZS9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XG5pbXBvcnQgeyBpbnNwZWN0RmlsZSB9IGZyb20gJy4uL2NvcmUvaW5zcGVjdG9yL2luc3BlY3RGaWxlJztcbmltcG9ydCB7IHZhbGlkYXRlRmlsZSB9IGZyb20gJy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZSc7XG5pbXBvcnQgeyBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4gfSBmcm9tICcuLi9jb3JlL3BsYW5uZXIvY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuJztcbmltcG9ydCB7IHRyYW5zZm9ybUltYWdlIH0gZnJvbSAnLi4vY29yZS90cmFuc2Zvcm1lci90cmFuc2Zvcm1JbWFnZSc7XG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb250ZW50U2NyaXB0KHtcbiAgbWF0Y2hlczogWyc8YWxsX3VybHM+J10sXG5cbiAgbWFpbigpIHtcbiAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBDb250ZW50IHNjcmlwdCBsb2FkZWQnKTtcblxuICAgIGNvbnN0IGRldGVjdGVkSW5wdXRzID0gbmV3IFdlYWtTZXQ8SFRNTElucHV0RWxlbWVudD4oKTtcblxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRmlsZUlucHV0KGlucHV0OiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAvLyBEb24ndCBwcm9jZXNzIHRoZSBzYW1lIGlucHV0IHR3aWNlXG4gICAgICBpZiAoZGV0ZWN0ZWRJbnB1dHMuaGFzKGlucHV0KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGRldGVjdGVkSW5wdXRzLmFkZChpbnB1dCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbRmlsZVRocm91Z2hdIFVwbG9hZCBmaWVsZCBkZXRlY3RlZCcsIHtcbiAgICAgICAgYWNjZXB0OiBpbnB1dC5hY2NlcHQgfHwgJ05vdCBzcGVjaWZpZWQnLFxuICAgICAgICBtdWx0aXBsZTogaW5wdXQubXVsdGlwbGUsXG4gICAgICAgIG5hbWU6IGlucHV0Lm5hbWUgfHwgJ05vdCBzcGVjaWZpZWQnLFxuICAgICAgICBpZDogaW5wdXQuaWQgfHwgJ05vdCBzcGVjaWZpZWQnLFxuICAgICAgfSk7XG5cbiAgICAgIC8vMS5FeHRyYWN0IGNvbnRleHRcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBleHRyYWN0VXBsb2FkQ29udGV4dChpbnB1dCk7XG4gICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgY29udGV4dCcsIGNvbnRleHQpO1xuICAgICAgLy8yLlBhcnNlIGNvbnN0cmFpbnRzXG4gICAgICBjb25zdCBjb25zdHJhaW50cyA9IHBhcnNlQ29uc3RyYWludHMoY29udGV4dCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgY29uc3RyYWludHMnLFxuICAgICAgICBjb25zdHJhaW50c1xuICAgICAgKTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGlucHV0LmZpbGVzPy5bMF07XG5cbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IGluc3BlY3RGaWxlKGZpbGUpO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAnW0ZpbGVUaHJvdWdoXSBTZWxlY3RlZCBmaWxlJyxcbiAgICAgICAgICAgIGZpbGVJbmZvXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvLzMuVmFsaWRhdGUgdGhlIGZpbGVcbiAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVGaWxlKGZpbGVJbmZvLCBjb25zdHJhaW50cyk7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAnW0ZpbGVUaHJvdWdoXSBWYWxpZGF0aW9uIHJlc3VsdCcsXG4gICAgICAgICAgICB2YWxpZGF0aW9uXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIC8vNC5DcmVhdGUgdHJhbnNmb3JtYXRpb24gcGxhblxuICAgICAgICAgIGNvbnN0IHBsYW4gPSBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4oZmlsZUluZm8sIGNvbnN0cmFpbnRzKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1hdGlvbiBwbGFuJywgcGxhbik7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHBsYW4pLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVkRmlsZSA9XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJhbnNmb3JtSW1hZ2UoZmlsZSwgcGxhbik7XG5cbiAgICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWRJbmZvID1cbiAgICAgICAgICAgICAgICBhd2FpdCBpbnNwZWN0RmlsZSh0cmFuc2Zvcm1lZEZpbGUpO1xuXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICdbRmlsZVRocm91Z2hdIFRyYW5zZm9ybWVkIGZpbGUnLFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybWVkSW5mb1xuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tGaWxlVGhyb3VnaF0gVHJhbnNmb3JtYXRpb24gZmFpbGVkJywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdbRmlsZVRocm91Z2hdIENvdWxkIG5vdCBpbnNwZWN0IGZpbGUnLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYW5Gb3JGaWxlSW5wdXRzKHJvb3Q6IFBhcmVudE5vZGUgPSBkb2N1bWVudCkge1xuICAgICAgY29uc3QgaW5wdXRzID1cbiAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgICBpbnB1dHMuZm9yRWFjaChyZWdpc3RlckZpbGVJbnB1dCk7XG4gICAgfVxuXG4gICAgLy8gU2NhbiBpbnB1dHMgYWxyZWFkeSBwcmVzZW50IG9uIHRoZSBwYWdlXG4gICAgc2NhbkZvckZpbGVJbnB1dHMoKTtcblxuICAgIC8vIFdhdGNoIGZvciBpbnB1dHMgYWRkZWQgbGF0ZXJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVGhlIGFkZGVkIGVsZW1lbnQgaXRzZWxmIG1pZ2h0IGJlIGEgZmlsZSBpbnB1dFxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmXG4gICAgICAgICAgICBub2RlLnR5cGUgPT09ICdmaWxlJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmVnaXN0ZXJGaWxlSW5wdXQobm9kZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT3IgaXQgbWlnaHQgY29udGFpbiBmaWxlIGlucHV0c1xuICAgICAgICAgIHNjYW5Gb3JGaWxlSW5wdXRzKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSxcbn0pOyIsIi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLnRzXG5mdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcblx0aWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIikgcmV0dXJuO1xuXHRpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIpIG1ldGhvZChgW3d4dF0gJHthcmdzLnNoaWZ0KCl9YCwgLi4uYXJncyk7XG5cdGVsc2UgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG59XG4vKiogV3JhcHBlciBhcm91bmQgYGNvbnNvbGVgIHdpdGggYSBcIlt3eHRdXCIgcHJlZml4ICovXG5jb25zdCBsb2dnZXIgPSB7XG5cdGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG5cdGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcblx0d2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG5cdGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGxvZ2dlciB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy50c1xudmFyIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgPSBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuXHRzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcblx0Y29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcblx0XHRzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcblx0XHR0aGlzLm5ld1VybCA9IG5ld1VybDtcblx0XHR0aGlzLm9sZFVybCA9IG9sZFVybDtcblx0fVxufTtcbi8qKlxuKiBSZXR1cm5zIGFuIGV2ZW50IG5hbWUgdW5pcXVlIHRvIHRoZSBleHRlbnNpb24gYW5kIGNvbnRlbnQgc2NyaXB0IHRoYXQnc1xuKiBydW5uaW5nLlxuKi9cbmZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcblx0cmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LCBnZXRVbmlxdWVFdmVudE5hbWUgfTtcbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLnRzXG5jb25zdCBzdXBwb3J0c05hdmlnYXRpb25BcGkgPSB0eXBlb2YgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG4vKipcbiogQ3JlYXRlIGEgdXRpbCB0aGF0IHdhdGNoZXMgZm9yIFVSTCBjaGFuZ2VzLCBkaXNwYXRjaGluZyB0aGUgY3VzdG9tIGV2ZW50IHdoZW5cbiogZGV0ZWN0ZWQuIFN0b3BzIHdhdGNoaW5nIHdoZW4gY29udGVudCBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuIFVzZXMgTmF2aWdhdGlvblxuKiBBUEkgd2hlbiBhdmFpbGFibGUsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuXHRsZXQgbGFzdFVybDtcblx0bGV0IHdhdGNoaW5nID0gZmFsc2U7XG5cdHJldHVybiB7IHJ1bigpIHtcblx0XHRpZiAod2F0Y2hpbmcpIHJldHVybjtcblx0XHR3YXRjaGluZyA9IHRydWU7XG5cdFx0bGFzdFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0aWYgKHN1cHBvcnRzTmF2aWdhdGlvbkFwaSkgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJuYXZpZ2F0ZVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwoZXZlbnQuZGVzdGluYXRpb24udXJsKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiA9PT0gbGFzdFVybC5ocmVmKSByZXR1cm47XG5cdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0fSwgeyBzaWduYWw6IGN0eC5zaWduYWwgfSk7XG5cdFx0ZWxzZSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiAhPT0gbGFzdFVybC5ocmVmKSB7XG5cdFx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdFx0fVxuXHRcdH0sIDFlMyk7XG5cdH0gfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC50c1xuLyoqXG4qIEltcGxlbWVudHNcbiogW2BBYm9ydENvbnRyb2xsZXJgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRDb250cm9sbGVyKS5cbiogVXNlZCB0byBkZXRlY3QgYW5kIHN0b3AgY29udGVudCBzY3JpcHQgY29kZSB3aGVuIHRoZSBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuXG4qXG4qIEl0IGFsc28gcHJvdmlkZXMgc2V2ZXJhbCB1dGlsaXRpZXMgbGlrZSBgY3R4LnNldFRpbWVvdXRgIGFuZFxuKiBgY3R4LnNldEludGVydmFsYCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIGNvbnRlbnQgc2NyaXB0cyBpbnN0ZWFkIG9mXG4qIGB3aW5kb3cuc2V0VGltZW91dGAgb3IgYHdpbmRvdy5zZXRJbnRlcnZhbGAuXG4qXG4qIFRvIGNyZWF0ZSBjb250ZXh0IGZvciB0ZXN0aW5nLCB5b3UgY2FuIHVzZSB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvcjpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfSBmcm9tICd3eHQvdXRpbHMvY29udGVudC1zY3JpcHRzLWNvbnRleHQnO1xuKlxuKiB0ZXN0KCdzdG9yYWdlIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZCcsICgpID0+IHtcbiogICBjb25zdCBjdHggPSBuZXcgQ29udGVudFNjcmlwdENvbnRleHQoJ3Rlc3QnKTtcbiogICBjb25zdCBpdGVtID0gc3RvcmFnZS5kZWZpbmVJdGVtKCdsb2NhbDpjb3VudCcsIHsgZGVmYXVsdFZhbHVlOiAwIH0pO1xuKiAgIGNvbnN0IHdhdGNoZXIgPSB2aS5mbigpO1xuKlxuKiAgIGNvbnN0IHVud2F0Y2ggPSBpdGVtLndhdGNoKHdhdGNoZXIpO1xuKiAgIGN0eC5vbkludmFsaWRhdGVkKHVud2F0Y2gpOyAvLyBMaXN0ZW4gZm9yIGludmFsaWRhdGUgaGVyZVxuKlxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFdpdGgoMSwgMCk7XG4qXG4qICAgY3R4Lm5vdGlmeUludmFsaWRhdGVkKCk7IC8vIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGludmFsaWRhdGUgdGhlIGNvbnRleHRcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDIpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qIH0pO1xuKiBgYGBcbiovXG52YXIgQ29udGVudFNjcmlwdENvbnRleHQgPSBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG5cdHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiKTtcblx0aWQ7XG5cdGFib3J0Q29udHJvbGxlcjtcblx0bG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuXHRjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuXHRcdHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblx0XHR0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0XHR0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG5cdFx0dGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcblx0fVxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG5cdH1cblx0YWJvcnQocmVhc29uKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG5cdH1cblx0Z2V0IGlzSW52YWxpZCgpIHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lPy5pZCA9PSBudWxsKSB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0cmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG5cdH1cblx0Z2V0IGlzVmFsaWQoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmlzSW52YWxpZDtcblx0fVxuXHQvKipcblx0KiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXNcblx0KiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcblx0KiAgIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG5cdCogICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuXHQqICAgfSk7XG5cdCogICAvLyAuLi5cblx0KiAgIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcblx0KlxuXHQqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cblx0Ki9cblx0b25JbnZhbGlkYXRlZChjYikge1xuXHRcdHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdFx0cmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdH1cblx0LyoqXG5cdCogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb25cblx0KiB0aGF0IHNob3VsZG4ndCBydW4gYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuXHQqICAgICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuXHQqXG5cdCogICAgIC8vIC4uLlxuXHQqICAgfTtcblx0Ki9cblx0YmxvY2soKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHt9KTtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2Vsc1xuXHQqIHRoZSByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGVcblx0KiByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsSWRsZUNhbGxiYWNrYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0sIG9wdGlvbnMpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0YWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG5cdFx0fVxuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4odHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsIGhhbmRsZXIsIHtcblx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRzaWduYWw6IHRoaXMuc2lnbmFsXG5cdFx0fSk7XG5cdH1cblx0LyoqXG5cdCogQGludGVybmFsXG5cdCogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG5cdCovXG5cdG5vdGlmeUludmFsaWRhdGVkKCkge1xuXHRcdHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuXHRcdGxvZ2dlci5kZWJ1ZyhgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGApO1xuXHR9XG5cdHN0b3BPbGRTY3JpcHRzKCkge1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgeyBkZXRhaWw6IHtcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSB9KSk7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnM/Lm5vU2NyaXB0U3RhcnRlZFBvc3RNZXNzYWdlKSB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMTEsMTIsMTMsMTQsMTUsMTZdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7O0NDREEsU0FBUyxRQUFRLE9BQWUsTUFBc0I7RUFH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