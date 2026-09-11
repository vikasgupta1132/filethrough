(function() {
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/browser.mjs
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
		if (constraints.minBytes !== void 0 && file.sizeBytes < constraints.minBytes || constraints.maxBytes !== void 0 && file.sizeBytes > constraints.maxBytes) plan.compress = {
			...constraints.minBytes !== void 0 && { minBytes: constraints.minBytes },
			...constraints.maxBytes !== void 0 && { maxBytes: constraints.maxBytes },
			format: chooseCompressionFormat(constraints.allowedFormats)
		};
		return plan;
	}
	function chooseTargetFormat(allowedFormats) {
		const normalized = allowedFormats.map((format) => format.toLowerCase());
		if (normalized.includes("jpeg")) return "jpeg";
		if (normalized.includes("jpg")) return "jpeg";
		if (normalized.includes("png")) return "png";
		if (normalized.includes("webp")) return "webp";
	}
	function chooseCompressionFormat(allowedFormats) {
		const normalized = allowedFormats?.map((format) => format.toLowerCase()) ?? [];
		if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpeg";
		if (normalized.includes("png")) return "png";
		if (normalized.includes("webp")) return "webp";
		return "jpeg";
	}
	//#endregion
	//#region core/transformer/transformImage.ts
	async function transformImage(file, plan) {
		if (!file.type.startsWith("image/")) throw new Error(`Cannot transform non-image file: ${file.type}`);
		const image = await loadImage$1(file);
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
		const blob = await canvasToBlob$1(canvas, outputType);
		const extension = getExtensionForMimeType(outputType);
		const outputName = replaceExtension$1(file.name, extension);
		return new File([blob], outputName, {
			type: outputType,
			lastModified: Date.now()
		});
	}
	function loadImage$1(file) {
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
	function canvasToBlob$1(canvas, type) {
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
	function replaceExtension$1(fileName, extension) {
		const lastDot = fileName.lastIndexOf(".");
		if (lastDot === -1) return `${fileName}.${extension}`;
		return `${fileName.slice(0, lastDot)}.${extension}`;
	}
	//#endregion
	//#region core/transformer/compressImage.ts
	var import_UPNG_umd = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		(function(t, e) {
			"object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).UPNG = e();
		})(exports, (function() {
			"use strict";
			var t, e, r, n, a, i, s, l, o, h, f = {}, _ = {}, d = {};
			function u() {
				if (t) return d;
				t = 1;
				function e(t) {
					let e = t.length;
					for (; --e >= 0;) t[e] = 0;
				}
				const r = 256, n = 286, a = 30, i = 15, s = new Uint8Array([
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1,
					1,
					1,
					1,
					2,
					2,
					2,
					2,
					3,
					3,
					3,
					3,
					4,
					4,
					4,
					4,
					5,
					5,
					5,
					5,
					0
				]), l = new Uint8Array([
					0,
					0,
					0,
					0,
					1,
					1,
					2,
					2,
					3,
					3,
					4,
					4,
					5,
					5,
					6,
					6,
					7,
					7,
					8,
					8,
					9,
					9,
					10,
					10,
					11,
					11,
					12,
					12,
					13,
					13
				]), o = new Uint8Array([
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					2,
					3,
					7
				]), h = new Uint8Array([
					16,
					17,
					18,
					0,
					8,
					7,
					9,
					6,
					10,
					5,
					11,
					4,
					12,
					3,
					13,
					2,
					14,
					1,
					15
				]), f = new Array(576);
				e(f);
				const _ = new Array(60);
				e(_);
				const u = new Array(512);
				e(u);
				const c = new Array(256);
				e(c);
				const g = new Array(29);
				e(g);
				const p = new Array(a);
				function w(t, e, r, n, a) {
					this.static_tree = t, this.extra_bits = e, this.extra_base = r, this.elems = n, this.max_length = a, this.has_stree = t && t.length;
				}
				let v, b, m;
				function y(t, e) {
					this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
				}
				e(p);
				const A = (t) => t < 256 ? u[t] : u[256 + (t >>> 7)], z = (t, e) => {
					t.pending_buf[t.pending++] = 255 & e, t.pending_buf[t.pending++] = e >>> 8 & 255;
				}, x = (t, e, r) => {
					t.bi_valid > 16 - r ? (t.bi_buf |= e << t.bi_valid & 65535, z(t, t.bi_buf), t.bi_buf = e >> 16 - t.bi_valid, t.bi_valid += r - 16) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += r);
				}, U = (t, e, r) => {
					x(t, r[2 * e], r[2 * e + 1]);
				}, k = (t, e) => {
					let r = 0;
					do
						r |= 1 & t, t >>>= 1, r <<= 1;
					while (--e > 0);
					return r >>> 1;
				}, E = (t, e, r) => {
					const n = new Array(16);
					let a, s, l = 0;
					for (a = 1; a <= i; a++) l = l + r[a - 1] << 1, n[a] = l;
					for (s = 0; s <= e; s++) {
						let e = t[2 * s + 1];
						0 !== e && (t[2 * s] = k(n[e]++, e));
					}
				}, R = (t) => {
					let e;
					for (e = 0; e < n; e++) t.dyn_ltree[2 * e] = 0;
					for (e = 0; e < a; e++) t.dyn_dtree[2 * e] = 0;
					for (e = 0; e < 19; e++) t.bl_tree[2 * e] = 0;
					t.dyn_ltree[512] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
				}, S = (t) => {
					t.bi_valid > 8 ? z(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
				}, T = (t, e, r, n) => {
					const a = 2 * e, i = 2 * r;
					return t[a] < t[i] || t[a] === t[i] && n[e] <= n[r];
				}, Z = (t, e, r) => {
					const n = t.heap[r];
					let a = r << 1;
					for (; a <= t.heap_len && (a < t.heap_len && T(e, t.heap[a + 1], t.heap[a], t.depth) && a++, !T(e, n, t.heap[a], t.depth));) t.heap[r] = t.heap[a], r = a, a <<= 1;
					t.heap[r] = n;
				}, I = (t, e, n) => {
					let a, i, o, h, f = 0;
					if (0 !== t.sym_next) do
						a = 255 & t.pending_buf[t.sym_buf + f++], a += (255 & t.pending_buf[t.sym_buf + f++]) << 8, i = t.pending_buf[t.sym_buf + f++], 0 === a ? U(t, i, e) : (o = c[i], U(t, o + r + 1, e), h = s[o], 0 !== h && (i -= g[o], x(t, i, h)), a--, o = A(a), U(t, o, n), h = l[o], 0 !== h && (a -= p[o], x(t, a, h)));
					while (f < t.sym_next);
					U(t, 256, e);
				}, C = (t, e) => {
					const r = e.dyn_tree, n = e.stat_desc.static_tree, a = e.stat_desc.has_stree, s = e.stat_desc.elems;
					let l, o, h, f = -1;
					for (t.heap_len = 0, t.heap_max = 573, l = 0; l < s; l++) 0 !== r[2 * l] ? (t.heap[++t.heap_len] = f = l, t.depth[l] = 0) : r[2 * l + 1] = 0;
					for (; t.heap_len < 2;) h = t.heap[++t.heap_len] = f < 2 ? ++f : 0, r[2 * h] = 1, t.depth[h] = 0, t.opt_len--, a && (t.static_len -= n[2 * h + 1]);
					for (e.max_code = f, l = t.heap_len >> 1; l >= 1; l--) Z(t, r, l);
					h = s;
					do
						l = t.heap[1], t.heap[1] = t.heap[t.heap_len--], Z(t, r, 1), o = t.heap[1], t.heap[--t.heap_max] = l, t.heap[--t.heap_max] = o, r[2 * h] = r[2 * l] + r[2 * o], t.depth[h] = (t.depth[l] >= t.depth[o] ? t.depth[l] : t.depth[o]) + 1, r[2 * l + 1] = r[2 * o + 1] = h, t.heap[1] = h++, Z(t, r, 1);
					while (t.heap_len >= 2);
					t.heap[--t.heap_max] = t.heap[1], ((t, e) => {
						const r = e.dyn_tree, n = e.max_code, a = e.stat_desc.static_tree, s = e.stat_desc.has_stree, l = e.stat_desc.extra_bits, o = e.stat_desc.extra_base, h = e.stat_desc.max_length;
						let f, _, d, u, c, g, p = 0;
						for (u = 0; u <= i; u++) t.bl_count[u] = 0;
						for (r[2 * t.heap[t.heap_max] + 1] = 0, f = t.heap_max + 1; f < 573; f++) _ = t.heap[f], u = r[2 * r[2 * _ + 1] + 1] + 1, u > h && (u = h, p++), r[2 * _ + 1] = u, _ > n || (t.bl_count[u]++, c = 0, _ >= o && (c = l[_ - o]), g = r[2 * _], t.opt_len += g * (u + c), s && (t.static_len += g * (a[2 * _ + 1] + c)));
						if (0 !== p) {
							do {
								for (u = h - 1; 0 === t.bl_count[u];) u--;
								t.bl_count[u]--, t.bl_count[u + 1] += 2, t.bl_count[h]--, p -= 2;
							} while (p > 0);
							for (u = h; 0 !== u; u--) for (_ = t.bl_count[u]; 0 !== _;) d = t.heap[--f], d > n || (r[2 * d + 1] !== u && (t.opt_len += (u - r[2 * d + 1]) * r[2 * d], r[2 * d + 1] = u), _--);
						}
					})(t, e), E(r, f, t.bl_count);
				}, L = (t, e, r) => {
					let n, a, i = -1, s = e[1], l = 0, o = 7, h = 4;
					for (0 === s && (o = 138, h = 3), e[2 * (r + 1) + 1] = 65535, n = 0; n <= r; n++) a = s, s = e[2 * (n + 1) + 1], ++l < o && a === s || (l < h ? t.bl_tree[2 * a] += l : 0 !== a ? (a !== i && t.bl_tree[2 * a]++, t.bl_tree[32]++) : l <= 10 ? t.bl_tree[34]++ : t.bl_tree[36]++, l = 0, i = a, 0 === s ? (o = 138, h = 3) : a === s ? (o = 6, h = 3) : (o = 7, h = 4));
				}, M = (t, e, r) => {
					let n, a, i = -1, s = e[1], l = 0, o = 7, h = 4;
					for (0 === s && (o = 138, h = 3), n = 0; n <= r; n++) if (a = s, s = e[2 * (n + 1) + 1], !(++l < o && a === s)) {
						if (l < h) do
							U(t, a, t.bl_tree);
						while (0 != --l);
						else 0 !== a ? (a !== i && (U(t, a, t.bl_tree), l--), U(t, 16, t.bl_tree), x(t, l - 3, 2)) : l <= 10 ? (U(t, 17, t.bl_tree), x(t, l - 3, 3)) : (U(t, 18, t.bl_tree), x(t, l - 11, 7));
						l = 0, i = a, 0 === s ? (o = 138, h = 3) : a === s ? (o = 6, h = 3) : (o = 7, h = 4);
					}
				};
				let N = !1;
				const D = (t, e, r, n) => {
					x(t, 0 + (n ? 1 : 0), 3), S(t), z(t, r), z(t, ~r), r && t.pending_buf.set(t.window.subarray(e, e + r), t.pending), t.pending += r;
				};
				return d._tr_init = (t) => {
					N || ((() => {
						let t, e, r, h, d;
						const y = new Array(16);
						for (r = 0, h = 0; h < 28; h++) for (g[h] = r, t = 0; t < 1 << s[h]; t++) c[r++] = h;
						for (c[r - 1] = h, d = 0, h = 0; h < 16; h++) for (p[h] = d, t = 0; t < 1 << l[h]; t++) u[d++] = h;
						for (d >>= 7; h < a; h++) for (p[h] = d << 7, t = 0; t < 1 << l[h] - 7; t++) u[256 + d++] = h;
						for (e = 0; e <= i; e++) y[e] = 0;
						for (t = 0; t <= 143;) f[2 * t + 1] = 8, t++, y[8]++;
						for (; t <= 255;) f[2 * t + 1] = 9, t++, y[9]++;
						for (; t <= 279;) f[2 * t + 1] = 7, t++, y[7]++;
						for (; t <= 287;) f[2 * t + 1] = 8, t++, y[8]++;
						for (E(f, 287, y), t = 0; t < a; t++) _[2 * t + 1] = 5, _[2 * t] = k(t, 5);
						v = new w(f, s, 257, n, i), b = new w(_, l, 0, a, i), m = new w(new Array(0), o, 0, 19, 7);
					})(), N = !0), t.l_desc = new y(t.dyn_ltree, v), t.d_desc = new y(t.dyn_dtree, b), t.bl_desc = new y(t.bl_tree, m), t.bi_buf = 0, t.bi_valid = 0, R(t);
				}, d._tr_stored_block = D, d._tr_flush_block = (t, e, n, a) => {
					let i, s, l = 0;
					t.level > 0 ? (2 === t.strm.data_type && (t.strm.data_type = ((t) => {
						let e, n = 4093624447;
						for (e = 0; e <= 31; e++, n >>>= 1) if (1 & n && 0 !== t.dyn_ltree[2 * e]) return 0;
						if (0 !== t.dyn_ltree[18] || 0 !== t.dyn_ltree[20] || 0 !== t.dyn_ltree[26]) return 1;
						for (e = 32; e < r; e++) if (0 !== t.dyn_ltree[2 * e]) return 1;
						return 0;
					})(t)), C(t, t.l_desc), C(t, t.d_desc), l = ((t) => {
						let e;
						for (L(t, t.dyn_ltree, t.l_desc.max_code), L(t, t.dyn_dtree, t.d_desc.max_code), C(t, t.bl_desc), e = 18; e >= 3 && 0 === t.bl_tree[2 * h[e] + 1]; e--);
						return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
					})(t), i = t.opt_len + 3 + 7 >>> 3, s = t.static_len + 3 + 7 >>> 3, s <= i && (i = s)) : i = s = n + 5, n + 4 <= i && -1 !== e ? D(t, e, n, a) : 4 === t.strategy || s === i ? (x(t, 2 + (a ? 1 : 0), 3), I(t, f, _)) : (x(t, 4 + (a ? 1 : 0), 3), ((t, e, r, n) => {
						let a;
						for (x(t, e - 257, 5), x(t, r - 1, 5), x(t, n - 4, 4), a = 0; a < n; a++) x(t, t.bl_tree[2 * h[a] + 1], 3);
						M(t, t.dyn_ltree, e - 1), M(t, t.dyn_dtree, r - 1);
					})(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, l + 1), I(t, t.dyn_ltree, t.dyn_dtree)), R(t), a && S(t);
				}, d._tr_tally = (t, e, n) => (t.pending_buf[t.sym_buf + t.sym_next++] = e, t.pending_buf[t.sym_buf + t.sym_next++] = e >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = n, 0 === e ? t.dyn_ltree[2 * n]++ : (t.matches++, e--, t.dyn_ltree[2 * (c[n] + r + 1)]++, t.dyn_dtree[2 * A(e)]++), t.sym_next === t.sym_end), d._tr_align = (t) => {
					x(t, 2, 3), U(t, 256, f), ((t) => {
						16 === t.bi_valid ? (z(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = 255 & t.bi_buf, t.bi_buf >>= 8, t.bi_valid -= 8);
					})(t);
				}, d;
			}
			function c() {
				return s ? i : (s = 1, i = {
					2: "need dictionary",
					1: "stream end",
					0: "",
					"-1": "file error",
					"-2": "stream error",
					"-3": "data error",
					"-4": "insufficient memory",
					"-5": "buffer error",
					"-6": "incompatible version"
				});
			}
			function g() {
				return o ? l : (o = 1, l = {
					Z_NO_FLUSH: 0,
					Z_PARTIAL_FLUSH: 1,
					Z_SYNC_FLUSH: 2,
					Z_FULL_FLUSH: 3,
					Z_FINISH: 4,
					Z_BLOCK: 5,
					Z_TREES: 6,
					Z_OK: 0,
					Z_STREAM_END: 1,
					Z_NEED_DICT: 2,
					Z_ERRNO: -1,
					Z_STREAM_ERROR: -2,
					Z_DATA_ERROR: -3,
					Z_MEM_ERROR: -4,
					Z_BUF_ERROR: -5,
					Z_NO_COMPRESSION: 0,
					Z_BEST_SPEED: 1,
					Z_BEST_COMPRESSION: 9,
					Z_DEFAULT_COMPRESSION: -1,
					Z_FILTERED: 1,
					Z_HUFFMAN_ONLY: 2,
					Z_RLE: 3,
					Z_FIXED: 4,
					Z_DEFAULT_STRATEGY: 0,
					Z_BINARY: 0,
					Z_TEXT: 1,
					Z_UNKNOWN: 2,
					Z_DEFLATED: 8
				});
			}
			function p() {
				if (h) return _;
				h = 1;
				const { _tr_init: t, _tr_stored_block: i, _tr_flush_block: s, _tr_tally: l, _tr_align: o } = u(), f = r ? e : (r = 1, e = (t, e, r, n) => {
					let a = 65535 & t, i = t >>> 16 & 65535, s = 0;
					for (; 0 !== r;) {
						s = r > 2e3 ? 2e3 : r, r -= s;
						do
							a = a + e[n++] | 0, i = i + a | 0;
						while (--s);
						a %= 65521, i %= 65521;
					}
					return a | i << 16;
				}), d = function() {
					if (a) return n;
					a = 1;
					const t = new Uint32Array((() => {
						let t, e = [];
						for (var r = 0; r < 256; r++) {
							t = r;
							for (var n = 0; n < 8; n++) t = 1 & t ? 3988292384 ^ t >>> 1 : t >>> 1;
							e[r] = t;
						}
						return e;
					})());
					return n = (e, r, n, a) => {
						const i = t, s = a + n;
						e ^= -1;
						for (let t = a; t < s; t++) e = e >>> 8 ^ i[255 & (e ^ r[t])];
						return ~e;
					};
				}(), p = c(), { Z_NO_FLUSH: w, Z_PARTIAL_FLUSH: v, Z_FULL_FLUSH: b, Z_FINISH: m, Z_BLOCK: y, Z_OK: A, Z_STREAM_END: z, Z_STREAM_ERROR: x, Z_DATA_ERROR: U, Z_BUF_ERROR: k, Z_DEFAULT_COMPRESSION: E, Z_FILTERED: R, Z_HUFFMAN_ONLY: S, Z_RLE: T, Z_FIXED: Z, Z_DEFAULT_STRATEGY: I, Z_UNKNOWN: C, Z_DEFLATED: L } = g(), M = 258, N = 262, D = 42, F = 113, O = 666, B = (t, e) => (t.msg = p[e], e), H = (t) => 2 * t - (t > 4 ? 9 : 0), P = (t) => {
					let e = t.length;
					for (; --e >= 0;) t[e] = 0;
				}, Y = (t) => {
					let e, r, n, a = t.w_size;
					e = t.hash_size, n = e;
					do
						r = t.head[--n], t.head[n] = r >= a ? r - a : 0;
					while (--e);
					e = a, n = e;
					do
						r = t.prev[--n], t.prev[n] = r >= a ? r - a : 0;
					while (--e);
				};
				let q = (t, e, r) => (e << t.hash_shift ^ r) & t.hash_mask;
				const G = (t) => {
					const e = t.state;
					let r = e.pending;
					r > t.avail_out && (r = t.avail_out), 0 !== r && (t.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + r), t.next_out), t.next_out += r, e.pending_out += r, t.total_out += r, t.avail_out -= r, e.pending -= r, 0 === e.pending && (e.pending_out = 0));
				}, K = (t, e) => {
					s(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, G(t.strm);
				}, j = (t, e) => {
					t.pending_buf[t.pending++] = e;
				}, X = (t, e) => {
					t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = 255 & e;
				}, V = (t, e, r, n) => {
					let a = t.avail_in;
					return a > n && (a = n), 0 === a ? 0 : (t.avail_in -= a, e.set(t.input.subarray(t.next_in, t.next_in + a), r), 1 === t.state.wrap ? t.adler = f(t.adler, e, a, r) : 2 === t.state.wrap && (t.adler = d(t.adler, e, a, r)), t.next_in += a, t.total_in += a, a);
				}, W = (t, e) => {
					let r, n, a = t.max_chain_length, i = t.strstart, s = t.prev_length, l = t.nice_match;
					const o = t.strstart > t.w_size - N ? t.strstart - (t.w_size - N) : 0, h = t.window, f = t.w_mask, _ = t.prev, d = t.strstart + M;
					let u = h[i + s - 1], c = h[i + s];
					t.prev_length >= t.good_match && (a >>= 2), l > t.lookahead && (l = t.lookahead);
					do
						if (r = e, h[r + s] === c && h[r + s - 1] === u && h[r] === h[i] && h[++r] === h[i + 1]) {
							i += 2, r++;
							do							;
while (h[++i] === h[++r] && h[++i] === h[++r] && h[++i] === h[++r] && h[++i] === h[++r] && h[++i] === h[++r] && h[++i] === h[++r] && h[++i] === h[++r] && h[++i] === h[++r] && i < d);
							if (n = M - (d - i), i = d - M, n > s) {
								if (t.match_start = e, s = n, n >= l) break;
								u = h[i + s - 1], c = h[i + s];
							}
						}
					while ((e = _[e & f]) > o && 0 != --a);
					return s <= t.lookahead ? s : t.lookahead;
				}, J = (t) => {
					const e = t.w_size;
					let r, n, a;
					do {
						if (n = t.window_size - t.lookahead - t.strstart, t.strstart >= e + (e - N) && (t.window.set(t.window.subarray(e, e + e - n), 0), t.match_start -= e, t.strstart -= e, t.block_start -= e, t.insert > t.strstart && (t.insert = t.strstart), Y(t), n += e), 0 === t.strm.avail_in) break;
						if (r = V(t.strm, t.window, t.strstart + t.lookahead, n), t.lookahead += r, t.lookahead + t.insert >= 3) for (a = t.strstart - t.insert, t.ins_h = t.window[a], t.ins_h = q(t, t.ins_h, t.window[a + 1]); t.insert && (t.ins_h = q(t, t.ins_h, t.window[a + 3 - 1]), t.prev[a & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = a, a++, t.insert--, !(t.lookahead + t.insert < 3)););
					} while (t.lookahead < N && 0 !== t.strm.avail_in);
				}, Q = (t, e) => {
					let r, n, a, s = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, l = 0, o = t.strm.avail_in;
					do {
						if (r = 65535, a = t.bi_valid + 42 >> 3, t.strm.avail_out < a) break;
						if (a = t.strm.avail_out - a, n = t.strstart - t.block_start, r > n + t.strm.avail_in && (r = n + t.strm.avail_in), r > a && (r = a), r < s && (0 === r && e !== m || e === w || r !== n + t.strm.avail_in)) break;
						l = e === m && r === n + t.strm.avail_in ? 1 : 0, i(t, 0, 0, l), t.pending_buf[t.pending - 4] = r, t.pending_buf[t.pending - 3] = r >> 8, t.pending_buf[t.pending - 2] = ~r, t.pending_buf[t.pending - 1] = ~r >> 8, G(t.strm), n && (n > r && (n = r), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + n), t.strm.next_out), t.strm.next_out += n, t.strm.avail_out -= n, t.strm.total_out += n, t.block_start += n, r -= n), r && (V(t.strm, t.strm.output, t.strm.next_out, r), t.strm.next_out += r, t.strm.avail_out -= r, t.strm.total_out += r);
					} while (0 === l);
					return o -= t.strm.avail_in, o && (o >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= o && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - o, t.strm.next_in), t.strstart), t.strstart += o, t.insert += o > t.w_size - t.insert ? t.w_size - t.insert : o), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), l ? 4 : e !== w && e !== m && 0 === t.strm.avail_in && t.strstart === t.block_start ? 2 : (a = t.window_size - t.strstart, t.strm.avail_in > a && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, a += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), a > t.strm.avail_in && (a = t.strm.avail_in), a && (V(t.strm, t.window, t.strstart, a), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.high_water < t.strstart && (t.high_water = t.strstart), a = t.bi_valid + 42 >> 3, a = t.pending_buf_size - a > 65535 ? 65535 : t.pending_buf_size - a, s = a > t.w_size ? t.w_size : a, n = t.strstart - t.block_start, (n >= s || (n || e === m) && e !== w && 0 === t.strm.avail_in && n <= a) && (r = n > a ? a : n, l = e === m && 0 === t.strm.avail_in && r === n ? 1 : 0, i(t, t.block_start, r, l), t.block_start += r, G(t.strm)), l ? 3 : 1);
				}, $ = (t, e) => {
					let r, n;
					for (;;) {
						if (t.lookahead < N) {
							if (J(t), t.lookahead < N && e === w) return 1;
							if (0 === t.lookahead) break;
						}
						if (r = 0, t.lookahead >= 3 && (t.ins_h = q(t, t.ins_h, t.window[t.strstart + 3 - 1]), r = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), 0 !== r && t.strstart - r <= t.w_size - N && (t.match_length = W(t, r)), t.match_length >= 3) if (n = l(t, t.strstart - t.match_start, t.match_length - 3), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= 3) {
							t.match_length--;
							do
								t.strstart++, t.ins_h = q(t, t.ins_h, t.window[t.strstart + 3 - 1]), r = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
							while (0 != --t.match_length);
							t.strstart++;
						} else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = q(t, t.ins_h, t.window[t.strstart + 1]);
						else n = l(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
						if (n && (K(t, !1), 0 === t.strm.avail_out)) return 1;
					}
					return t.insert = t.strstart < 2 ? t.strstart : 2, e === m ? (K(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.sym_next && (K(t, !1), 0 === t.strm.avail_out) ? 1 : 2;
				}, tt = (t, e) => {
					let r, n, a;
					for (;;) {
						if (t.lookahead < N) {
							if (J(t), t.lookahead < N && e === w) return 1;
							if (0 === t.lookahead) break;
						}
						if (r = 0, t.lookahead >= 3 && (t.ins_h = q(t, t.ins_h, t.window[t.strstart + 3 - 1]), r = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = 2, 0 !== r && t.prev_length < t.max_lazy_match && t.strstart - r <= t.w_size - N && (t.match_length = W(t, r), t.match_length <= 5 && (t.strategy === R || 3 === t.match_length && t.strstart - t.match_start > 4096) && (t.match_length = 2)), t.prev_length >= 3 && t.match_length <= t.prev_length) {
							a = t.strstart + t.lookahead - 3, n = l(t, t.strstart - 1 - t.prev_match, t.prev_length - 3), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
							do
								++t.strstart <= a && (t.ins_h = q(t, t.ins_h, t.window[t.strstart + 3 - 1]), r = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
							while (0 != --t.prev_length);
							if (t.match_available = 0, t.match_length = 2, t.strstart++, n && (K(t, !1), 0 === t.strm.avail_out)) return 1;
						} else if (t.match_available) {
							if (n = l(t, 0, t.window[t.strstart - 1]), n && K(t, !1), t.strstart++, t.lookahead--, 0 === t.strm.avail_out) return 1;
						} else t.match_available = 1, t.strstart++, t.lookahead--;
					}
					return t.match_available && (n = l(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < 2 ? t.strstart : 2, e === m ? (K(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.sym_next && (K(t, !1), 0 === t.strm.avail_out) ? 1 : 2;
				};
				function et(t, e, r, n, a) {
					this.good_length = t, this.max_lazy = e, this.nice_length = r, this.max_chain = n, this.func = a;
				}
				const rt = [
					new et(0, 0, 0, 0, Q),
					new et(4, 4, 8, 4, $),
					new et(4, 5, 16, 8, $),
					new et(4, 6, 32, 32, $),
					new et(4, 4, 16, 16, tt),
					new et(8, 16, 32, 32, tt),
					new et(8, 16, 128, 128, tt),
					new et(8, 32, 128, 256, tt),
					new et(32, 128, 258, 1024, tt),
					new et(32, 258, 258, 4096, tt)
				];
				function nt() {
					this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = L, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = /* @__PURE__ */ new Uint16Array(1146), this.dyn_dtree = /* @__PURE__ */ new Uint16Array(122), this.bl_tree = /* @__PURE__ */ new Uint16Array(78), P(this.dyn_ltree), P(this.dyn_dtree), P(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = /* @__PURE__ */ new Uint16Array(16), this.heap = /* @__PURE__ */ new Uint16Array(573), P(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = /* @__PURE__ */ new Uint16Array(573), P(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
				}
				const at = (t) => {
					if (!t) return 1;
					const e = t.state;
					return !e || e.strm !== t || e.status !== D && 57 !== e.status && 69 !== e.status && 73 !== e.status && 91 !== e.status && 103 !== e.status && e.status !== F && e.status !== O ? 1 : 0;
				}, it = (e) => {
					if (at(e)) return B(e, x);
					e.total_in = e.total_out = 0, e.data_type = C;
					const r = e.state;
					return r.pending = 0, r.pending_out = 0, r.wrap < 0 && (r.wrap = -r.wrap), r.status = 2 === r.wrap ? 57 : r.wrap ? D : F, e.adler = 2 === r.wrap ? 0 : 1, r.last_flush = -2, t(r), A;
				}, st = (t) => {
					const e = it(t);
					var r;
					return e === A && ((r = t.state).window_size = 2 * r.w_size, P(r.head), r.max_lazy_match = rt[r.level].max_lazy, r.good_match = rt[r.level].good_length, r.nice_match = rt[r.level].nice_length, r.max_chain_length = rt[r.level].max_chain, r.strstart = 0, r.block_start = 0, r.lookahead = 0, r.insert = 0, r.match_length = r.prev_length = 2, r.match_available = 0, r.ins_h = 0), e;
				}, lt = (t, e, r, n, a, i) => {
					if (!t) return x;
					let s = 1;
					if (e === E && (e = 6), n < 0 ? (s = 0, n = -n) : n > 15 && (s = 2, n -= 16), a < 1 || a > 9 || r !== L || n < 8 || n > 15 || e < 0 || e > 9 || i < 0 || i > Z || 8 === n && 1 !== s) return B(t, x);
					8 === n && (n = 9);
					const l = new nt();
					return t.state = l, l.strm = t, l.status = D, l.wrap = s, l.gzhead = null, l.w_bits = n, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.hash_bits = a + 7, l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + 3 - 1) / 3), l.window = new Uint8Array(2 * l.w_size), l.head = new Uint16Array(l.hash_size), l.prev = new Uint16Array(l.w_size), l.lit_bufsize = 1 << a + 6, l.pending_buf_size = 4 * l.lit_bufsize, l.pending_buf = new Uint8Array(l.pending_buf_size), l.sym_buf = l.lit_bufsize, l.sym_end = 3 * (l.lit_bufsize - 1), l.level = e, l.strategy = i, l.method = r, st(t);
				};
				return _.deflateInit = (t, e) => lt(t, e, L, 15, 8, I), _.deflateInit2 = lt, _.deflateReset = st, _.deflateResetKeep = it, _.deflateSetHeader = (t, e) => at(t) || 2 !== t.state.wrap ? x : (t.state.gzhead = e, A), _.deflate = (t, e) => {
					if (at(t) || e > y || e < 0) return t ? B(t, x) : x;
					const r = t.state;
					if (!t.output || 0 !== t.avail_in && !t.input || r.status === O && e !== m) return B(t, 0 === t.avail_out ? k : x);
					const n = r.last_flush;
					if (r.last_flush = e, 0 !== r.pending) {
						if (G(t), 0 === t.avail_out) return r.last_flush = -1, A;
					} else if (0 === t.avail_in && H(e) <= H(n) && e !== m) return B(t, k);
					if (r.status === O && 0 !== t.avail_in) return B(t, k);
					if (r.status === D && 0 === r.wrap && (r.status = F), r.status === D) {
						let e = L + (r.w_bits - 8 << 4) << 8, n = -1;
						if (n = r.strategy >= S || r.level < 2 ? 0 : r.level < 6 ? 1 : 6 === r.level ? 2 : 3, e |= n << 6, 0 !== r.strstart && (e |= 32), e += 31 - e % 31, X(r, e), 0 !== r.strstart && (X(r, t.adler >>> 16), X(r, 65535 & t.adler)), t.adler = 1, r.status = F, G(t), 0 !== r.pending) return r.last_flush = -1, A;
					}
					if (57 === r.status) {
						if (t.adler = 0, j(r, 31), j(r, 139), j(r, 8), r.gzhead) j(r, (r.gzhead.text ? 1 : 0) + (r.gzhead.hcrc ? 2 : 0) + (r.gzhead.extra ? 4 : 0) + (r.gzhead.name ? 8 : 0) + (r.gzhead.comment ? 16 : 0)), j(r, 255 & r.gzhead.time), j(r, r.gzhead.time >> 8 & 255), j(r, r.gzhead.time >> 16 & 255), j(r, r.gzhead.time >> 24 & 255), j(r, 9 === r.level ? 2 : r.strategy >= S || r.level < 2 ? 4 : 0), j(r, 255 & r.gzhead.os), r.gzhead.extra && r.gzhead.extra.length && (j(r, 255 & r.gzhead.extra.length), j(r, r.gzhead.extra.length >> 8 & 255)), r.gzhead.hcrc && (t.adler = d(t.adler, r.pending_buf, r.pending, 0)), r.gzindex = 0, r.status = 69;
						else if (j(r, 0), j(r, 0), j(r, 0), j(r, 0), j(r, 0), j(r, 9 === r.level ? 2 : r.strategy >= S || r.level < 2 ? 4 : 0), j(r, 3), r.status = F, G(t), 0 !== r.pending) return r.last_flush = -1, A;
					}
					if (69 === r.status) {
						if (r.gzhead.extra) {
							let e = r.pending, n = (65535 & r.gzhead.extra.length) - r.gzindex;
							for (; r.pending + n > r.pending_buf_size;) {
								let a = r.pending_buf_size - r.pending;
								if (r.pending_buf.set(r.gzhead.extra.subarray(r.gzindex, r.gzindex + a), r.pending), r.pending = r.pending_buf_size, r.gzhead.hcrc && r.pending > e && (t.adler = d(t.adler, r.pending_buf, r.pending - e, e)), r.gzindex += a, G(t), 0 !== r.pending) return r.last_flush = -1, A;
								e = 0, n -= a;
							}
							let a = new Uint8Array(r.gzhead.extra);
							r.pending_buf.set(a.subarray(r.gzindex, r.gzindex + n), r.pending), r.pending += n, r.gzhead.hcrc && r.pending > e && (t.adler = d(t.adler, r.pending_buf, r.pending - e, e)), r.gzindex = 0;
						}
						r.status = 73;
					}
					if (73 === r.status) {
						if (r.gzhead.name) {
							let e, n = r.pending;
							do {
								if (r.pending === r.pending_buf_size) {
									if (r.gzhead.hcrc && r.pending > n && (t.adler = d(t.adler, r.pending_buf, r.pending - n, n)), G(t), 0 !== r.pending) return r.last_flush = -1, A;
									n = 0;
								}
								e = r.gzindex < r.gzhead.name.length ? 255 & r.gzhead.name.charCodeAt(r.gzindex++) : 0, j(r, e);
							} while (0 !== e);
							r.gzhead.hcrc && r.pending > n && (t.adler = d(t.adler, r.pending_buf, r.pending - n, n)), r.gzindex = 0;
						}
						r.status = 91;
					}
					if (91 === r.status) {
						if (r.gzhead.comment) {
							let e, n = r.pending;
							do {
								if (r.pending === r.pending_buf_size) {
									if (r.gzhead.hcrc && r.pending > n && (t.adler = d(t.adler, r.pending_buf, r.pending - n, n)), G(t), 0 !== r.pending) return r.last_flush = -1, A;
									n = 0;
								}
								e = r.gzindex < r.gzhead.comment.length ? 255 & r.gzhead.comment.charCodeAt(r.gzindex++) : 0, j(r, e);
							} while (0 !== e);
							r.gzhead.hcrc && r.pending > n && (t.adler = d(t.adler, r.pending_buf, r.pending - n, n));
						}
						r.status = 103;
					}
					if (103 === r.status) {
						if (r.gzhead.hcrc) {
							if (r.pending + 2 > r.pending_buf_size && (G(t), 0 !== r.pending)) return r.last_flush = -1, A;
							j(r, 255 & t.adler), j(r, t.adler >> 8 & 255), t.adler = 0;
						}
						if (r.status = F, G(t), 0 !== r.pending) return r.last_flush = -1, A;
					}
					if (0 !== t.avail_in || 0 !== r.lookahead || e !== w && r.status !== O) {
						let n = 0 === r.level ? Q(r, e) : r.strategy === S ? ((t, e) => {
							let r;
							for (;;) {
								if (0 === t.lookahead && (J(t), 0 === t.lookahead)) {
									if (e === w) return 1;
									break;
								}
								if (t.match_length = 0, r = l(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, r && (K(t, !1), 0 === t.strm.avail_out)) return 1;
							}
							return t.insert = 0, e === m ? (K(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.sym_next && (K(t, !1), 0 === t.strm.avail_out) ? 1 : 2;
						})(r, e) : r.strategy === T ? ((t, e) => {
							let r, n, a, i;
							const s = t.window;
							for (;;) {
								if (t.lookahead <= M) {
									if (J(t), t.lookahead <= M && e === w) return 1;
									if (0 === t.lookahead) break;
								}
								if (t.match_length = 0, t.lookahead >= 3 && t.strstart > 0 && (a = t.strstart - 1, n = s[a], n === s[++a] && n === s[++a] && n === s[++a])) {
									i = t.strstart + M;
									do									;
while (n === s[++a] && n === s[++a] && n === s[++a] && n === s[++a] && n === s[++a] && n === s[++a] && n === s[++a] && n === s[++a] && a < i);
									t.match_length = M - (i - a), t.match_length > t.lookahead && (t.match_length = t.lookahead);
								}
								if (t.match_length >= 3 ? (r = l(t, 1, t.match_length - 3), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (r = l(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), r && (K(t, !1), 0 === t.strm.avail_out)) return 1;
							}
							return t.insert = 0, e === m ? (K(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.sym_next && (K(t, !1), 0 === t.strm.avail_out) ? 1 : 2;
						})(r, e) : rt[r.level].func(r, e);
						if (3 !== n && 4 !== n || (r.status = O), 1 === n || 3 === n) return 0 === t.avail_out && (r.last_flush = -1), A;
						if (2 === n && (e === v ? o(r) : e !== y && (i(r, 0, 0, !1), e === b && (P(r.head), 0 === r.lookahead && (r.strstart = 0, r.block_start = 0, r.insert = 0))), G(t), 0 === t.avail_out)) return r.last_flush = -1, A;
					}
					return e !== m ? A : r.wrap <= 0 ? z : (2 === r.wrap ? (j(r, 255 & t.adler), j(r, t.adler >> 8 & 255), j(r, t.adler >> 16 & 255), j(r, t.adler >> 24 & 255), j(r, 255 & t.total_in), j(r, t.total_in >> 8 & 255), j(r, t.total_in >> 16 & 255), j(r, t.total_in >> 24 & 255)) : (X(r, t.adler >>> 16), X(r, 65535 & t.adler)), G(t), r.wrap > 0 && (r.wrap = -r.wrap), 0 !== r.pending ? A : z);
				}, _.deflateEnd = (t) => {
					if (at(t)) return x;
					const e = t.state.status;
					return t.state = null, e === F ? B(t, U) : A;
				}, _.deflateSetDictionary = (t, e) => {
					let r = e.length;
					if (at(t)) return x;
					const n = t.state, a = n.wrap;
					if (2 === a || 1 === a && n.status !== D || n.lookahead) return x;
					if (1 === a && (t.adler = f(t.adler, e, r, 0)), n.wrap = 0, r >= n.w_size) {
						0 === a && (P(n.head), n.strstart = 0, n.block_start = 0, n.insert = 0);
						let t = new Uint8Array(n.w_size);
						t.set(e.subarray(r - n.w_size, r), 0), e = t, r = n.w_size;
					}
					const i = t.avail_in, s = t.next_in, l = t.input;
					for (t.avail_in = r, t.next_in = 0, t.input = e, J(n); n.lookahead >= 3;) {
						let t = n.strstart, e = n.lookahead - 2;
						do
							n.ins_h = q(n, n.ins_h, n.window[t + 3 - 1]), n.prev[t & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = t, t++;
						while (--e);
						n.strstart = t, n.lookahead = 2, J(n);
					}
					return n.strstart += n.lookahead, n.block_start = n.strstart, n.insert = n.lookahead, n.lookahead = 0, n.match_length = n.prev_length = 2, n.match_available = 0, t.next_in = s, t.input = l, t.avail_in = i, n.wrap = a, A;
				}, _.deflateInfo = "pako deflate (from Nodeca project)", _;
			}
			var w, v = {};
			var b, m, y, A, z = {};
			function x() {
				if (b) return z;
				b = 1;
				let t = !0;
				try {
					String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
				} catch (e) {
					t = !1;
				}
				const e = /* @__PURE__ */ new Uint8Array(256);
				for (let t = 0; t < 256; t++) e[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
				e[254] = e[254] = 1, z.string2buf = (t) => {
					if ("function" == typeof TextEncoder && TextEncoder.prototype.encode) return new TextEncoder().encode(t);
					let e, r, n, a, i, s = t.length, l = 0;
					for (a = 0; a < s; a++) r = t.charCodeAt(a), 55296 == (64512 & r) && a + 1 < s && (n = t.charCodeAt(a + 1), 56320 == (64512 & n) && (r = 65536 + (r - 55296 << 10) + (n - 56320), a++)), l += r < 128 ? 1 : r < 2048 ? 2 : r < 65536 ? 3 : 4;
					for (e = new Uint8Array(l), i = 0, a = 0; i < l; a++) r = t.charCodeAt(a), 55296 == (64512 & r) && a + 1 < s && (n = t.charCodeAt(a + 1), 56320 == (64512 & n) && (r = 65536 + (r - 55296 << 10) + (n - 56320), a++)), r < 128 ? e[i++] = r : r < 2048 ? (e[i++] = 192 | r >>> 6, e[i++] = 128 | 63 & r) : r < 65536 ? (e[i++] = 224 | r >>> 12, e[i++] = 128 | r >>> 6 & 63, e[i++] = 128 | 63 & r) : (e[i++] = 240 | r >>> 18, e[i++] = 128 | r >>> 12 & 63, e[i++] = 128 | r >>> 6 & 63, e[i++] = 128 | 63 & r);
					return e;
				};
				return z.buf2string = (r, n) => {
					const a = n || r.length;
					if ("function" == typeof TextDecoder && TextDecoder.prototype.decode) return new TextDecoder().decode(r.subarray(0, n));
					let i, s;
					const l = new Array(2 * a);
					for (s = 0, i = 0; i < a;) {
						let t = r[i++];
						if (t < 128) {
							l[s++] = t;
							continue;
						}
						let n = e[t];
						if (n > 4) l[s++] = 65533, i += n - 1;
						else {
							for (t &= 2 === n ? 31 : 3 === n ? 15 : 7; n > 1 && i < a;) t = t << 6 | 63 & r[i++], n--;
							n > 1 ? l[s++] = 65533 : t < 65536 ? l[s++] = t : (t -= 65536, l[s++] = 55296 | t >> 10 & 1023, l[s++] = 56320 | 1023 & t);
						}
					}
					return ((e, r) => {
						if (r < 65534 && e.subarray && t) return String.fromCharCode.apply(null, e.length === r ? e : e.subarray(0, r));
						let n = "";
						for (let t = 0; t < r; t++) n += String.fromCharCode(e[t]);
						return n;
					})(l, s);
				}, z.utf8border = (t, r) => {
					(r = r || t.length) > t.length && (r = t.length);
					let n = r - 1;
					for (; n >= 0 && 128 == (192 & t[n]);) n--;
					return n < 0 || 0 === n ? r : n + e[t[n]] > r ? n : r;
				}, z;
			}
			var k = { deflate: function() {
				if (A) return f;
				A = 1;
				const t = p(), e = function() {
					if (w) return v;
					w = 1;
					const t = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
					return v.assign = function(e) {
						const r = Array.prototype.slice.call(arguments, 1);
						for (; r.length;) {
							const n = r.shift();
							if (n) {
								if ("object" != typeof n) throw new TypeError(n + "must be non-object");
								for (const r in n) t(n, r) && (e[r] = n[r]);
							}
						}
						return e;
					}, v.flattenChunks = (t) => {
						let e = 0;
						for (let r = 0, n = t.length; r < n; r++) e += t[r].length;
						const r = new Uint8Array(e);
						for (let e = 0, n = 0, a = t.length; e < a; e++) {
							let a = t[e];
							r.set(a, n), n += a.length;
						}
						return r;
					}, v;
				}(), r = x(), n = c(), a = y ? m : (y = 1, m = function() {
					this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
				}), i = Object.prototype.toString, { Z_NO_FLUSH: s, Z_SYNC_FLUSH: l, Z_FULL_FLUSH: o, Z_FINISH: h, Z_OK: _, Z_STREAM_END: d, Z_DEFAULT_COMPRESSION: u, Z_DEFAULT_STRATEGY: b, Z_DEFLATED: z } = g();
				function U(s) {
					this.options = e.assign({
						level: u,
						method: z,
						chunkSize: 16384,
						windowBits: 15,
						memLevel: 8,
						strategy: b
					}, s || {});
					let l = this.options;
					l.raw && l.windowBits > 0 ? l.windowBits = -l.windowBits : l.gzip && l.windowBits > 0 && l.windowBits < 16 && (l.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new a(), this.strm.avail_out = 0;
					let o = t.deflateInit2(this.strm, l.level, l.method, l.windowBits, l.memLevel, l.strategy);
					if (o !== _) throw new Error(n[o]);
					if (l.header && t.deflateSetHeader(this.strm, l.header), l.dictionary) {
						let e;
						if (e = "string" == typeof l.dictionary ? r.string2buf(l.dictionary) : "[object ArrayBuffer]" === i.call(l.dictionary) ? new Uint8Array(l.dictionary) : l.dictionary, o = t.deflateSetDictionary(this.strm, e), o !== _) throw new Error(n[o]);
						this._dict_set = !0;
					}
				}
				function k(t, e) {
					const r = new U(e);
					if (r.push(t, !0), r.err) throw r.msg || n[r.err];
					return r.result;
				}
				return U.prototype.push = function(e, n) {
					const a = this.strm, f = this.options.chunkSize;
					let u, c;
					if (this.ended) return !1;
					for (c = n === ~~n ? n : !0 === n ? h : s, "string" == typeof e ? a.input = r.string2buf(e) : "[object ArrayBuffer]" === i.call(e) ? a.input = new Uint8Array(e) : a.input = e, a.next_in = 0, a.avail_in = a.input.length;;) if (0 === a.avail_out && (a.output = new Uint8Array(f), a.next_out = 0, a.avail_out = f), (c === l || c === o) && a.avail_out <= 6) this.onData(a.output.subarray(0, a.next_out)), a.avail_out = 0;
					else {
						if (u = t.deflate(a, c), u === d) return a.next_out > 0 && this.onData(a.output.subarray(0, a.next_out)), u = t.deflateEnd(this.strm), this.onEnd(u), this.ended = !0, u === _;
						if (0 !== a.avail_out) {
							if (c > 0 && a.next_out > 0) this.onData(a.output.subarray(0, a.next_out)), a.avail_out = 0;
							else if (0 === a.avail_in) break;
						} else this.onData(a.output);
					}
					return !0;
				}, U.prototype.onData = function(t) {
					this.chunks.push(t);
				}, U.prototype.onEnd = function(t) {
					t === _ && (this.result = e.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
				}, f.Deflate = U, f.deflate = k, f.deflateRaw = function(t, e) {
					return (e = e || {}).raw = !0, k(t, e);
				}, f.gzip = function(t, e) {
					return (e = e || {}).gzip = !0, k(t, e);
				}, f.constants = g(), f;
			}().deflate }, E = function() {
				var t = {
					nextZero: function(t, e) {
						for (; 0 != t[e];) e++;
						return e;
					},
					readUshort: function(t, e) {
						return t[e] << 8 | t[e + 1];
					},
					writeUshort: function(t, e, r) {
						t[e] = r >> 8 & 255, t[e + 1] = 255 & r;
					},
					readUint: function(t, e) {
						return 16777216 * t[e] + (t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]);
					},
					writeUint: function(t, e, r) {
						t[e] = r >> 24 & 255, t[e + 1] = r >> 16 & 255, t[e + 2] = r >> 8 & 255, t[e + 3] = 255 & r;
					},
					readASCII: function(t, e, r) {
						for (var n = "", a = 0; a < r; a++) n += String.fromCharCode(t[e + a]);
						return n;
					},
					writeASCII: function(t, e, r) {
						for (var n = 0; n < r.length; n++) t[e + n] = r.charCodeAt(n);
					},
					readBytes: function(t, e, r) {
						for (var n = [], a = 0; a < r; a++) n.push(t[e + a]);
						return n;
					},
					pad: function(t) {
						return t.length < 2 ? "0" + t : t;
					},
					readUTF8: function(e, r, n) {
						for (var a, i = "", s = 0; s < n; s++) i += "%" + t.pad(e[r + s].toString(16));
						try {
							a = decodeURIComponent(i);
						} catch (a) {
							return t.readASCII(e, r, n);
						}
						return a;
					}
				};
				function e(e, r, n, a) {
					var s = r * n, l = i(a), o = Math.ceil(r * l / 8), h = new Uint8Array(4 * s), f = new Uint32Array(h.buffer), _ = a.ctype, d = a.depth, u = t.readUshort;
					if (6 == _) {
						var c = s << 2;
						if (8 == d) for (var g = 0; g < c; g += 4) h[g] = e[g], h[g + 1] = e[g + 1], h[g + 2] = e[g + 2], h[g + 3] = e[g + 3];
						if (16 == d) for (g = 0; g < c; g++) h[g] = e[g << 1];
					} else if (2 == _) {
						var p = a.tabs.tRNS;
						if (null == p) {
							if (8 == d) for (g = 0; g < s; g++) {
								var w = 3 * g;
								f[g] = 255 << 24 | e[w + 2] << 16 | e[w + 1] << 8 | e[w];
							}
							if (16 == d) for (g = 0; g < s; g++) {
								w = 6 * g;
								f[g] = 255 << 24 | e[w + 4] << 16 | e[w + 2] << 8 | e[w];
							}
						} else {
							var v = p[0], b = p[1], m = p[2];
							if (8 == d) for (g = 0; g < s; g++) {
								var y = g << 2;
								w = 3 * g;
								f[g] = 255 << 24 | e[w + 2] << 16 | e[w + 1] << 8 | e[w], e[w] == v && e[w + 1] == b && e[w + 2] == m && (h[y + 3] = 0);
							}
							if (16 == d) for (g = 0; g < s; g++) {
								y = g << 2, w = 6 * g;
								f[g] = 255 << 24 | e[w + 4] << 16 | e[w + 2] << 8 | e[w], u(e, w) == v && u(e, w + 2) == b && u(e, w + 4) == m && (h[y + 3] = 0);
							}
						}
					} else if (3 == _) {
						var A = a.tabs.PLTE, z = a.tabs.tRNS, x = z ? z.length : 0;
						if (1 == d) for (var U = 0; U < n; U++) {
							var k = U * o, E = U * r;
							for (g = 0; g < r; g++) {
								y = E + g << 2;
								var R = 3 * (S = e[k + (g >> 3)] >> 7 - (7 & g) & 1);
								h[y] = A[R], h[y + 1] = A[R + 1], h[y + 2] = A[R + 2], h[y + 3] = S < x ? z[S] : 255;
							}
						}
						if (2 == d) for (U = 0; U < n; U++) for (k = U * o, E = U * r, g = 0; g < r; g++) {
							y = E + g << 2, R = 3 * (S = e[k + (g >> 2)] >> 6 - ((3 & g) << 1) & 3);
							h[y] = A[R], h[y + 1] = A[R + 1], h[y + 2] = A[R + 2], h[y + 3] = S < x ? z[S] : 255;
						}
						if (4 == d) for (U = 0; U < n; U++) for (k = U * o, E = U * r, g = 0; g < r; g++) {
							y = E + g << 2, R = 3 * (S = e[k + (g >> 1)] >> 4 - ((1 & g) << 2) & 15);
							h[y] = A[R], h[y + 1] = A[R + 1], h[y + 2] = A[R + 2], h[y + 3] = S < x ? z[S] : 255;
						}
						if (8 == d) for (g = 0; g < s; g++) {
							var S;
							y = g << 2, R = 3 * (S = e[g]);
							h[y] = A[R], h[y + 1] = A[R + 1], h[y + 2] = A[R + 2], h[y + 3] = S < x ? z[S] : 255;
						}
					} else if (4 == _) {
						if (8 == d) for (g = 0; g < s; g++) {
							y = g << 2;
							var T = e[Z = g << 1];
							h[y] = T, h[y + 1] = T, h[y + 2] = T, h[y + 3] = e[Z + 1];
						}
						if (16 == d) for (g = 0; g < s; g++) {
							var Z;
							y = g << 2, T = e[Z = g << 2];
							h[y] = T, h[y + 1] = T, h[y + 2] = T, h[y + 3] = e[Z + 2];
						}
					} else if (0 == _) for (v = a.tabs.tRNS ? a.tabs.tRNS : -1, U = 0; U < n; U++) {
						var I = U * o, C = U * r;
						if (1 == d) for (var L = 0; L < r; L++) {
							var M = (T = 255 * (e[I + (L >>> 3)] >>> 7 - (7 & L) & 1)) == 255 * v ? 0 : 255;
							f[C + L] = M << 24 | T << 16 | T << 8 | T;
						}
						else if (2 == d) for (L = 0; L < r; L++) {
							M = (T = 85 * (e[I + (L >>> 2)] >>> 6 - ((3 & L) << 1) & 3)) == 85 * v ? 0 : 255;
							f[C + L] = M << 24 | T << 16 | T << 8 | T;
						}
						else if (4 == d) for (L = 0; L < r; L++) {
							M = (T = 17 * (e[I + (L >>> 1)] >>> 4 - ((1 & L) << 2) & 15)) == 17 * v ? 0 : 255;
							f[C + L] = M << 24 | T << 16 | T << 8 | T;
						}
						else if (8 == d) for (L = 0; L < r; L++) {
							M = (T = e[I + L]) == v ? 0 : 255;
							f[C + L] = M << 24 | T << 16 | T << 8 | T;
						}
						else if (16 == d) for (L = 0; L < r; L++) {
							T = e[I + (L << 1)], M = u(e, I + (L << 1)) == v ? 0 : 255;
							f[C + L] = M << 24 | T << 16 | T << 8 | T;
						}
					}
					return h;
				}
				function r(t, e, r, l) {
					var o = i(t), h = Math.ceil(r * o / 8), f = new Uint8Array((h + 1 + t.interlace) * l);
					return e = t.tabs.CgBI ? a(e, f) : n(e, f), 0 == t.interlace ? e = s(e, t, 0, r, l) : 1 == t.interlace && (e = function(t, e) {
						var r = e.width, n = e.height, a = i(e), l = a >> 3, o = Math.ceil(r * a / 8), h = new Uint8Array(n * o), f = 0, _ = [
							0,
							0,
							4,
							0,
							2,
							0,
							1
						], d = [
							0,
							4,
							0,
							2,
							0,
							1,
							0
						], u = [
							8,
							8,
							8,
							4,
							4,
							2,
							2
						], c = [
							8,
							8,
							4,
							4,
							2,
							2,
							1
						], g = 0;
						for (; g < 7;) {
							for (var p = u[g], w = c[g], v = 0, b = 0, m = _[g]; m < n;) m += p, b++;
							for (var y = d[g]; y < r;) y += w, v++;
							var A = Math.ceil(v * a / 8);
							s(t, e, f, v, b);
							for (var z = 0, x = _[g]; x < n;) {
								for (var U = d[g], k = f + z * A << 3; U < r;) {
									var E;
									if (1 == a) E = (E = t[k >> 3]) >> 7 - (7 & k) & 1, h[x * o + (U >> 3)] |= E << 7 - (7 & U);
									if (2 == a) E = (E = t[k >> 3]) >> 6 - (7 & k) & 3, h[x * o + (U >> 2)] |= E << 6 - ((3 & U) << 1);
									if (4 == a) E = (E = t[k >> 3]) >> 4 - (7 & k) & 15, h[x * o + (U >> 1)] |= E << 4 - ((1 & U) << 2);
									if (a >= 8) for (var R = x * o + U * l, S = 0; S < l; S++) h[R + S] = t[(k >> 3) + S];
									k += a, U += w;
								}
								z++, x += p;
							}
							v * b != 0 && (f += b * (1 + A)), g += 1;
						}
						return h;
					}(e, t)), e;
				}
				function n(t, e) {
					return a(new Uint8Array(t.buffer, 2, t.length - 6), e);
				}
				var a = function() {
					var t, e, r = (t = Uint16Array, e = Uint32Array, {
						m: new t(16),
						v: new t(16),
						d: [
							16,
							17,
							18,
							0,
							8,
							7,
							9,
							6,
							10,
							5,
							11,
							4,
							12,
							3,
							13,
							2,
							14,
							1,
							15
						],
						o: [
							3,
							4,
							5,
							6,
							7,
							8,
							9,
							10,
							11,
							13,
							15,
							17,
							19,
							23,
							27,
							31,
							35,
							43,
							51,
							59,
							67,
							83,
							99,
							115,
							131,
							163,
							195,
							227,
							258,
							999,
							999,
							999
						],
						z: [
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							1,
							1,
							1,
							1,
							2,
							2,
							2,
							2,
							3,
							3,
							3,
							3,
							4,
							4,
							4,
							4,
							5,
							5,
							5,
							5,
							0,
							0,
							0,
							0
						],
						B: new t(32),
						p: [
							1,
							2,
							3,
							4,
							5,
							7,
							9,
							13,
							17,
							25,
							33,
							49,
							65,
							97,
							129,
							193,
							257,
							385,
							513,
							769,
							1025,
							1537,
							2049,
							3073,
							4097,
							6145,
							8193,
							12289,
							16385,
							24577,
							65535,
							65535
						],
						w: [
							0,
							0,
							0,
							0,
							1,
							1,
							2,
							2,
							3,
							3,
							4,
							4,
							5,
							5,
							6,
							6,
							7,
							7,
							8,
							8,
							9,
							9,
							10,
							10,
							11,
							11,
							12,
							12,
							13,
							13,
							0,
							0
						],
						h: new e(32),
						g: new t(512),
						s: [],
						A: new t(32),
						t: [],
						k: new t(32768),
						c: [],
						a: [],
						n: new t(32768),
						e: [],
						C: new t(512),
						b: [],
						i: new t(32768),
						r: new e(286),
						f: new e(30),
						l: new e(19),
						u: new e(15e3),
						q: new t(65536),
						j: new t(32768)
					});
					function n(t, e) {
						for (var n, a, i, s, l = t.length, o = r.v, h = 0; h <= e; h++) o[h] = 0;
						for (h = 1; h < l; h += 2) o[t[h]]++;
						var f = r.m;
						for (n = 0, o[0] = 0, a = 1; a <= e; a++) n = n + o[a - 1] << 1, f[a] = n;
						for (i = 0; i < l; i += 2) 0 != (s = t[i + 1]) && (t[i] = f[s], f[s]++);
					}
					function a(t, e, n) {
						for (var a = t.length, i = r.i, s = 0; s < a; s += 2) if (0 != t[s + 1]) for (var l = s >> 1, o = t[s + 1], h = l << 4 | o, f = e - o, _ = t[s] << f, d = _ + (1 << f); _ != d;) n[i[_] >>> 15 - e] = h, _++;
					}
					function i(t, e) {
						for (var n = r.i, a = 15 - e, i = 0; i < t.length; i += 2) {
							var s = t[i] << e - t[i + 1];
							t[i] = n[s] >>> a;
						}
					}
					function s(t, e, r) {
						return (t[e >>> 3] | t[1 + (e >>> 3)] << 8) >>> (7 & e) & (1 << r) - 1;
					}
					function l(t, e, r) {
						return (t[e >>> 3] | t[1 + (e >>> 3)] << 8 | t[2 + (e >>> 3)] << 16) >>> (7 & e) & (1 << r) - 1;
					}
					function o(t, e) {
						return (t[e >>> 3] | t[1 + (e >>> 3)] << 8 | t[2 + (e >>> 3)] << 16) >>> (7 & e);
					}
					function h(t, e) {
						var r = t.length;
						if (e <= r) return t;
						var n = new Uint8Array(Math.max(r << 1, e));
						return n.set(t, 0), n;
					}
					function f(t, e, r, n, a, i) {
						for (var l = 0; l < r;) {
							var h = t[o(n, a) & e];
							a += 15 & h;
							var f = h >>> 4;
							if (f <= 15) i[l] = f, l++;
							else {
								var _ = 0, d = 0;
								16 == f ? (d = 3 + s(n, a, 2), a += 2, _ = i[l - 1]) : 17 == f ? (d = 3 + s(n, a, 3), a += 3) : 18 == f && (d = 11 + s(n, a, 7), a += 7);
								for (var u = l + d; l < u;) i[l] = _, l++;
							}
						}
						return a;
					}
					function _(t, e, r, n) {
						for (var a = 0, i = 0, s = n.length >>> 1; i < r;) {
							var l = t[i + e];
							n[i << 1] = 0, n[1 + (i << 1)] = l, l > a && (a = l), i++;
						}
						for (; i < s;) n[i << 1] = 0, n[1 + (i << 1)] = 0, i++;
						return a;
					}
					return function() {
						for (var t = 0; t < 32768; t++) {
							var e = t;
							e = (4278255360 & (e = (4042322160 & (e = (3435973836 & (e = (2863311530 & e) >>> 1 | (1431655765 & e) << 1)) >>> 2 | (858993459 & e) << 2)) >>> 4 | (252645135 & e) << 4)) >>> 8 | (16711935 & e) << 8, r.i[t] = (e >>> 16 | e << 16) >>> 17;
						}
						function s(t, e, r) {
							for (; 0 != e--;) t.push(0, r);
						}
						for (t = 0; t < 32; t++) r.B[t] = r.o[t] << 3 | r.z[t], r.h[t] = r.p[t] << 4 | r.w[t];
						s(r.s, 144, 8), s(r.s, 112, 9), s(r.s, 24, 7), s(r.s, 8, 8), n(r.s, 9), a(r.s, 9, r.g), i(r.s, 9), s(r.t, 32, 5), n(r.t, 5), a(r.t, 5, r.A), i(r.t, 5), s(r.b, 19, 0), s(r.c, 286, 0), s(r.e, 30, 0), s(r.a, 320, 0);
					}(), function(t, e) {
						var i, d, u = Uint8Array, c = 0, g = 0, p = 0, w = 0, v = 0, b = 0, m = 0, y = 0, A = 0;
						if (3 == t[0] && 0 == t[1]) return e || new u(0);
						var z = null == e;
						for (z && (e = new u(t.length >>> 2 << 3)); 0 == c;) if (c = l(t, A, 1), g = l(t, A + 1, 2), A += 3, 0 != g) {
							if (z && (e = h(e, y + (1 << 17))), 1 == g && (i = r.g, d = r.A, b = 511, m = 31), 2 == g) {
								p = s(t, A, 5) + 257, w = s(t, A + 5, 5) + 1, v = s(t, A + 10, 4) + 4, A += 14;
								for (var x = 1, U = 0; U < 38; U += 2) r.b[U] = 0, r.b[U + 1] = 0;
								for (U = 0; U < v; U++) {
									var k = s(t, A + 3 * U, 3);
									r.b[1 + (r.d[U] << 1)] = k, k > x && (x = k);
								}
								A += 3 * v, n(r.b, x), a(r.b, x, r.C), i = r.k, d = r.n, A = f(r.C, (1 << x) - 1, p + w, t, A, r.a);
								var E = _(r.a, 0, p, r.c);
								b = (1 << E) - 1;
								var R = _(r.a, p, w, r.e);
								m = (1 << R) - 1, n(r.c, E), a(r.c, E, i), n(r.e, R), a(r.e, R, d);
							}
							for (;;) {
								var S = i[o(t, A) & b];
								A += 15 & S;
								var T = S >>> 4;
								if (T >>> 8 == 0) e[y++] = T;
								else {
									if (256 == T) break;
									var Z = y + T - 254;
									if (T > 264) {
										var I = r.B[T - 257];
										Z = y + (I >>> 3) + s(t, A, 7 & I), A += 7 & I;
									}
									var C = d[o(t, A) & m];
									A += 15 & C;
									var L = C >>> 4, M = r.h[L], N = (M >>> 4) + l(t, A, 15 & M);
									for (A += 15 & M, z && (e = h(e, y + (1 << 17))); y < Z;) e[y] = e[y++ - N], e[y] = e[y++ - N], e[y] = e[y++ - N], e[y] = e[y++ - N];
									y = Z;
								}
							}
						} else {
							7 & A && (A += 8 - (7 & A));
							var D = 4 + (A >>> 3), F = t[D - 4] | t[D - 3] << 8;
							z && (e = h(e, y + F)), e.set(new u(t.buffer, t.byteOffset + D, F), y), A = D + F << 3, y += F;
						}
						return e.length == y ? e : e.slice(0, y);
					};
				}();
				function i(t) {
					return [
						1,
						null,
						3,
						1,
						2,
						null,
						4
					][t.ctype] * t.depth;
				}
				function s(t, e, r, n, a) {
					var s = i(e), o = Math.ceil(n * s / 8);
					s = Math.ceil(s / 8);
					var h, f, _ = t[r], d = 0;
					if (_ > 1 && (t[r] = [
						0,
						0,
						1
					][_ - 2]), 3 == _) for (d = s; d < o; d++) t[d + 1] = t[d + 1] + (t[d + 1 - s] >>> 1) & 255;
					for (var u = 0; u < a; u++) if (d = 0, 0 == (_ = t[(f = (h = r + u * o) + u + 1) - 1])) for (; d < o; d++) t[h + d] = t[f + d];
					else if (1 == _) {
						for (; d < s; d++) t[h + d] = t[f + d];
						for (; d < o; d++) t[h + d] = t[f + d] + t[h + d - s];
					} else if (2 == _) for (; d < o; d++) t[h + d] = t[f + d] + t[h + d - o];
					else if (3 == _) {
						for (; d < s; d++) t[h + d] = t[f + d] + (t[h + d - o] >>> 1);
						for (; d < o; d++) t[h + d] = t[f + d] + (t[h + d - o] + t[h + d - s] >>> 1);
					} else {
						for (; d < s; d++) t[h + d] = t[f + d] + l(0, t[h + d - o], 0);
						for (; d < o; d++) t[h + d] = t[f + d] + l(t[h + d - s], t[h + d - o], t[h + d - s - o]);
					}
					return t;
				}
				function l(t, e, r) {
					var n = t + e - r, a = n - t, i = n - e, s = n - r;
					return a * a <= i * i && a * a <= s * s ? t : i * i <= s * s ? e : r;
				}
				function o(e, r, n) {
					n.width = t.readUint(e, r), r += 4, n.height = t.readUint(e, r), r += 4, n.depth = e[r], r++, n.ctype = e[r], r++, n.compress = e[r], r++, n.filter = e[r], r++, n.interlace = e[r], r++;
				}
				function h(t, e, r, n, a, i, s, l, o) {
					for (var h = Math.min(e, a), f = Math.min(r, i), _ = 0, d = 0, u = 0; u < f; u++) for (var c = 0; c < h; c++) if (s >= 0 && l >= 0 ? (_ = u * e + c << 2, d = (l + u) * a + s + c << 2) : (_ = (-l + u) * e - s + c << 2, d = u * a + c << 2), 0 == o) n[d] = t[_], n[d + 1] = t[_ + 1], n[d + 2] = t[_ + 2], n[d + 3] = t[_ + 3];
					else if (1 == o) {
						var g = t[_ + 3] * (1 / 255), p = t[_] * g, w = t[_ + 1] * g, v = t[_ + 2] * g, b = n[d + 3] * (1 / 255), m = n[d] * b, y = n[d + 1] * b, A = n[d + 2] * b, z = 1 - g, x = g + b * z, U = 0 == x ? 0 : 1 / x;
						n[d + 3] = 255 * x, n[d + 0] = (p + m * z) * U, n[d + 1] = (w + y * z) * U, n[d + 2] = (v + A * z) * U;
					} else if (2 == o) {
						g = t[_ + 3], p = t[_], w = t[_ + 1], v = t[_ + 2], b = n[d + 3], m = n[d], y = n[d + 1], A = n[d + 2];
						g == b && p == m && w == y && v == A ? (n[d] = 0, n[d + 1] = 0, n[d + 2] = 0, n[d + 3] = 0) : (n[d] = p, n[d + 1] = w, n[d + 2] = v, n[d + 3] = g);
					} else if (3 == o) {
						g = t[_ + 3], p = t[_], w = t[_ + 1], v = t[_ + 2], b = n[d + 3], m = n[d], y = n[d + 1], A = n[d + 2];
						if (g == b && p == m && w == y && v == A) continue;
						if (g < 220 && b > 20) return !1;
					}
					return !0;
				}
				return {
					decode: function(e) {
						for (var i, s = new Uint8Array(e), l = 8, h = t, f = h.readUshort, _ = h.readUint, d = {
							tabs: {},
							frames: []
						}, u = new Uint8Array(s.length), c = 0, g = 0, p = [
							137,
							80,
							78,
							71,
							13,
							10,
							26,
							10
						], w = 0; w < 8; w++) if (s[w] != p[w]) throw "The input is not a PNG file!";
						for (; l < s.length;) {
							var v = h.readUint(s, l);
							l += 4;
							var b = h.readASCII(s, l, 4);
							if (l += 4, "IHDR" == b) o(s, l, d);
							else if ("iCCP" == b) {
								for (var m = l; 0 != s[m];) m++;
								h.readASCII(s, l, m - l), s[m + 1];
								var y = s.slice(m + 2, l + v), A = null;
								try {
									A = n(y);
								} catch (t) {
									A = a(y);
								}
								d.tabs[b] = A;
							} else if ("CgBI" == b) d.tabs[b] = s.slice(l, l + 4);
							else if ("IDAT" == b) {
								for (w = 0; w < v; w++) u[c + w] = s[l + w];
								c += v;
							} else if ("acTL" == b) d.tabs[b] = {
								num_frames: _(s, l),
								num_plays: _(s, l + 4)
							}, i = new Uint8Array(s.length);
							else if ("fcTL" == b) {
								var z;
								if (0 != g) (z = d.frames[d.frames.length - 1]).data = r(d, i.slice(0, g), z.rect.width, z.rect.height), g = 0;
								var x = {
									x: _(s, l + 12),
									y: _(s, l + 16),
									width: _(s, l + 4),
									height: _(s, l + 8)
								}, U = f(s, l + 22);
								U = f(s, l + 20) / (0 == U ? 100 : U);
								var k = {
									rect: x,
									delay: Math.round(1e3 * U),
									dispose: s[l + 24],
									blend: s[l + 25]
								};
								d.frames.push(k);
							} else if ("fdAT" == b) {
								for (w = 0; w < v - 4; w++) i[g + w] = s[l + w + 4];
								g += v - 4;
							} else if ("pHYs" == b) d.tabs[b] = [
								h.readUint(s, l),
								h.readUint(s, l + 4),
								s[l + 8]
							];
							else if ("cHRM" == b) {
								d.tabs[b] = [];
								for (w = 0; w < 8; w++) d.tabs[b].push(h.readUint(s, l + 4 * w));
							} else if ("tEXt" == b || "zTXt" == b) {
								d.tabs[b] ?? (d.tabs[b] = {});
								var E = h.nextZero(s, l), R = h.readASCII(s, l, E - l), S = l + v - E - 1;
								if ("tEXt" == b) I = h.readASCII(s, E + 1, S);
								else {
									var T = n(s.slice(E + 2, E + 2 + S));
									I = h.readUTF8(T, 0, T.length);
								}
								d.tabs[b][R] = I;
							} else if ("iTXt" == b) {
								d.tabs[b] ?? (d.tabs[b] = {});
								E = 0, m = l;
								E = h.nextZero(s, m);
								R = h.readASCII(s, m, E - m);
								var Z = s[m = E + 1];
								s[m + 1], m += 2, E = h.nextZero(s, m), h.readASCII(s, m, E - m), m = E + 1, E = h.nextZero(s, m), h.readUTF8(s, m, E - m);
								var I;
								S = v - ((m = E + 1) - l);
								if (0 == Z) I = h.readUTF8(s, m, S);
								else {
									T = n(s.slice(m, m + S));
									I = h.readUTF8(T, 0, T.length);
								}
								d.tabs[b][R] = I;
							} else if ("PLTE" == b) d.tabs[b] = h.readBytes(s, l, v);
							else if ("hIST" == b) {
								var C = d.tabs.PLTE.length / 3;
								d.tabs[b] = [];
								for (w = 0; w < C; w++) d.tabs[b].push(f(s, l + 2 * w));
							} else if ("tRNS" == b) 3 == d.ctype ? d.tabs[b] = h.readBytes(s, l, v) : 0 == d.ctype ? d.tabs[b] = f(s, l) : 2 == d.ctype && (d.tabs[b] = [
								f(s, l),
								f(s, l + 2),
								f(s, l + 4)
							]);
							else if ("gAMA" == b) d.tabs[b] = h.readUint(s, l) / 1e5;
							else if ("sRGB" == b) d.tabs[b] = s[l];
							else if ("bKGD" == b) 0 == d.ctype || 4 == d.ctype ? d.tabs[b] = [f(s, l)] : 2 == d.ctype || 6 == d.ctype ? d.tabs[b] = [
								f(s, l),
								f(s, l + 2),
								f(s, l + 4)
							] : 3 == d.ctype && (d.tabs[b] = s[l]);
							else if ("IEND" == b) break;
							l += v, h.readUint(s, l), l += 4;
						}
						return 0 != g && ((z = d.frames[d.frames.length - 1]).data = r(d, i.slice(0, g), z.rect.width, z.rect.height)), d.data = r(d, u, d.width, d.height), delete d.compress, delete d.interlace, delete d.filter, d;
					},
					toRGBA8: function(t) {
						var r = t.width, n = t.height;
						if (null == t.tabs.acTL) return [e(t.data, r, n, t).buffer];
						var a = [];
						t.frames[0].data ?? (t.frames[0].data = t.data);
						for (var i = r * n * 4, s = new Uint8Array(i), l = new Uint8Array(i), o = new Uint8Array(i), f = 0; f < t.frames.length; f++) {
							var _ = t.frames[f], d = _.rect.x, u = _.rect.y, c = _.rect.width, g = _.rect.height, p = e(_.data, c, g, t);
							if (0 != f) for (var w = 0; w < i; w++) o[w] = s[w];
							if (0 == _.blend ? h(p, c, g, s, r, n, d, u, 0) : 1 == _.blend && h(p, c, g, s, r, n, d, u, 1), a.push(s.buffer.slice(0)), 0 == _.dispose);
							else if (1 == _.dispose) h(l, c, g, s, r, n, d, u, 0);
							else if (2 == _.dispose) for (w = 0; w < i; w++) s[w] = o[w];
						}
						return a;
					},
					_paeth: l,
					_copyTile: h,
					_bin: t
				};
			}();
			return function() {
				var t = E._copyTile, e = E._bin, r = E._paeth, n = {
					table: function() {
						for (var t = /* @__PURE__ */ new Uint32Array(256), e = 0; e < 256; e++) {
							for (var r = e, n = 0; n < 8; n++) 1 & r ? r = 3988292384 ^ r >>> 1 : r >>>= 1;
							t[e] = r;
						}
						return t;
					}(),
					update: function(t, e, r, a) {
						for (var i = 0; i < a; i++) t = n.table[255 & (t ^ e[r + i])] ^ t >>> 8;
						return t;
					},
					crc: function(t, e, r) {
						return 4294967295 ^ n.update(4294967295, t, e, r);
					}
				};
				function a(t, e, r, n) {
					e[r] += t[0] * n >> 4, e[r + 1] += t[1] * n >> 4, e[r + 2] += t[2] * n >> 4, e[r + 3] += t[3] * n >> 4;
				}
				function i(t) {
					return Math.max(0, Math.min(255, t));
				}
				function s(t, e) {
					var r = t[0] - e[0], n = t[1] - e[1], a = t[2] - e[2], i = t[3] - e[3];
					return r * r + n * n + a * a + i * i;
				}
				function l(t, e, r, n, l, o, h) {
					h ??= 1;
					for (var f = n.length, _ = [], d = 0; d < f; d++) {
						var u = n[d];
						_.push([
							u >>> 0 & 255,
							u >>> 8 & 255,
							u >>> 16 & 255,
							u >>> 24 & 255
						]);
					}
					for (d = 0; d < f; d++) for (var c = 4294967295, g = 0, p = 0; p < f; p++) {
						var w = s(_[d], _[p]);
						p != d && w < c && (c = w, g = p);
					}
					var v = new Uint32Array(l.buffer), b = new Int16Array(e * r * 4), m = [
						0,
						8,
						2,
						10,
						12,
						4,
						14,
						6,
						3,
						11,
						1,
						9,
						15,
						7,
						13,
						5
					];
					for (d = 0; d < m.length; d++) m[d] = 255 * ((m[d] + .5) / 16 - .5);
					for (var y = 0; y < r; y++) for (var A = 0; A < e; A++) {
						var z;
						d = 4 * (y * e + A);
						if (2 != h) z = [
							i(t[d] + b[d]),
							i(t[d + 1] + b[d + 1]),
							i(t[d + 2] + b[d + 2]),
							i(t[d + 3] + b[d + 3])
						];
						else {
							w = m[4 * (3 & y) + (3 & A)];
							z = [
								i(t[d] + w),
								i(t[d + 1] + w),
								i(t[d + 2] + w),
								i(t[d + 3] + w)
							];
						}
						g = 0;
						var x = 16777215;
						for (p = 0; p < f; p++) {
							var U = s(z, _[p]);
							U < x && (x = U, g = p);
						}
						var k = _[g], E = [
							z[0] - k[0],
							z[1] - k[1],
							z[2] - k[2],
							z[3] - k[3]
						];
						1 == h && (A != e - 1 && a(E, b, d + 4, 7), y != r - 1 && (0 != A && a(E, b, d + 4 * e - 4, 3), a(E, b, d + 4 * e, 5), A != e - 1 && a(E, b, d + 4 * e + 4, 1))), o[d >> 2] = g, v[d >> 2] = n[g];
					}
				}
				function o(t, r, a, i, s) {
					s ??= {};
					var l, o = n.crc, h = e.writeUint, f = e.writeUshort, _ = e.writeASCII, d = 8, u = t.frames.length > 1, c = !1, g = 33 + (u ? 20 : 0);
					if (null != s.sRGB && (g += 13), null != s.pHYs && (g += 21), null != s.iCCP && (g += 21 + (l = k.deflate(s.iCCP)).length + 4), 3 == t.ctype) {
						for (var p = t.plte.length, w = 0; w < p; w++) t.plte[w] >>> 24 != 255 && (c = !0);
						g += 8 + 3 * p + 4 + (c ? 8 + 1 * p + 4 : 0);
					}
					for (var v = 0; v < t.frames.length; v++) u && (g += 38), g += (S = t.frames[v]).cimg.length + 12, 0 != v && (g += 4);
					g += 12;
					var b = new Uint8Array(g), m = [
						137,
						80,
						78,
						71,
						13,
						10,
						26,
						10
					];
					for (w = 0; w < 8; w++) b[w] = m[w];
					if (h(b, d, 13), _(b, d += 4, "IHDR"), h(b, d += 4, r), h(b, d += 4, a), b[d += 4] = t.depth, b[++d] = t.ctype, b[++d] = 0, b[++d] = 0, b[++d] = 0, h(b, ++d, o(b, d - 17, 17)), d += 4, null != s.sRGB && (h(b, d, 1), _(b, d += 4, "sRGB"), b[d += 4] = s.sRGB, h(b, ++d, o(b, d - 5, 5)), d += 4), null != s.iCCP) {
						var y = 13 + l.length;
						h(b, d, y), _(b, d += 4, "iCCP"), _(b, d += 4, "ICC profile"), d += 11, d += 2, b.set(l, d), h(b, d += l.length, o(b, d - (y + 4), y + 4)), d += 4;
					}
					if (null != s.pHYs && (h(b, d, 9), _(b, d += 4, "pHYs"), h(b, d += 4, s.pHYs[0]), h(b, d += 4, s.pHYs[1]), b[d += 4] = s.pHYs[2], h(b, ++d, o(b, d - 13, 13)), d += 4), u && (h(b, d, 8), _(b, d += 4, "acTL"), h(b, d += 4, t.frames.length), h(b, d += 4, null != s.loop ? s.loop : 0), h(b, d += 4, o(b, d - 12, 12)), d += 4), 3 == t.ctype) {
						h(b, d, 3 * (p = t.plte.length)), _(b, d += 4, "PLTE"), d += 4;
						for (w = 0; w < p; w++) {
							var A = 3 * w, z = t.plte[w], x = 255 & z, U = z >>> 8 & 255, E = z >>> 16 & 255;
							b[d + A + 0] = x, b[d + A + 1] = U, b[d + A + 2] = E;
						}
						if (h(b, d += 3 * p, o(b, d - 3 * p - 4, 3 * p + 4)), d += 4, c) {
							h(b, d, p), _(b, d += 4, "tRNS"), d += 4;
							for (w = 0; w < p; w++) b[d + w] = t.plte[w] >>> 24 & 255;
							h(b, d += p, o(b, d - p - 4, p + 4)), d += 4;
						}
					}
					var R = 0;
					for (v = 0; v < t.frames.length; v++) {
						var S = t.frames[v];
						u && (h(b, d, 26), _(b, d += 4, "fcTL"), h(b, d += 4, R++), h(b, d += 4, S.rect.width), h(b, d += 4, S.rect.height), h(b, d += 4, S.rect.x), h(b, d += 4, S.rect.y), f(b, d += 4, i[v]), f(b, d += 2, 1e3), b[d += 2] = S.dispose, b[++d] = S.blend, h(b, ++d, o(b, d - 30, 30)), d += 4);
						var T = S.cimg;
						h(b, d, (p = T.length) + (0 == v ? 0 : 4));
						var Z = d += 4;
						_(b, d, 0 == v ? "IDAT" : "fdAT"), d += 4, 0 != v && (h(b, d, R++), d += 4), b.set(T, d), h(b, d += p, o(b, Z, d - Z)), d += 4;
					}
					return h(b, d, 0), _(b, d += 4, "IEND"), h(b, d += 4, o(b, d - 4, 4)), d += 4, b.buffer;
				}
				function h(t, e, r) {
					for (var n = 0; n < t.frames.length; n++) {
						var a = t.frames[n];
						a.rect.width;
						var i = a.rect.height, s = new Uint8Array(i * a.bpl + i);
						a.cimg = u(a.img, i, a.bpp, a.bpl, s, e, r);
					}
				}
				function f(e, r, n, a, i) {
					for (var s = i[0], o = i[1], h = i[2], f = i[3], u = i[4], c = i[5], p = 6, w = 8, v = 255, b = 0; b < e.length; b++) for (var m = new Uint8Array(e[b]), y = m.length, A = 0; A < y; A += 4) v &= m[A + 3];
					var z = 255 != v, x = function(e, r, n, a, i, s) {
						for (var l = [], o = 0; o < e.length; o++) {
							var h, f = new Uint8Array(e[o]), u = new Uint32Array(f.buffer), c = 0, g = 0, p = r, w = n, v = a ? 1 : 0;
							if (0 != o) {
								for (var b = s || a || 1 == o || 0 != l[o - 2].dispose ? 1 : 2, m = 0, y = 1e9, A = 0; A < b; A++) {
									for (var z = new Uint8Array(e[o - 1 - A]), x = new Uint32Array(e[o - 1 - A]), U = r, k = n, E = -1, R = -1, S = 0; S < n; S++) for (var T = 0; T < r; T++) u[D = S * r + T] != x[D] && (T < U && (U = T), T > E && (E = T), S < k && (k = S), S > R && (R = S));
									-1 == E && (U = k = E = R = 0), i && (1 & ~U || U--, 1 & ~k || k--);
									var Z = (E - U + 1) * (R - k + 1);
									Z < y && (y = Z, m = A, c = U, g = k, p = E - U + 1, w = R - k + 1);
								}
								z = new Uint8Array(e[o - 1 - m]);
								1 == m && (l[o - 1].dispose = 2), h = new Uint8Array(p * w * 4), t(z, r, n, h, p, w, -c, -g, 0), 1 == (v = t(f, r, n, h, p, w, -c, -g, 3) ? 1 : 0) ? d(f, r, n, h, {
									x: c,
									y: g,
									width: p,
									height: w
								}) : t(f, r, n, h, p, w, -c, -g, 0);
							} else h = f.slice(0);
							l.push({
								rect: {
									x: c,
									y: g,
									width: p,
									height: w
								},
								img: h,
								blend: v,
								dispose: 0
							});
						}
						if (a) {
							for (o = 0; o < l.length; o++) if (1 != (F = l[o]).blend) {
								var I = F.rect, C = l[o - 1].rect, L = Math.min(I.x, C.x), M = Math.min(I.y, C.y), N = {
									x: L,
									y: M,
									width: Math.max(I.x + I.width, C.x + C.width) - L,
									height: Math.max(I.y + I.height, C.y + C.height) - M
								};
								l[o - 1].dispose = 1, o - 1 != 0 && _(e, r, n, l, o - 1, N, i), _(e, r, n, l, o, N, i);
							}
						}
						if (1 != e.length) for (var D = 0; D < l.length; D++) {
							var F;
							(F = l[D]).rect.width * F.rect.height;
						}
						return l;
					}(e, r, n, s, o, h), U = {}, k = [], E = [];
					if (0 != a) {
						var R = [];
						for (A = 0; A < x.length; A++) R.push(x[A].img.buffer);
						var T = g(function(t) {
							for (var e = 0, r = 0; r < t.length; r++) e += t[r].byteLength;
							var n = new Uint8Array(e), a = 0;
							for (r = 0; r < t.length; r++) {
								for (var i = new Uint8Array(t[r]), s = i.length, l = 0; l < s; l += 4) {
									var o = i[l], h = i[l + 1], f = i[l + 2], _ = i[l + 3];
									0 == _ && (o = h = f = 0), n[a + l] = o, n[a + l + 1] = h, n[a + l + 2] = f, n[a + l + 3] = _;
								}
								a += s;
							}
							return n.buffer;
						}(R), a);
						for (A = 0; A < T.plte.length; A++) k.push(T.plte[A].est.rgba);
						var Z = 0;
						for (A = 0; A < x.length; A++) {
							var I = (M = x[A]).img.length, C = new Uint8Array(T.inds.buffer, Z >> 2, I >> 2);
							E.push(C);
							var L = new Uint8Array(T.abuf, Z, I);
							c && l(M.img, M.rect.width, M.rect.height, k, L, C), M.img.set(L), Z += I;
						}
					} else for (b = 0; b < x.length; b++) {
						var M = x[b], N = new Uint32Array(M.img.buffer), D = M.rect.width;
						y = N.length, C = new Uint8Array(y);
						E.push(C);
						for (A = 0; A < y; A++) {
							var F = N[A];
							if (0 != A && F == N[A - 1]) C[A] = C[A - 1];
							else if (A > D && F == N[A - D]) C[A] = C[A - D];
							else {
								var O = U[F];
								if (null == O && (U[F] = O = k.length, k.push(F), k.length >= 300)) break;
								C[A] = O;
							}
						}
					}
					var B = k.length;
					B <= 256 && 0 == u && (w = B <= 2 ? 1 : B <= 4 ? 2 : B <= 16 ? 4 : 8, w = Math.max(w, f));
					for (b = 0; b < x.length; b++) {
						(M = x[b]).rect.x, M.rect.y;
						D = M.rect.width;
						var H = M.rect.height, P = M.img;
						new Uint32Array(P.buffer);
						var Y = 4 * D, q = 4;
						if (B <= 256 && 0 == u) {
							Y = Math.ceil(w * D / 8);
							for (var G = new Uint8Array(Y * H), K = E[b], j = 0; j < H; j++) {
								A = j * Y;
								var X = j * D;
								if (8 == w) for (var V = 0; V < D; V++) G[A + V] = K[X + V];
								else if (4 == w) for (V = 0; V < D; V++) G[A + (V >> 1)] |= K[X + V] << 4 - 4 * (1 & V);
								else if (2 == w) for (V = 0; V < D; V++) G[A + (V >> 2)] |= K[X + V] << 6 - 2 * (3 & V);
								else if (1 == w) for (V = 0; V < D; V++) G[A + (V >> 3)] |= K[X + V] << 7 - 1 * (7 & V);
							}
							P = G, p = 3, q = 1;
						} else if (0 == z && 1 == x.length) {
							G = new Uint8Array(D * H * 3);
							var W = D * H;
							for (A = 0; A < W; A++) {
								var J = 3 * A, Q = 4 * A;
								G[J] = P[Q], G[J + 1] = P[Q + 1], G[J + 2] = P[Q + 2];
							}
							P = G, p = 2, q = 3, Y = 3 * D;
						}
						M.img = P, M.bpl = Y, M.bpp = q;
					}
					return {
						ctype: p,
						depth: w,
						plte: k,
						frames: x
					};
				}
				function _(e, r, n, a, i, s, l) {
					for (var o = Uint8Array, h = Uint32Array, f = new o(e[i - 1]), _ = new h(e[i - 1]), u = i + 1 < e.length ? new o(e[i + 1]) : null, c = new o(e[i]), g = new h(c.buffer), p = r, w = n, v = -1, b = -1, m = 0; m < s.height; m++) for (var y = 0; y < s.width; y++) {
						var A = s.x + y, z = s.y + m, x = z * r + A, U = g[x];
						0 == U || 0 == a[i - 1].dispose && _[x] == U && (null == u || 0 != u[4 * x + 3]) || (A < p && (p = A), A > v && (v = A), z < w && (w = z), z > b && (b = z));
					}
					-1 == v && (p = w = v = b = 0), l && (1 & ~p || p--, 1 & ~w || w--), s = {
						x: p,
						y: w,
						width: v - p + 1,
						height: b - w + 1
					};
					var k = a[i];
					k.rect = s, k.blend = 1, k.img = new Uint8Array(s.width * s.height * 4), 0 == a[i - 1].dispose ? (t(f, r, n, k.img, s.width, s.height, -s.x, -s.y, 0), d(c, r, n, k.img, s)) : t(c, r, n, k.img, s.width, s.height, -s.x, -s.y, 0);
				}
				function d(e, r, n, a, i) {
					t(e, r, n, a, i.width, i.height, -i.x, -i.y, 2);
				}
				function u(t, e, r, n, a, i, s) {
					var l, o = [], h = [
						0,
						1,
						2,
						3,
						4
					];
					-1 != i ? h = [i] : (e * n > 5e5 || 1 == r) && (h = [0]), s && (l = { level: 0 });
					for (var f = a.length > 1e7 && null != window.UZIP ? window.UZIP : k, _ = 0; _ < h.length; _++) {
						for (var d = 0; d < e; d++) c(a, t, d, n, r, h[_]);
						o.push(f.deflate(a, l));
					}
					var u, g = 1e9;
					for (_ = 0; _ < o.length; _++) o[_].length < g && (u = _, g = o[_].length);
					return o[u];
				}
				function c(t, e, n, a, i, s) {
					var l = n * a, o = l + n;
					if (t[o] = s, o++, 0 == s) if (a < 500) for (var h = 0; h < a; h++) t[o + h] = e[l + h];
					else t.set(new Uint8Array(e.buffer, l, a), o);
					else if (1 == s) {
						for (h = 0; h < i; h++) t[o + h] = e[l + h];
						for (h = i; h < a; h++) t[o + h] = e[l + h] - e[l + h - i] + 256 & 255;
					} else if (0 == n) {
						for (h = 0; h < i; h++) t[o + h] = e[l + h];
						if (2 == s) for (h = i; h < a; h++) t[o + h] = e[l + h];
						if (3 == s) for (h = i; h < a; h++) t[o + h] = e[l + h] - (e[l + h - i] >> 1) + 256 & 255;
						if (4 == s) for (h = i; h < a; h++) t[o + h] = e[l + h] - r(e[l + h - i], 0, 0) + 256 & 255;
					} else {
						if (2 == s) for (h = 0; h < a; h++) t[o + h] = e[l + h] + 256 - e[l + h - a] & 255;
						if (3 == s) {
							for (h = 0; h < i; h++) t[o + h] = e[l + h] + 256 - (e[l + h - a] >> 1) & 255;
							for (h = i; h < a; h++) t[o + h] = e[l + h] + 256 - (e[l + h - a] + e[l + h - i] >> 1) & 255;
						}
						if (4 == s) {
							for (h = 0; h < i; h++) t[o + h] = e[l + h] + 256 - r(0, e[l + h - a], 0) & 255;
							for (h = i; h < a; h++) t[o + h] = e[l + h] + 256 - r(e[l + h - i], e[l + h - a], e[l + h - i - a]) & 255;
						}
					}
				}
				function g(t, e, r) {
					for (var n = new Uint8Array(t), a = n.slice(0), i = new Uint32Array(a.buffer), s = b(a, e), l = s[0], o = s[1], h = o.length, f = new Uint32Array(h), _ = new Uint8Array(f.buffer), d = 0; d < h; d++) f[d] = o[d].est.rgba;
					var u, c = n.length, g = new Uint8Array(c >> 2);
					if (h <= 60) v(n, g, _), p(g, i, f);
					else if (n.length < 32e6) for (d = 0; d < c; d += 4) u = m(l, A = n[d] * (1 / 255), z = n[d + 1] * (1 / 255), x = n[d + 2] * (1 / 255), U = n[d + 3] * (1 / 255)), g[d >> 2] = u.ind, i[d >> 2] = u.est.rgba;
					else for (d = 0; d < c; d += 4) {
						var A = n[d] * (1 / 255), z = n[d + 1] * (1 / 255), x = n[d + 2] * (1 / 255), U = n[d + 3] * (1 / 255);
						for (u = l; u.left;) u = y(u.est, A, z, x, U) <= 0 ? u.left : u.right;
						g[d >> 2] = u.ind, i[d >> 2] = u.est.rgba;
					}
					if (r || n.length * h < 4e7) {
						var k = 1e9;
						for (d = 0; d < 10; d++) {
							var E = w(n, g, _);
							if (E / k > .997) break;
							k = E;
						}
						for (d = 0; d < h; d++) o[d].est.rgba = f[d];
						p(g, i, f);
					}
					return {
						abuf: a.buffer,
						inds: g,
						plte: o
					};
				}
				function p(t, e, r) {
					for (var n = 0; n < t.length; n++) e[n] = r[t[n]];
				}
				function w(t, e, r) {
					return function(t, e, r) {
						for (var n = r.length >>> 2, a = new Uint32Array(4 * n), i = new Uint32Array(n), s = 0; s < t.length; s += 4) {
							var l = e[s >>> 2], o = 4 * l;
							i[l]++, a[o] += t[s], a[o + 1] += t[s + 1], a[o + 2] += t[s + 2], a[o + 3] += t[s + 3];
						}
						for (s = 0; s < r.length; s++) r[s] = Math.round(a[s] / i[s >>> 2]);
					}(t, e, r), v(t, e, r);
				}
				function v(t, e, r) {
					for (var n = 0, a = r.length >>> 2, i = [], s = 0; s < a; s++) {
						for (var l = r[g = 4 * s], o = r[g + 1], h = r[g + 2], f = r[g + 3], _ = 0, d = 1e9, u = 0; u < a; u++) if (s != u) {
							var c = 4 * u;
							(m = (p = l - r[c]) * p + (w = o - r[c + 1]) * w + (v = h - r[c + 2]) * v + (b = f - r[c + 3]) * b) < d && (d = m, _ = u);
						}
						i[s] = .5 * Math.sqrt(d), i[s] = i[s] * i[s];
					}
					for (s = 0; s < t.length; s += 4) {
						var g, p, w, v, b;
						l = t[s], o = t[s + 1], h = t[s + 2], f = t[s + 3];
						if ((d = (p = l - r[g = 4 * (_ = e[s >>> 2])]) * p + (w = o - r[g + 1]) * w + (v = h - r[g + 2]) * v + (b = f - r[g + 3]) * b) > i[_]) for (u = 0; u < a; u++) {
							var m;
							if ((m = (p = l - r[g = 4 * u]) * p + (w = o - r[g + 1]) * w + (v = h - r[g + 2]) * v + (b = f - r[g + 3]) * b) < d && (_ = u, (d = m) < i[u])) break;
						}
						e[s >>> 2] = _, n += d;
					}
					return n / (t.length >>> 2);
				}
				function b(t, e, r) {
					r ??= 1e-4;
					var n = new Uint32Array(t.buffer), a = {
						i0: 0,
						i1: t.length,
						bst: null,
						est: null,
						tdst: 0,
						left: null,
						right: null
					};
					a.bst = x(t, a.i0, a.i1), a.est = U(a.bst);
					for (var i = [a]; i.length < e;) {
						for (var s = 0, l = 0, o = 0; o < i.length; o++) i[o].est.L > s && (s = i[o].est.L, l = o);
						if (s < r) break;
						var h = i[l], f = A(t, n, h.i0, h.i1, h.est.e, h.est.eMq255);
						if (h.i0 >= f || h.i1 <= f) h.est.L = 0;
						else {
							var _ = {
								i0: h.i0,
								i1: f,
								bst: null,
								est: null,
								tdst: 0,
								left: null,
								right: null
							};
							_.bst = x(t, _.i0, _.i1), _.est = U(_.bst);
							var d = {
								i0: f,
								i1: h.i1,
								bst: null,
								est: null,
								tdst: 0,
								left: null,
								right: null
							};
							d.bst = {
								R: [],
								m: [],
								N: h.bst.N - _.bst.N
							};
							for (o = 0; o < 16; o++) d.bst.R[o] = h.bst.R[o] - _.bst.R[o];
							for (o = 0; o < 4; o++) d.bst.m[o] = h.bst.m[o] - _.bst.m[o];
							d.est = U(d.bst), h.left = _, h.right = d, i[l] = _, i.push(d);
						}
					}
					i.sort((function(t, e) {
						return e.bst.N - t.bst.N;
					}));
					for (o = 0; o < i.length; o++) i[o].ind = o;
					return [a, i];
				}
				function m(t, e, r, n, a) {
					if (null == t.left) return t.tdst = function(t, e, r, n, a) {
						var i = e - t[0], s = r - t[1], l = n - t[2], o = a - t[3];
						return i * i + s * s + l * l + o * o;
					}(t.est.q, e, r, n, a), t;
					var i = y(t.est, e, r, n, a), s = t.left, l = t.right;
					i > 0 && (s = t.right, l = t.left);
					var o = m(s, e, r, n, a);
					if (o.tdst <= i * i) return o;
					var h = m(l, e, r, n, a);
					return h.tdst < o.tdst ? h : o;
				}
				function y(t, e, r, n, a) {
					var i = t.e;
					return i[0] * e + i[1] * r + i[2] * n + i[3] * a - t.eMq;
				}
				function A(t, e, r, n, a, i) {
					for (n -= 4; r < n;) {
						for (; z(t, r, a) <= i;) r += 4;
						for (; z(t, n, a) > i;) n -= 4;
						if (r >= n) break;
						var s = e[r >> 2];
						e[r >> 2] = e[n >> 2], e[n >> 2] = s, r += 4, n -= 4;
					}
					for (; z(t, r, a) > i;) r -= 4;
					return r + 4;
				}
				function z(t, e, r) {
					return t[e] * r[0] + t[e + 1] * r[1] + t[e + 2] * r[2] + t[e + 3] * r[3];
				}
				function x(t, e, r) {
					for (var n = [
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					], a = [
						0,
						0,
						0,
						0
					], i = r - e >> 2, s = e; s < r; s += 4) {
						var l = t[s] * (1 / 255), o = t[s + 1] * (1 / 255), h = t[s + 2] * (1 / 255), f = t[s + 3] * (1 / 255);
						a[0] += l, a[1] += o, a[2] += h, a[3] += f, n[0] += l * l, n[1] += l * o, n[2] += l * h, n[3] += l * f, n[5] += o * o, n[6] += o * h, n[7] += o * f, n[10] += h * h, n[11] += h * f, n[15] += f * f;
					}
					return n[4] = n[1], n[8] = n[2], n[9] = n[6], n[12] = n[3], n[13] = n[7], n[14] = n[11], {
						R: n,
						m: a,
						N: i
					};
				}
				function U(t) {
					var e = t.R, r = t.m, n = t.N, a = r[0], i = r[1], s = r[2], l = r[3], o = 0 == n ? 0 : 1 / n, h = [
						e[0] - a * a * o,
						e[1] - a * i * o,
						e[2] - a * s * o,
						e[3] - a * l * o,
						e[4] - i * a * o,
						e[5] - i * i * o,
						e[6] - i * s * o,
						e[7] - i * l * o,
						e[8] - s * a * o,
						e[9] - s * i * o,
						e[10] - s * s * o,
						e[11] - s * l * o,
						e[12] - l * a * o,
						e[13] - l * i * o,
						e[14] - l * s * o,
						e[15] - l * l * o
					], f = h, _ = R, d = [
						Math.random(),
						Math.random(),
						Math.random(),
						Math.random()
					], u = 0, c = 0;
					if (0 != n) for (var g = 0; g < 16 && (d = _.multVec(f, d), c = Math.sqrt(_.dot(d, d)), d = _.sml(1 / c, d), !(0 != g && Math.abs(c - u) < 1e-9)); g++) u = c;
					var p = [
						a * o,
						i * o,
						s * o,
						l * o
					];
					return {
						Cov: h,
						q: p,
						e: d,
						L: u,
						eMq255: _.dot(_.sml(255, p), d),
						eMq: _.dot(d, p),
						rgba: (Math.round(255 * p[3]) << 24 | Math.round(255 * p[2]) << 16 | Math.round(255 * p[1]) << 8 | Math.round(255 * p[0])) >>> 0
					};
				}
				var R = {
					multVec: function(t, e) {
						return [
							t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3],
							t[4] * e[0] + t[5] * e[1] + t[6] * e[2] + t[7] * e[3],
							t[8] * e[0] + t[9] * e[1] + t[10] * e[2] + t[11] * e[3],
							t[12] * e[0] + t[13] * e[1] + t[14] * e[2] + t[15] * e[3]
						];
					},
					dot: function(t, e) {
						return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
					},
					sml: function(t, e) {
						return [
							t * e[0],
							t * e[1],
							t * e[2],
							t * e[3]
						];
					}
				};
				E.encode = function(t, e, r, n, a, i, s) {
					n ??= 0, s ??= !1;
					var l = f(t, e, r, n, [
						!1,
						!1,
						!1,
						0,
						s,
						!1
					]);
					return h(l, -1), o(l, e, r, a, i);
				}, E.encodeLL = function(t, e, r, n, a, i, s, l) {
					for (var f = {
						ctype: 0 + (1 == n ? 0 : 2) + (0 == a ? 0 : 4),
						depth: i,
						frames: []
					}, _ = (n + a) * i, d = _ * e, u = 0; u < t.length; u++) f.frames.push({
						rect: {
							x: 0,
							y: 0,
							width: e,
							height: r
						},
						img: new Uint8Array(t[u]),
						blend: 0,
						dispose: 1,
						bpp: Math.ceil(_ / 8),
						bpl: Math.ceil(d / 8)
					});
					return h(f, 0, !0), o(f, e, r, s, l);
				}, E.encode.compress = f, E.encode.dither = l, E.quantize = g, E.quantize.findNearest = v, E.quantize.getKDtree = b, E.quantize.getNearest = m;
			}(), E;
		}));
	})))(), 1);
	async function compressImage(file, options) {
		const { minBytes, maxBytes, format = "jpeg" } = options;
		if (!file.type.startsWith("image/")) throw new Error(`Cannot compress non-image file: ${file.type}`);
		if ((minBytes === void 0 || file.size >= minBytes) && (maxBytes === void 0 || file.size <= maxBytes)) return file;
		const image = await loadImage(file);
		const canvas = document.createElement("canvas");
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not create canvas context.");
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		if (minBytes !== void 0 && file.size < minBytes) {
			const blob = await canvasToBlob(canvas, 1, format);
			console.log("[FileThrough] Minimum-size attempt:", {
				quality: 1,
				sizeBytes: blob.size,
				minBytes,
				maxBytes
			});
			if (blob.size >= minBytes && (maxBytes === void 0 || blob.size <= maxBytes)) return createCompressedFile(file, blob, format);
			if (blob.size < minBytes && (maxBytes === void 0 || blob.size <= maxBytes)) {
				let paddedBlob = null;
				if (format === "jpeg") paddedBlob = await padJpegToMinimum(blob, minBytes);
				if (format === "png") paddedBlob = await padPngToMinimum(blob, minBytes);
				if (paddedBlob && paddedBlob.size >= minBytes && (maxBytes === void 0 || paddedBlob.size <= maxBytes)) return createCompressedFile(file, paddedBlob, format);
			}
			throw new Error(`Unable to produce an image between ${minBytes} and ${maxBytes ?? "unlimited"} bytes at the required dimensions.`);
		}
		if (maxBytes === void 0) throw new Error("Cannot compress image without a maximum byte limit.");
		let low = .05;
		let high = 1;
		let bestBlob = null;
		for (let attempt = 0; attempt < 10; attempt++) {
			const quality = (low + high) / 2;
			const blob = format === "png" ? await canvasToPngBlob(canvas, 256) : await canvasToBlob(canvas, quality, format);
			console.log(`[FileThrough] Compression attempt ${attempt + 1}:`, {
				quality,
				sizeBytes: blob.size,
				minBytes,
				maxBytes
			});
			if (blob.size > maxBytes) {
				high = quality;
				continue;
			}
			if (minBytes !== void 0 && blob.size < minBytes) {
				low = quality;
				continue;
			}
			bestBlob = blob;
			low = quality;
		}
		if (!bestBlob) throw new Error(`Unable to produce an image between ${minBytes ?? 0} and ${maxBytes} bytes.`);
		return createCompressedFile(file, bestBlob, format);
	}
	async function canvasToPngBlob(canvas, colorCount) {
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not create canvas context.");
		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const buffer = import_UPNG_umd.default.encode([imageData.data.buffer], canvas.width, canvas.height, colorCount);
		return new Blob([buffer], { type: "image/png" });
	}
	function createCompressedFile(originalFile, blob, format) {
		const extension = format === "jpeg" ? "jpg" : format;
		const mimeType = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
		return new File([blob], replaceExtension(originalFile.name, extension), {
			type: mimeType,
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
	function canvasToBlob(canvas, quality, format) {
		return new Promise((resolve, reject) => {
			const mimeType = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(/* @__PURE__ */ new Error(`Failed to create ${format} image.`));
					return;
				}
				resolve(blob);
			}, mimeType, format === "png" ? void 0 : quality);
		});
	}
	function padJpegToMinimum(blob, minBytes) {
		return blob.arrayBuffer().then((buffer) => {
			const bytes = new Uint8Array(buffer);
			if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) throw new Error("Cannot pad JPEG: invalid JPEG data.");
			const paddingBytes = minBytes - bytes.length;
			if (paddingBytes <= 0) return blob;
			const commentDataLength = paddingBytes;
			const commentLength = commentDataLength + 2;
			if (commentLength > 65535) throw new Error("Cannot pad JPEG: padding is too large.");
			const comment = new Uint8Array(commentDataLength + 4);
			comment[0] = 255;
			comment[1] = 254;
			comment[2] = commentLength >> 8 & 255;
			comment[3] = commentLength & 255;
			const eoiIndex = bytes.length - 2;
			const output = new Uint8Array(bytes.length + comment.length);
			output.set(bytes.slice(0, eoiIndex), 0);
			output.set(comment, eoiIndex);
			output.set(bytes.slice(eoiIndex), eoiIndex + comment.length);
			return new Blob([output], { type: "image/jpeg" });
		});
	}
	function padPngToMinimum(blob, minBytes) {
		return blob.arrayBuffer().then((buffer) => {
			const bytes = new Uint8Array(buffer);
			if (bytes.length < 12 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71 || bytes[4] !== 13 || bytes[5] !== 10 || bytes[6] !== 26 || bytes[7] !== 10) throw new Error("Cannot pad PNG: invalid PNG data.");
			const paddingBytes = minBytes - bytes.length;
			if (paddingBytes <= 0) return blob;
			const chunkDataLength = paddingBytes - 12;
			if (chunkDataLength < 0) throw new Error("Cannot pad PNG: padding is too small.");
			const chunk = createPngTextChunk(chunkDataLength);
			const iendIndex = bytes.length - 12;
			const output = new Uint8Array(bytes.length + chunk.length);
			output.set(bytes.slice(0, iendIndex), 0);
			output.set(chunk, iendIndex);
			output.set(bytes.slice(iendIndex), iendIndex + chunk.length);
			return new Blob([output], { type: "image/png" });
		});
	}
	function createPngTextChunk(dataLength) {
		const chunk = new Uint8Array(12 + dataLength);
		chunk[0] = dataLength >> 24 & 255;
		chunk[1] = dataLength >> 16 & 255;
		chunk[2] = dataLength >> 8 & 255;
		chunk[3] = dataLength & 255;
		chunk[4] = 116;
		chunk[5] = 69;
		chunk[6] = 88;
		chunk[7] = 116;
		const crc = crc32(chunk.slice(4, 8 + dataLength));
		chunk[8] = crc >>> 24 & 255;
		chunk[9] = crc >>> 16 & 255;
		chunk[10] = crc >>> 8 & 255;
		chunk[11] = crc & 255;
		return chunk;
	}
	function crc32(bytes) {
		let crc = 4294967295;
		for (const byte of bytes) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
		}
		return (crc ^ 4294967295) >>> 0;
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
				input.addEventListener("change", async (event) => {
					if (event.isTrusted === false) return;
					const file = input.files?.[0];
					if (!file) return;
					try {
						const fileInfo = await inspectFile(file);
						console.log("[FileThrough] Selected file", fileInfo);
						const validation = validateFile(fileInfo, constraints);
						console.log("[FileThrough] Validation result", validation);
						const plan = createTransformationPlan(fileInfo, constraints);
						console.log("[FileThrough] Transformation plan", plan);
						if (Object.keys(plan).length > 0) {
							let transformedFile = file;
							let finalFile = file;
							let finalInfo = fileInfo;
							try {
								transformedFile = await transformImage(file, plan);
								const transformedInfo = await inspectFile(transformedFile);
								console.log("[FileThrough] Transformed file", transformedInfo);
								finalFile = transformedFile;
								finalInfo = transformedInfo;
							} catch (error) {
								console.error("[FileThrough] Transformation failed", error);
								const message = {
									type: "file-processing-failed",
									original: fileInfo,
									error: error instanceof Error ? error.message : "Unknown transformation error."
								};
								browser.runtime.sendMessage(message);
								return;
							}
							if (plan.compress) try {
								finalFile = await compressImage(transformedFile, {
									minBytes: plan.compress.minBytes,
									maxBytes: plan.compress.maxBytes,
									format: plan.compress.format
								});
								finalInfo = await inspectFile(finalFile);
								console.log("[FileThrough] Compressed file", finalInfo);
							} catch (error) {
								console.error("[FileThrough] Compression failed", error);
								const message = {
									type: "file-processing-failed",
									original: fileInfo,
									error: error instanceof Error ? error.message : "Unknown compression error."
								};
								browser.runtime.sendMessage(message);
								return;
							}
							replaceInputFile(input, finalFile);
							input.dispatchEvent(new Event("change", { bubbles: true }));
							console.log("[FileThrough] Final file injected", {
								name: finalFile.name,
								type: finalFile.type,
								sizeBytes: finalFile.size
							});
							const message = {
								type: "file-processed",
								changed: fileInfo.name !== finalInfo.name || fileInfo.mimeType !== finalInfo.mimeType || fileInfo.sizeBytes !== finalInfo.sizeBytes || fileInfo.width !== finalInfo.width || fileInfo.height !== finalInfo.height,
								original: fileInfo,
								final: finalInfo
							};
							browser.runtime.sendMessage(message);
						}
					} catch (error) {
						console.error("[FileThrough] Could not inspect file", error);
					}
				});
			}
			function replaceInputFile(input, file) {
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				input.files = dataTransfer.files;
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/logger.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/custom-events.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/location-watcher.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/content-script-context.mjs
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
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?D:/filethrough/filethrough/entrypoints/content.ts
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjIuNS9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4udHMiLCIuLi8uLi8uLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B1cG5nK3VwbmctanNAMi4yLjIvbm9kZV9tb2R1bGVzL0B1cG5nL3VwbmctanMvZGlzdC9VUE5HLnVtZC5qcyIsIi4uLy4uLy4uL2NvcmUvdHJhbnNmb3JtZXIvY29tcHJlc3NJbWFnZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppXzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2dnZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppXzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0LnRzXG5mdW5jdGlvbiBkZWZpbmVDb250ZW50U2NyaXB0KGRlZmluaXRpb24pIHtcblx0cmV0dXJuIGRlZmluaXRpb247XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUNvbnRlbnRTY3JpcHQgfTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgYnJvd3NlciQxIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvYnJvd3Nlci50c1xuLyoqXG4qIENvbnRhaW5zIHRoZSBgYnJvd3NlcmAgZXhwb3J0IHdoaWNoIHlvdSBzaG91bGQgdXNlIHRvIGFjY2VzcyB0aGUgZXh0ZW5zaW9uXG4qIEFQSXMgaW4geW91ciBwcm9qZWN0OlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInO1xuKlxuKiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuKiAgIC8vIC4uLlxuKiB9KTtcbiogYGBgXG4qXG4qIEBtb2R1bGUgd3h0L2Jyb3dzZXJcbiovXG5jb25zdCBicm93c2VyID0gYnJvd3NlciQxO1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBicm93c2VyIH07XG4iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5mdW5jdGlvbiB0b0J5dGVzKHZhbHVlOiBudW1iZXIsIHVuaXQ6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICBjb25zdCBub3JtYWxpemVkVW5pdCA9IHVuaXQudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICBzd2l0Y2ggKG5vcm1hbGl6ZWRVbml0KSB7XHJcbiAgICAgICAgY2FzZSAna2InOlxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMjQpO1xyXG5cclxuICAgICAgICBjYXNlICdtYic6XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCAqIDEwMjQpO1xyXG5cclxuICAgICAgICBjYXNlICdnYic6XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCAqIDEwMjQgKiAxMDI0KTtcclxuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlU2l6ZSh0ZXh0OiBzdHJpbmcpOiBVcGxvYWRDb25zdHJhaW50cyB7XHJcbiAgICBjb25zdCByZXN1bHQ6IFVwbG9hZENvbnN0cmFpbnRzID0ge307XHJcblxyXG4gICAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSB0ZXh0XHJcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxyXG4gICAgICAgIC50cmltKCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIDEuIFJBTkdFIFBBVFRFUk5TXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIEV4YW1wbGVzOlxyXG4gICAgLy8gMjAgS0IgdG8gMTAwIEtCXHJcbiAgICAvLyAyMEtCIC0gMTAwS0JcclxuICAgIC8vIEJldHdlZW4gNTAgS0IgYW5kIDIwMCBLQlxyXG5cclxuICAgIGNvbnN0IHJhbmdlUGF0dGVybnMgPSBbXHJcbiAgICAgICAgL2JldHdlZW5cXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYilcXHMrYW5kXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXHJcblxyXG4gICAgICAgIC8oXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKVxccyooPzp0b3wtfOKAk3zigJQpXFxzKihcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiByYW5nZVBhdHRlcm5zKSB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBub3JtYWxpemVkVGV4dC5tYXRjaChwYXR0ZXJuKTtcclxuXHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1pblZhbHVlID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IG1pblVuaXQgPSBtYXRjaFsyXTtcclxuICAgICAgICAgICAgY29uc3QgbWF4VmFsdWUgPSBtYXRjaFszXTtcclxuICAgICAgICAgICAgY29uc3QgbWF4VW5pdCA9IG1hdGNoWzRdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFtaW5WYWx1ZSB8fCAhbWluVW5pdCB8fCAhbWF4VmFsdWUgfHwgIW1heFVuaXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXN1bHQubWluQnl0ZXMgPSB0b0J5dGVzKFxyXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQobWluVmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgbWluVW5pdFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0Lm1heEJ5dGVzID0gdG9CeXRlcyhcclxuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KG1heFZhbHVlKSxcclxuICAgICAgICAgICAgICAgIG1heFVuaXRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyAyLiBNQVhJTVVNIFBBVFRFUk5TXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIEV4YW1wbGVzOlxyXG4gICAgLy8gTWF4aW11bSBmaWxlIHNpemU6IDIwMCBLQlxyXG4gICAgLy8gTWF4IHNpemUgMiBNQlxyXG4gICAgLy8gRmlsZSBzaXplIHNob3VsZCBub3QgZXhjZWVkIDUwMCBLQlxyXG4gICAgLy8gRmlsZSBtdXN0IGJlIHVuZGVyIDMwMCBLQlxyXG4gICAgLy8gTGVzcyB0aGFuIDEgTUJcclxuXHJcbiAgICBjb25zdCBtYXhQYXR0ZXJucyA9IFtcclxuICAgICAgICAvKD86bWF4aW11bXxtYXgpXFxzKyg/OmZpbGVcXHMrKT9zaXplXFxzKjo/XFxzKihcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXHJcblxyXG4gICAgICAgIC8oPzpmaWxlXFxzKyk/c2l6ZVxccysoPzpzaG91bGRcXHMrKT9ub3RcXHMrZXhjZWVkXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXHJcblxyXG4gICAgICAgIC8oPzpmaWxlXFxzKyk/KD86bXVzdFxccytiZVxccyspP3VuZGVyXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXHJcblxyXG4gICAgICAgIC9sZXNzXFxzK3RoYW5cXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuICAgIF07XHJcblxyXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIG1heFBhdHRlcm5zKSB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBub3JtYWxpemVkVGV4dC5tYXRjaChwYXR0ZXJuKTtcclxuXHJcblxyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBjb25zdCB1bml0ID0gbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoIXZhbHVlIHx8ICF1bml0KSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzdWx0Lm1heEJ5dGVzID0gdG9CeXRlcyhcclxuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KHZhbHVlKSxcclxuICAgICAgICAgICAgICAgIHVuaXRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGb3JtYXRzKFxyXG4gICAgY29udGV4dDogVXBsb2FkQ29udGV4dFxyXG4pOiBzdHJpbmdbXSB7XHJcbiAgICBjb25zdCBmb3JtYXRzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcblxyXG4gICAgLy8gSGlnaGVzdC1jb25maWRlbmNlIHNvdXJjZTogSFRNTCBhY2NlcHQgYXR0cmlidXRlXHJcbiAgICBpZiAoY29udGV4dC5hY2NlcHQpIHtcclxuICAgICAgICBjb25zdCBhY2NlcHRQYXJ0cyA9IGNvbnRleHQuYWNjZXB0LnNwbGl0KCcsJyk7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBhY2NlcHRQYXJ0cykge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUuc3RhcnRzV2l0aCgnLicpKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCh2YWx1ZS5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL2pwZWcnKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgnanBnJyk7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgnanBlZycpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdpbWFnZS9wbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgncG5nJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL3dlYnAnKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgnd2VicCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdhcHBsaWNhdGlvbi9wZGYnKSB7XHJcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgncGRmJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2Vjb25kIHNvdXJjZTogbmVhcmJ5IGluc3RydWN0aW9uc1xyXG4gICAgY29uc3QgdGV4dCA9IGNvbnRleHQubmVhcmJ5VGV4dC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGNvbnN0IGtub3duRm9ybWF0cyA9IFtcclxuICAgICAgICAnanBnJyxcclxuICAgICAgICAnanBlZycsXHJcbiAgICAgICAgJ3BuZycsXHJcbiAgICAgICAgJ3dlYnAnLFxyXG4gICAgICAgICdwZGYnLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZvcm1hdCBvZiBrbm93bkZvcm1hdHMpIHtcclxuICAgICAgICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcclxuICAgICAgICAgICAgYFxcXFxiJHtmb3JtYXR9XFxcXGJgLFxyXG4gICAgICAgICAgICAnaSdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAocGF0dGVybi50ZXN0KHRleHQpKSB7XHJcbiAgICAgICAgICAgIGZvcm1hdHMuYWRkKGZvcm1hdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBBcnJheS5mcm9tKGZvcm1hdHMpO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGltZW5zaW9ucyhcclxuICAgIHRleHQ6IHN0cmluZ1xyXG4pOiBVcGxvYWRDb25zdHJhaW50c1snZGltZW5zaW9ucyddIHwgdW5kZWZpbmVkIHtcclxuXHJcbiAgICBjb25zdCBub3JtYWxpemVkVGV4dCA9IHRleHRcclxuICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXHJcbiAgICAgICAgLnRyaW0oKTtcclxuXHJcbiAgICAvLyBFeGFtcGxlczpcclxuICAgIC8vIERpbWVuc2lvbnM6IDIwMCB4IDIzMCBwaXhlbHNcclxuICAgIC8vIDIwMHgyMzAgcHhcclxuICAgIC8vIDIwMCDDlyAyMzAgcGl4ZWxzXHJcbiAgICAvLyBJbWFnZSBzaXplOiAyMDAgWCAyMzBcclxuXHJcbiAgICBjb25zdCBwYXR0ZXJucyA9IFtcclxuICAgICAgICAvKD86ZGltZW5zaW9ucz98aW1hZ2VcXHMrZGltZW5zaW9ucz98aW1hZ2VcXHMrc2l6ZSlcXHMqOj9cXHMqKFxcZCspXFxzKlt4w5ddXFxzKihcXGQrKVxccyooPzpweHxwaXhlbHM/KT8vaSxcclxuXHJcbiAgICAgICAgLyhcXGQrKVxccypbeMOXXVxccyooXFxkKylcXHMqKD86cHh8cGl4ZWxzPykvaSxcclxuICAgIF07XHJcblxyXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBub3JtYWxpemVkVGV4dC5tYXRjaChwYXR0ZXJuKTtcclxuXHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IG1hdGNoWzJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF3aWR0aCB8fCAhaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIucGFyc2VJbnQod2lkdGgsIDEwKSxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogTnVtYmVyLnBhcnNlSW50KGhlaWdodCwgMTApLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQnO1xyXG5pbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBwYXJzZUZpbGVTaXplIH0gZnJvbSAnLi9wYXJzZUZpbGVTaXplJztcclxuaW1wb3J0IHsgcGFyc2VGb3JtYXRzIH0gZnJvbSAnLi9wYXJzZUZvcm1hdHMnO1xyXG5pbXBvcnQgeyBwYXJzZURpbWVuc2lvbnMgfSBmcm9tICcuL3BhcnNlRGltZW5zaW9ucyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb25zdHJhaW50cyhcclxuICAgIGNvbnRleHQ6IFVwbG9hZENvbnRleHRcclxuKTogVXBsb2FkQ29uc3RyYWludHMge1xyXG4gICAgY29uc3Qgc2l6ZUNvbnN0cmFpbnRzID0gcGFyc2VGaWxlU2l6ZShjb250ZXh0Lm5lYXJieVRleHQpO1xyXG4gICAgY29uc3QgYWxsb3dlZEZvcm1hdHMgPSBwYXJzZUZvcm1hdHMoY29udGV4dCk7XHJcbiAgICBjb25zdCBkaW1lbnNpb25zID0gcGFyc2VEaW1lbnNpb25zKGNvbnRleHQubmVhcmJ5VGV4dCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5zaXplQ29uc3RyYWludHMsXHJcblxyXG4gICAgICAgIC4uLihhbGxvd2VkRm9ybWF0cy5sZW5ndGggPiAwICYmIHtcclxuICAgICAgICAgICAgYWxsb3dlZEZvcm1hdHMsXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIC4uLihkaW1lbnNpb25zICYmIHtcclxuICAgICAgICAgICAgZGltZW5zaW9ucyxcclxuICAgICAgICB9KSxcclxuICAgIH07XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIFVwbG9hZENvbnRleHQge1xyXG4gICAgbGFiZWw6IHN0cmluZyB8IG51bGw7XHJcbiAgICBuZWFyYnlUZXh0OiBzdHJpbmc7XHJcbiAgICBhY2NlcHQ6IHN0cmluZyB8IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VXBsb2FkQ29udGV4dChcclxuICAgIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50XHJcbik6IFVwbG9hZENvbnRleHQge1xyXG4gICAgbGV0IGxhYmVsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICAvLyBGaW5kIDxsYWJlbCBmb3I9XCJpbnB1dC1pZFwiPlxyXG4gICAgaWYgKGlucHV0LmlkKSB7XHJcbiAgICAgICAgY29uc3QgbGFiZWxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTGFiZWxFbGVtZW50PihcclxuICAgICAgICAgICAgYGxhYmVsW2Zvcj1cIiR7Q1NTLmVzY2FwZShpbnB1dC5pZCl9XCJdYFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxhYmVsID0gbGFiZWxFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlIGlucHV0cyB3cmFwcGVkIGluc2lkZSA8bGFiZWw+XHJcbiAgICBpZiAoIWxhYmVsKSB7XHJcbiAgICAgICAgY29uc3QgcGFyZW50TGFiZWwgPSBpbnB1dC5jbG9zZXN0KCdsYWJlbCcpO1xyXG5cclxuICAgICAgICBsYWJlbCA9IHBhcmVudExhYmVsPy50ZXh0Q29udGVudD8udHJpbSgpIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRm9yIG5vdywgaW5zcGVjdCB0aGUgaW5wdXQncyBwYXJlbnQgY29udGFpbmVyLlxyXG4gICAgY29uc3QgcGFyZW50ID0gaW5wdXQucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICBjb25zdCBuZWFyYnlUZXh0ID1cclxuICAgICAgICBwYXJlbnQ/LmlubmVyVGV4dFxyXG4gICAgICAgICAgICA/LnJlcGxhY2UoL1xccysvZywgJyAnKVxyXG4gICAgICAgICAgICAudHJpbSgpIHx8ICcnO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbGFiZWwsXHJcbiAgICAgICAgbmVhcmJ5VGV4dCxcclxuICAgICAgICBhY2NlcHQ6IGlucHV0LmdldEF0dHJpYnV0ZSgnYWNjZXB0JyksXHJcbiAgICB9O1xyXG59IiwiZXhwb3J0IGludGVyZmFjZSBGaWxlSW5mbyB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBtaW1lVHlwZTogc3RyaW5nO1xyXG4gICAgc2l6ZUJ5dGVzOiBudW1iZXI7XHJcbiAgICBleHRlbnNpb246IHN0cmluZztcclxuICAgIHdpZHRoPzogbnVtYmVyO1xyXG4gICAgaGVpZ2h0PzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zcGVjdEZpbGUoZmlsZTogRmlsZSk6IFByb21pc2U8RmlsZUluZm8+IHtcclxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihmaWxlLm5hbWUpO1xyXG5cclxuICAgIGNvbnN0IGluZm86IEZpbGVJbmZvID0ge1xyXG4gICAgICAgIG5hbWU6IGZpbGUubmFtZSxcclxuICAgICAgICBtaW1lVHlwZTogZmlsZS50eXBlLFxyXG4gICAgICAgIHNpemVCeXRlczogZmlsZS5zaXplLFxyXG4gICAgICAgIGV4dGVuc2lvbixcclxuICAgIH07XHJcblxyXG4gICAgaWYgKGZpbGUudHlwZS5zdGFydHNXaXRoKCdpbWFnZS8nKSkge1xyXG4gICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBhd2FpdCBnZXRJbWFnZURpbWVuc2lvbnMoZmlsZSk7XHJcblxyXG4gICAgICAgIGluZm8ud2lkdGggPSBkaW1lbnNpb25zLndpZHRoO1xyXG4gICAgICAgIGluZm8uaGVpZ2h0ID0gZGltZW5zaW9ucy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGluZm87XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEV4dGVuc2lvbihmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGxhc3REb3QgPSBmaWxlTmFtZS5sYXN0SW5kZXhPZignLicpO1xyXG5cclxuICAgIGlmIChsYXN0RG90ID09PSAtMSkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmlsZU5hbWVcclxuICAgICAgICAuc2xpY2UobGFzdERvdCArIDEpXHJcbiAgICAgICAgLnRvTG93ZXJDYXNlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEltYWdlRGltZW5zaW9ucyhcclxuICAgIGZpbGU6IEZpbGVcclxuKTogUHJvbWlzZTx7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcclxuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGltYWdlLm5hdHVyYWxXaWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodCxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdVbmFibGUgdG8gcmVhZCBpbWFnZSBkaW1lbnNpb25zLicpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpbWFnZS5zcmMgPSB1cmw7XHJcbiAgICB9KTtcclxufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuLi9wYXJzZXIvdHlwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IEZpbGVJbmZvIH0gZnJvbSAnLi4vaW5zcGVjdG9yL2luc3BlY3RGaWxlJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdGlvbklzc3VlIHtcclxuICAgIHR5cGU6ICdmb3JtYXQnIHwgJ3NpemUtdG9vLWxhcmdlJyB8ICdzaXplLXRvby1zbWFsbCcgfCAnZGltZW5zaW9ucyc7XHJcbiAgICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdGlvblJlc3VsdCB7XHJcbiAgICBpc1ZhbGlkOiBib29sZWFuO1xyXG4gICAgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRmlsZShcclxuICAgIGZpbGU6IEZpbGVJbmZvLFxyXG4gICAgY29uc3RyYWludHM6IFVwbG9hZENvbnN0cmFpbnRzXHJcbik6IFZhbGlkYXRpb25SZXN1bHQge1xyXG4gICAgY29uc3QgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXSA9IFtdO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIEZvcm1hdFxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChcclxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cyAmJlxyXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDBcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IGZpbGVGb3JtYXQgPSBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBhbGxvd2VkID0gY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMuc29tZShcclxuICAgICAgICAgICAgKGZvcm1hdCkgPT4gZm9ybWF0LnRvTG93ZXJDYXNlKCkgPT09IGZpbGVGb3JtYXRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWFsbG93ZWQpIHtcclxuICAgICAgICAgICAgaXNzdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Zvcm1hdCcsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBmb3JtYXQgXCIke2ZpbGVGb3JtYXR9XCIgaXMgbm90IGFsbG93ZWQuYCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIE1heGltdW0gZmlsZSBzaXplXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAgIGNvbnN0cmFpbnRzLm1heEJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgICBmaWxlLnNpemVCeXRlcyA+IGNvbnN0cmFpbnRzLm1heEJ5dGVzXHJcbiAgICApIHtcclxuICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaXplLXRvby1sYXJnZScsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBhbGxvd2VkIHNpemUgaXMgJHtmb3JtYXRCeXRlcyhcclxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLm1heEJ5dGVzXHJcbiAgICAgICAgICAgICl9LmAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gTWluaW11bSBmaWxlIHNpemVcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgY29uc3RyYWludHMubWluQnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzIDwgY29uc3RyYWludHMubWluQnl0ZXNcclxuICAgICkge1xyXG4gICAgICAgIGlzc3Vlcy5wdXNoKHtcclxuICAgICAgICAgICAgdHlwZTogJ3NpemUtdG9vLXNtYWxsJyxcclxuICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgaXMgdG9vIHNtYWxsLiBNaW5pbXVtIHJlcXVpcmVkIHNpemUgaXMgJHtmb3JtYXRCeXRlcyhcclxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLm1pbkJ5dGVzXHJcbiAgICAgICAgICAgICl9LmAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRGltZW5zaW9uc1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChjb25zdHJhaW50cy5kaW1lbnNpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBjb25zdHJhaW50cy5kaW1lbnNpb25zO1xyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIGZpbGUud2lkdGggIT09IHdpZHRoIHx8XHJcbiAgICAgICAgICAgIGZpbGUuaGVpZ2h0ICE9PSBoZWlnaHRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgaXNzdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpbWVuc2lvbnMnLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEltYWdlIGRpbWVuc2lvbnMgbXVzdCBiZSAke3dpZHRofSDDlyAke2hlaWdodH1weC5gLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpc1ZhbGlkOiBpc3N1ZXMubGVuZ3RoID09PSAwLFxyXG4gICAgICAgIGlzc3VlcyxcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZvcm1hdEJ5dGVzKGJ5dGVzOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgaWYgKGJ5dGVzIDwgMTAyNCkge1xyXG4gICAgICAgIHJldHVybiBgJHtieXRlc30gQmA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGJ5dGVzIDwgMTAyNCAqIDEwMjQpIHtcclxuICAgICAgICByZXR1cm4gYCR7TWF0aC5yb3VuZChieXRlcyAvIDEwMjQpfSBLQmA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGAkeyhieXRlcyAvICgxMDI0ICogMTAyNCkpLnRvRml4ZWQoMil9IE1CYDtcclxufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuLi9wYXJzZXIvdHlwZXMnO1xyXG5pbXBvcnQgdHlwZSB7IEZpbGVJbmZvIH0gZnJvbSAnLi4vaW5zcGVjdG9yL2luc3BlY3RGaWxlJztcclxuaW1wb3J0IHR5cGUgeyBUcmFuc2Zvcm1hdGlvblBsYW4gfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4oXHJcbiAgICBmaWxlOiBGaWxlSW5mbyxcclxuICAgIGNvbnN0cmFpbnRzOiBVcGxvYWRDb25zdHJhaW50c1xyXG4pOiBUcmFuc2Zvcm1hdGlvblBsYW4ge1xyXG4gICAgY29uc3QgcGxhbjogVHJhbnNmb3JtYXRpb25QbGFuID0ge307XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRm9ybWF0IGNvbnZlcnNpb25cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMgJiZcclxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5sZW5ndGggPiAwXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50Rm9ybWF0ID0gZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZm9ybWF0QWxsb3dlZCA9XHJcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLmluY2x1ZGVzKGN1cnJlbnRGb3JtYXQpO1xyXG5cclxuICAgICAgICBpZiAoIWZvcm1hdEFsbG93ZWQpIHtcclxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Rm9ybWF0ID0gY2hvb3NlVGFyZ2V0Rm9ybWF0KFxyXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YXJnZXRGb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIHBsYW4uY29udmVydFRvID0gdGFyZ2V0Rm9ybWF0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIERpbWVuc2lvbnNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoY29uc3RyYWludHMuZGltZW5zaW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gY29uc3RyYWludHMuZGltZW5zaW9ucztcclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICBmaWxlLndpZHRoICE9PSB3aWR0aCB8fFxyXG4gICAgICAgICAgICBmaWxlLmhlaWdodCAhPT0gaGVpZ2h0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHBsYW4ucmVzaXplID0ge1xyXG4gICAgICAgICAgICAgICAgd2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIEZpbGUgc2l6ZVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuaWYgKFxyXG4gICAgKGNvbnN0cmFpbnRzLm1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgICBmaWxlLnNpemVCeXRlcyA8IGNvbnN0cmFpbnRzLm1pbkJ5dGVzKSB8fFxyXG4gICAgKGNvbnN0cmFpbnRzLm1heEJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgICBmaWxlLnNpemVCeXRlcyA+IGNvbnN0cmFpbnRzLm1heEJ5dGVzKVxyXG4pIHtcclxuICAgIHBsYW4uY29tcHJlc3MgPSB7XHJcbiAgICAgICAgLi4uKGNvbnN0cmFpbnRzLm1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiYge1xyXG4gICAgICAgICAgICBtaW5CeXRlczogY29uc3RyYWludHMubWluQnl0ZXMsXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIC4uLihjb25zdHJhaW50cy5tYXhCeXRlcyAhPT0gdW5kZWZpbmVkICYmIHtcclxuICAgICAgICAgICAgbWF4Qnl0ZXM6IGNvbnN0cmFpbnRzLm1heEJ5dGVzLFxyXG4gICAgICAgIH0pLFxyXG5cclxuICAgICAgICBmb3JtYXQ6IGNob29zZUNvbXByZXNzaW9uRm9ybWF0KFxyXG4gICAgICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0c1xyXG4gICAgICAgICksXHJcbiAgICB9O1xyXG59XHJcblxyXG4gICAgcmV0dXJuIHBsYW47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNob29zZVRhcmdldEZvcm1hdChcclxuICAgIGFsbG93ZWRGb3JtYXRzOiBzdHJpbmdbXVxyXG4pOiBUcmFuc2Zvcm1hdGlvblBsYW5bJ2NvbnZlcnRUbyddIHtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBhbGxvd2VkRm9ybWF0cy5tYXAoKGZvcm1hdCkgPT5cclxuICAgICAgICBmb3JtYXQudG9Mb3dlckNhc2UoKVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnanBlZycpKSB7XHJcbiAgICAgICAgcmV0dXJuICdqcGVnJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnanBnJykpIHtcclxuICAgICAgICByZXR1cm4gJ2pwZWcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdwbmcnKSkge1xyXG4gICAgICAgIHJldHVybiAncG5nJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnd2VicCcpKSB7XHJcbiAgICAgICAgcmV0dXJuICd3ZWJwJztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaG9vc2VDb21wcmVzc2lvbkZvcm1hdChcclxuICAgIGFsbG93ZWRGb3JtYXRzPzogc3RyaW5nW11cclxuKTogJ2pwZWcnIHwgJ3BuZycgfCAnd2VicCcge1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9XHJcbiAgICAgICAgYWxsb3dlZEZvcm1hdHM/Lm1hcCgoZm9ybWF0KSA9PlxyXG4gICAgICAgICAgICBmb3JtYXQudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICkgPz8gW107XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ2pwZWcnKSB8fFxyXG4gICAgICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ2pwZycpXHJcbiAgICApIHtcclxuICAgICAgICByZXR1cm4gJ2pwZWcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdwbmcnKSkge1xyXG4gICAgICAgIHJldHVybiAncG5nJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnd2VicCcpKSB7XHJcbiAgICAgICAgcmV0dXJuICd3ZWJwJztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJ2pwZWcnO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBUcmFuc2Zvcm1hdGlvblBsYW4gfSBmcm9tICcuLi9wbGFubmVyL3R5cGVzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1JbWFnZShcclxuICAgIGZpbGU6IEZpbGUsXHJcbiAgICBwbGFuOiBUcmFuc2Zvcm1hdGlvblBsYW5cclxuKTogUHJvbWlzZTxGaWxlPiB7XHJcbiAgICBpZiAoIWZpbGUudHlwZS5zdGFydHNXaXRoKCdpbWFnZS8nKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgYENhbm5vdCB0cmFuc2Zvcm0gbm9uLWltYWdlIGZpbGU6ICR7ZmlsZS50eXBlfWBcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGltYWdlID0gYXdhaXQgbG9hZEltYWdlKGZpbGUpO1xyXG5cclxuICAgIGNvbnN0IHdpZHRoID1cclxuICAgICAgICBwbGFuLnJlc2l6ZT8ud2lkdGggPz8gaW1hZ2UubmF0dXJhbFdpZHRoO1xyXG5cclxuICAgIGNvbnN0IGhlaWdodCA9XHJcbiAgICAgICAgcGxhbi5yZXNpemU/LmhlaWdodCA/PyBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xyXG5cclxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG5cclxuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgaWYgKCFjb250ZXh0KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY3JlYXRlIGNhbnZhcyBjb250ZXh0LicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZXZlbnQgdHJhbnNwYXJlbnQgUE5HIGJhY2tncm91bmRzIGZyb20gYmVjb21pbmcgYmxhY2tcclxuICAgIC8vIHdoZW4gY29udmVydGluZyB0byBKUEVHLlxyXG4gICAgaWYgKHBsYW4uY29udmVydFRvID09PSAnanBlZycpIHtcclxuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmZmZmJztcclxuICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRleHQuZHJhd0ltYWdlKFxyXG4gICAgICAgIGltYWdlLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgMCxcclxuICAgICAgICB3aWR0aCxcclxuICAgICAgICBoZWlnaHRcclxuICAgICk7XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0VHlwZSA9IGdldE91dHB1dE1pbWVUeXBlKFxyXG4gICAgICAgIHBsYW4uY29udmVydFRvLFxyXG4gICAgICAgIGZpbGUudHlwZVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBibG9iID0gYXdhaXQgY2FudmFzVG9CbG9iKFxyXG4gICAgICAgIGNhbnZhcyxcclxuICAgICAgICBvdXRwdXRUeXBlXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbkZvck1pbWVUeXBlKFxyXG4gICAgICAgIG91dHB1dFR5cGVcclxuICAgICk7XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0TmFtZSA9IHJlcGxhY2VFeHRlbnNpb24oXHJcbiAgICAgICAgZmlsZS5uYW1lLFxyXG4gICAgICAgIGV4dGVuc2lvblxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEZpbGUoXHJcbiAgICAgICAgW2Jsb2JdLFxyXG4gICAgICAgIG91dHB1dE5hbWUsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiBvdXRwdXRUeXBlLFxyXG4gICAgICAgICAgICBsYXN0TW9kaWZpZWQ6IERhdGUubm93KCksXHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZEltYWdlKFxyXG4gICAgZmlsZTogRmlsZVxyXG4pOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcclxuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgICAgICAgcmVzb2x2ZShpbWFnZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICAgICAgICByZWplY3QoXHJcbiAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1VuYWJsZSB0byBkZWNvZGUgaW1hZ2UuJylcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpbWFnZS5zcmMgPSB1cmw7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2FudmFzVG9CbG9iKFxyXG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCxcclxuICAgIHR5cGU6IHN0cmluZ1xyXG4pOiBQcm9taXNlPEJsb2I+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY2FudmFzLnRvQmxvYihcclxuICAgICAgICAgICAgKGJsb2IpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghYmxvYikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIGltYWdlLicpXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShibG9iKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdHlwZVxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0T3V0cHV0TWltZVR5cGUoXHJcbiAgICBmb3JtYXQ6IFRyYW5zZm9ybWF0aW9uUGxhblsnY29udmVydFRvJ10sXHJcbiAgICBvcmlnaW5hbFR5cGU6IHN0cmluZ1xyXG4pOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoIChmb3JtYXQpIHtcclxuICAgICAgICBjYXNlICdqcGVnJzpcclxuICAgICAgICAgICAgcmV0dXJuICdpbWFnZS9qcGVnJztcclxuXHJcbiAgICAgICAgY2FzZSAncG5nJzpcclxuICAgICAgICAgICAgcmV0dXJuICdpbWFnZS9wbmcnO1xyXG5cclxuICAgICAgICBjYXNlICd3ZWJwJzpcclxuICAgICAgICAgICAgcmV0dXJuICdpbWFnZS93ZWJwJztcclxuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsVHlwZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uRm9yTWltZVR5cGUoXHJcbiAgICBtaW1lVHlwZTogc3RyaW5nXHJcbik6IHN0cmluZyB7XHJcbiAgICBzd2l0Y2ggKG1pbWVUeXBlKSB7XHJcbiAgICAgICAgY2FzZSAnaW1hZ2UvanBlZyc6XHJcbiAgICAgICAgICAgIHJldHVybiAnanBnJztcclxuXHJcbiAgICAgICAgY2FzZSAnaW1hZ2UvcG5nJzpcclxuICAgICAgICAgICAgcmV0dXJuICdwbmcnO1xyXG5cclxuICAgICAgICBjYXNlICdpbWFnZS93ZWJwJzpcclxuICAgICAgICAgICAgcmV0dXJuICd3ZWJwJztcclxuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuICdpbWcnO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXBsYWNlRXh0ZW5zaW9uKFxyXG4gICAgZmlsZU5hbWU6IHN0cmluZyxcclxuICAgIGV4dGVuc2lvbjogc3RyaW5nXHJcbik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBsYXN0RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcclxuXHJcbiAgICBpZiAobGFzdERvdCA9PT0gLTEpIHtcclxuICAgICAgICByZXR1cm4gYCR7ZmlsZU5hbWV9LiR7ZXh0ZW5zaW9ufWA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGAke2ZpbGVOYW1lLnNsaWNlKDAsIGxhc3REb3QpfS4ke2V4dGVuc2lvbn1gO1xyXG59IiwiIWZ1bmN0aW9uKHQsZSl7XCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGU/bW9kdWxlLmV4cG9ydHM9ZSgpOlwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoZSk6KHQ9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbFRoaXM/Z2xvYmFsVGhpczp0fHxzZWxmKS5VUE5HPWUoKX0odGhpcywoZnVuY3Rpb24oKXtcInVzZSBzdHJpY3RcIjt2YXIgdCxlLHIsbixhLGkscyxsLG8saCxmPXt9LF89e30sZD17fTtmdW5jdGlvbiB1KCl7aWYodClyZXR1cm4gZDt0PTE7ZnVuY3Rpb24gZSh0KXtsZXQgZT10Lmxlbmd0aDtmb3IoOy0tZT49MDspdFtlXT0wfWNvbnN0IHI9MjU2LG49Mjg2LGE9MzAsaT0xNSxzPW5ldyBVaW50OEFycmF5KFswLDAsMCwwLDAsMCwwLDAsMSwxLDEsMSwyLDIsMiwyLDMsMywzLDMsNCw0LDQsNCw1LDUsNSw1LDBdKSxsPW5ldyBVaW50OEFycmF5KFswLDAsMCwwLDEsMSwyLDIsMywzLDQsNCw1LDUsNiw2LDcsNyw4LDgsOSw5LDEwLDEwLDExLDExLDEyLDEyLDEzLDEzXSksbz1uZXcgVWludDhBcnJheShbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDMsN10pLGg9bmV3IFVpbnQ4QXJyYXkoWzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdKSxmPW5ldyBBcnJheSg1NzYpO2UoZik7Y29uc3QgXz1uZXcgQXJyYXkoNjApO2UoXyk7Y29uc3QgdT1uZXcgQXJyYXkoNTEyKTtlKHUpO2NvbnN0IGM9bmV3IEFycmF5KDI1Nik7ZShjKTtjb25zdCBnPW5ldyBBcnJheSgyOSk7ZShnKTtjb25zdCBwPW5ldyBBcnJheShhKTtmdW5jdGlvbiB3KHQsZSxyLG4sYSl7dGhpcy5zdGF0aWNfdHJlZT10LHRoaXMuZXh0cmFfYml0cz1lLHRoaXMuZXh0cmFfYmFzZT1yLHRoaXMuZWxlbXM9bix0aGlzLm1heF9sZW5ndGg9YSx0aGlzLmhhc19zdHJlZT10JiZ0Lmxlbmd0aH1sZXQgdixiLG07ZnVuY3Rpb24geSh0LGUpe3RoaXMuZHluX3RyZWU9dCx0aGlzLm1heF9jb2RlPTAsdGhpcy5zdGF0X2Rlc2M9ZX1lKHApO2NvbnN0IEE9dD0+dDwyNTY/dVt0XTp1WzI1NisodD4+PjcpXSx6PSh0LGUpPT57dC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109MjU1JmUsdC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109ZT4+PjgmMjU1fSx4PSh0LGUscik9Pnt0LmJpX3ZhbGlkPjE2LXI/KHQuYmlfYnVmfD1lPDx0LmJpX3ZhbGlkJjY1NTM1LHoodCx0LmJpX2J1ZiksdC5iaV9idWY9ZT4+MTYtdC5iaV92YWxpZCx0LmJpX3ZhbGlkKz1yLTE2KToodC5iaV9idWZ8PWU8PHQuYmlfdmFsaWQmNjU1MzUsdC5iaV92YWxpZCs9cil9LFU9KHQsZSxyKT0+e3godCxyWzIqZV0sclsyKmUrMV0pfSxrPSh0LGUpPT57bGV0IHI9MDtkb3tyfD0xJnQsdD4+Pj0xLHI8PD0xfXdoaWxlKC0tZT4wKTtyZXR1cm4gcj4+PjF9LEU9KHQsZSxyKT0+e2NvbnN0IG49bmV3IEFycmF5KDE2KTtsZXQgYSxzLGw9MDtmb3IoYT0xO2E8PWk7YSsrKWw9bCtyW2EtMV08PDEsblthXT1sO2ZvcihzPTA7czw9ZTtzKyspe2xldCBlPXRbMipzKzFdOzAhPT1lJiYodFsyKnNdPWsobltlXSsrLGUpKX19LFI9dD0+e2xldCBlO2ZvcihlPTA7ZTxuO2UrKyl0LmR5bl9sdHJlZVsyKmVdPTA7Zm9yKGU9MDtlPGE7ZSsrKXQuZHluX2R0cmVlWzIqZV09MDtmb3IoZT0wO2U8MTk7ZSsrKXQuYmxfdHJlZVsyKmVdPTA7dC5keW5fbHRyZWVbNTEyXT0xLHQub3B0X2xlbj10LnN0YXRpY19sZW49MCx0LnN5bV9uZXh0PXQubWF0Y2hlcz0wfSxTPXQ9Pnt0LmJpX3ZhbGlkPjg/eih0LHQuYmlfYnVmKTp0LmJpX3ZhbGlkPjAmJih0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT10LmJpX2J1ZiksdC5iaV9idWY9MCx0LmJpX3ZhbGlkPTB9LFQ9KHQsZSxyLG4pPT57Y29uc3QgYT0yKmUsaT0yKnI7cmV0dXJuIHRbYV08dFtpXXx8dFthXT09PXRbaV0mJm5bZV08PW5bcl19LFo9KHQsZSxyKT0+e2NvbnN0IG49dC5oZWFwW3JdO2xldCBhPXI8PDE7Zm9yKDthPD10LmhlYXBfbGVuJiYoYTx0LmhlYXBfbGVuJiZUKGUsdC5oZWFwW2ErMV0sdC5oZWFwW2FdLHQuZGVwdGgpJiZhKyssIVQoZSxuLHQuaGVhcFthXSx0LmRlcHRoKSk7KXQuaGVhcFtyXT10LmhlYXBbYV0scj1hLGE8PD0xO3QuaGVhcFtyXT1ufSxJPSh0LGUsbik9PntsZXQgYSxpLG8saCxmPTA7aWYoMCE9PXQuc3ltX25leHQpZG97YT0yNTUmdC5wZW5kaW5nX2J1Zlt0LnN5bV9idWYrZisrXSxhKz0oMjU1JnQucGVuZGluZ19idWZbdC5zeW1fYnVmK2YrK10pPDw4LGk9dC5wZW5kaW5nX2J1Zlt0LnN5bV9idWYrZisrXSwwPT09YT9VKHQsaSxlKToobz1jW2ldLFUodCxvK3IrMSxlKSxoPXNbb10sMCE9PWgmJihpLT1nW29dLHgodCxpLGgpKSxhLS0sbz1BKGEpLFUodCxvLG4pLGg9bFtvXSwwIT09aCYmKGEtPXBbb10seCh0LGEsaCkpKX13aGlsZShmPHQuc3ltX25leHQpO1UodCwyNTYsZSl9LEM9KHQsZSk9Pntjb25zdCByPWUuZHluX3RyZWUsbj1lLnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxhPWUuc3RhdF9kZXNjLmhhc19zdHJlZSxzPWUuc3RhdF9kZXNjLmVsZW1zO2xldCBsLG8saCxmPS0xO2Zvcih0LmhlYXBfbGVuPTAsdC5oZWFwX21heD01NzMsbD0wO2w8cztsKyspMCE9PXJbMipsXT8odC5oZWFwWysrdC5oZWFwX2xlbl09Zj1sLHQuZGVwdGhbbF09MCk6clsyKmwrMV09MDtmb3IoO3QuaGVhcF9sZW48MjspaD10LmhlYXBbKyt0LmhlYXBfbGVuXT1mPDI/KytmOjAsclsyKmhdPTEsdC5kZXB0aFtoXT0wLHQub3B0X2xlbi0tLGEmJih0LnN0YXRpY19sZW4tPW5bMipoKzFdKTtmb3IoZS5tYXhfY29kZT1mLGw9dC5oZWFwX2xlbj4+MTtsPj0xO2wtLSlaKHQscixsKTtoPXM7ZG97bD10LmhlYXBbMV0sdC5oZWFwWzFdPXQuaGVhcFt0LmhlYXBfbGVuLS1dLFoodCxyLDEpLG89dC5oZWFwWzFdLHQuaGVhcFstLXQuaGVhcF9tYXhdPWwsdC5oZWFwWy0tdC5oZWFwX21heF09byxyWzIqaF09clsyKmxdK3JbMipvXSx0LmRlcHRoW2hdPSh0LmRlcHRoW2xdPj10LmRlcHRoW29dP3QuZGVwdGhbbF06dC5kZXB0aFtvXSkrMSxyWzIqbCsxXT1yWzIqbysxXT1oLHQuaGVhcFsxXT1oKyssWih0LHIsMSl9d2hpbGUodC5oZWFwX2xlbj49Mik7dC5oZWFwWy0tdC5oZWFwX21heF09dC5oZWFwWzFdLCgodCxlKT0+e2NvbnN0IHI9ZS5keW5fdHJlZSxuPWUubWF4X2NvZGUsYT1lLnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxzPWUuc3RhdF9kZXNjLmhhc19zdHJlZSxsPWUuc3RhdF9kZXNjLmV4dHJhX2JpdHMsbz1lLnN0YXRfZGVzYy5leHRyYV9iYXNlLGg9ZS5zdGF0X2Rlc2MubWF4X2xlbmd0aDtsZXQgZixfLGQsdSxjLGcscD0wO2Zvcih1PTA7dTw9aTt1KyspdC5ibF9jb3VudFt1XT0wO2ZvcihyWzIqdC5oZWFwW3QuaGVhcF9tYXhdKzFdPTAsZj10LmhlYXBfbWF4KzE7Zjw1NzM7ZisrKV89dC5oZWFwW2ZdLHU9clsyKnJbMipfKzFdKzFdKzEsdT5oJiYodT1oLHArKyksclsyKl8rMV09dSxfPm58fCh0LmJsX2NvdW50W3VdKyssYz0wLF8+PW8mJihjPWxbXy1vXSksZz1yWzIqX10sdC5vcHRfbGVuKz1nKih1K2MpLHMmJih0LnN0YXRpY19sZW4rPWcqKGFbMipfKzFdK2MpKSk7aWYoMCE9PXApe2Rve2Zvcih1PWgtMTswPT09dC5ibF9jb3VudFt1XTspdS0tO3QuYmxfY291bnRbdV0tLSx0LmJsX2NvdW50W3UrMV0rPTIsdC5ibF9jb3VudFtoXS0tLHAtPTJ9d2hpbGUocD4wKTtmb3IodT1oOzAhPT11O3UtLSlmb3IoXz10LmJsX2NvdW50W3VdOzAhPT1fOylkPXQuaGVhcFstLWZdLGQ+bnx8KHJbMipkKzFdIT09dSYmKHQub3B0X2xlbis9KHUtclsyKmQrMV0pKnJbMipkXSxyWzIqZCsxXT11KSxfLS0pfX0pKHQsZSksRShyLGYsdC5ibF9jb3VudCl9LEw9KHQsZSxyKT0+e2xldCBuLGEsaT0tMSxzPWVbMV0sbD0wLG89NyxoPTQ7Zm9yKDA9PT1zJiYobz0xMzgsaD0zKSxlWzIqKHIrMSkrMV09NjU1MzUsbj0wO248PXI7bisrKWE9cyxzPWVbMioobisxKSsxXSwrK2w8byYmYT09PXN8fChsPGg/dC5ibF90cmVlWzIqYV0rPWw6MCE9PWE/KGEhPT1pJiZ0LmJsX3RyZWVbMiphXSsrLHQuYmxfdHJlZVszMl0rKyk6bDw9MTA/dC5ibF90cmVlWzM0XSsrOnQuYmxfdHJlZVszNl0rKyxsPTAsaT1hLDA9PT1zPyhvPTEzOCxoPTMpOmE9PT1zPyhvPTYsaD0zKToobz03LGg9NCkpfSxNPSh0LGUscik9PntsZXQgbixhLGk9LTEscz1lWzFdLGw9MCxvPTcsaD00O2ZvcigwPT09cyYmKG89MTM4LGg9Myksbj0wO248PXI7bisrKWlmKGE9cyxzPWVbMioobisxKSsxXSwhKCsrbDxvJiZhPT09cykpe2lmKGw8aClkb3tVKHQsYSx0LmJsX3RyZWUpfXdoaWxlKDAhPS0tbCk7ZWxzZSAwIT09YT8oYSE9PWkmJihVKHQsYSx0LmJsX3RyZWUpLGwtLSksVSh0LDE2LHQuYmxfdHJlZSkseCh0LGwtMywyKSk6bDw9MTA/KFUodCwxNyx0LmJsX3RyZWUpLHgodCxsLTMsMykpOihVKHQsMTgsdC5ibF90cmVlKSx4KHQsbC0xMSw3KSk7bD0wLGk9YSwwPT09cz8obz0xMzgsaD0zKTphPT09cz8obz02LGg9Myk6KG89NyxoPTQpfX07bGV0IE49ITE7Y29uc3QgRD0odCxlLHIsbik9Pnt4KHQsMCsobj8xOjApLDMpLFModCkseih0LHIpLHoodCx+ciksciYmdC5wZW5kaW5nX2J1Zi5zZXQodC53aW5kb3cuc3ViYXJyYXkoZSxlK3IpLHQucGVuZGluZyksdC5wZW5kaW5nKz1yfTtyZXR1cm4gZC5fdHJfaW5pdD10PT57Tnx8KCgoKT0+e2xldCB0LGUscixoLGQ7Y29uc3QgeT1uZXcgQXJyYXkoMTYpO2ZvcihyPTAsaD0wO2g8Mjg7aCsrKWZvcihnW2hdPXIsdD0wO3Q8MTw8c1toXTt0KyspY1tyKytdPWg7Zm9yKGNbci0xXT1oLGQ9MCxoPTA7aDwxNjtoKyspZm9yKHBbaF09ZCx0PTA7dDwxPDxsW2hdO3QrKyl1W2QrK109aDtmb3IoZD4+PTc7aDxhO2grKylmb3IocFtoXT1kPDw3LHQ9MDt0PDE8PGxbaF0tNzt0KyspdVsyNTYrZCsrXT1oO2ZvcihlPTA7ZTw9aTtlKyspeVtlXT0wO2Zvcih0PTA7dDw9MTQzOylmWzIqdCsxXT04LHQrKyx5WzhdKys7Zm9yKDt0PD0yNTU7KWZbMip0KzFdPTksdCsrLHlbOV0rKztmb3IoO3Q8PTI3OTspZlsyKnQrMV09Nyx0KysseVs3XSsrO2Zvcig7dDw9Mjg3OylmWzIqdCsxXT04LHQrKyx5WzhdKys7Zm9yKEUoZiwyODcseSksdD0wO3Q8YTt0KyspX1syKnQrMV09NSxfWzIqdF09ayh0LDUpO3Y9bmV3IHcoZixzLDI1NyxuLGkpLGI9bmV3IHcoXyxsLDAsYSxpKSxtPW5ldyB3KG5ldyBBcnJheSgwKSxvLDAsMTksNyl9KSgpLE49ITApLHQubF9kZXNjPW5ldyB5KHQuZHluX2x0cmVlLHYpLHQuZF9kZXNjPW5ldyB5KHQuZHluX2R0cmVlLGIpLHQuYmxfZGVzYz1uZXcgeSh0LmJsX3RyZWUsbSksdC5iaV9idWY9MCx0LmJpX3ZhbGlkPTAsUih0KX0sZC5fdHJfc3RvcmVkX2Jsb2NrPUQsZC5fdHJfZmx1c2hfYmxvY2s9KHQsZSxuLGEpPT57bGV0IGkscyxsPTA7dC5sZXZlbD4wPygyPT09dC5zdHJtLmRhdGFfdHlwZSYmKHQuc3RybS5kYXRhX3R5cGU9KHQ9PntsZXQgZSxuPTQwOTM2MjQ0NDc7Zm9yKGU9MDtlPD0zMTtlKyssbj4+Pj0xKWlmKDEmbiYmMCE9PXQuZHluX2x0cmVlWzIqZV0pcmV0dXJuIDA7aWYoMCE9PXQuZHluX2x0cmVlWzE4XXx8MCE9PXQuZHluX2x0cmVlWzIwXXx8MCE9PXQuZHluX2x0cmVlWzI2XSlyZXR1cm4gMTtmb3IoZT0zMjtlPHI7ZSsrKWlmKDAhPT10LmR5bl9sdHJlZVsyKmVdKXJldHVybiAxO3JldHVybiAwfSkodCkpLEModCx0LmxfZGVzYyksQyh0LHQuZF9kZXNjKSxsPSh0PT57bGV0IGU7Zm9yKEwodCx0LmR5bl9sdHJlZSx0LmxfZGVzYy5tYXhfY29kZSksTCh0LHQuZHluX2R0cmVlLHQuZF9kZXNjLm1heF9jb2RlKSxDKHQsdC5ibF9kZXNjKSxlPTE4O2U+PTMmJjA9PT10LmJsX3RyZWVbMipoW2VdKzFdO2UtLSk7cmV0dXJuIHQub3B0X2xlbis9MyooZSsxKSs1KzUrNCxlfSkodCksaT10Lm9wdF9sZW4rMys3Pj4+MyxzPXQuc3RhdGljX2xlbiszKzc+Pj4zLHM8PWkmJihpPXMpKTppPXM9bis1LG4rNDw9aSYmLTEhPT1lP0QodCxlLG4sYSk6ND09PXQuc3RyYXRlZ3l8fHM9PT1pPyh4KHQsMisoYT8xOjApLDMpLEkodCxmLF8pKTooeCh0LDQrKGE/MTowKSwzKSwoKHQsZSxyLG4pPT57bGV0IGE7Zm9yKHgodCxlLTI1Nyw1KSx4KHQsci0xLDUpLHgodCxuLTQsNCksYT0wO2E8bjthKyspeCh0LHQuYmxfdHJlZVsyKmhbYV0rMV0sMyk7TSh0LHQuZHluX2x0cmVlLGUtMSksTSh0LHQuZHluX2R0cmVlLHItMSl9KSh0LHQubF9kZXNjLm1heF9jb2RlKzEsdC5kX2Rlc2MubWF4X2NvZGUrMSxsKzEpLEkodCx0LmR5bl9sdHJlZSx0LmR5bl9kdHJlZSkpLFIodCksYSYmUyh0KX0sZC5fdHJfdGFsbHk9KHQsZSxuKT0+KHQucGVuZGluZ19idWZbdC5zeW1fYnVmK3Quc3ltX25leHQrK109ZSx0LnBlbmRpbmdfYnVmW3Quc3ltX2J1Zit0LnN5bV9uZXh0KytdPWU+PjgsdC5wZW5kaW5nX2J1Zlt0LnN5bV9idWYrdC5zeW1fbmV4dCsrXT1uLDA9PT1lP3QuZHluX2x0cmVlWzIqbl0rKzoodC5tYXRjaGVzKyssZS0tLHQuZHluX2x0cmVlWzIqKGNbbl0rcisxKV0rKyx0LmR5bl9kdHJlZVsyKkEoZSldKyspLHQuc3ltX25leHQ9PT10LnN5bV9lbmQpLGQuX3RyX2FsaWduPXQ9Pnt4KHQsMiwzKSxVKHQsMjU2LGYpLCh0PT57MTY9PT10LmJpX3ZhbGlkPyh6KHQsdC5iaV9idWYpLHQuYmlfYnVmPTAsdC5iaV92YWxpZD0wKTp0LmJpX3ZhbGlkPj04JiYodC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109MjU1JnQuYmlfYnVmLHQuYmlfYnVmPj49OCx0LmJpX3ZhbGlkLT04KX0pKHQpfSxkfWZ1bmN0aW9uIGMoKXtyZXR1cm4gcz9pOihzPTEsaT17MjpcIm5lZWQgZGljdGlvbmFyeVwiLDE6XCJzdHJlYW0gZW5kXCIsMDpcIlwiLFwiLTFcIjpcImZpbGUgZXJyb3JcIixcIi0yXCI6XCJzdHJlYW0gZXJyb3JcIixcIi0zXCI6XCJkYXRhIGVycm9yXCIsXCItNFwiOlwiaW5zdWZmaWNpZW50IG1lbW9yeVwiLFwiLTVcIjpcImJ1ZmZlciBlcnJvclwiLFwiLTZcIjpcImluY29tcGF0aWJsZSB2ZXJzaW9uXCJ9KX1mdW5jdGlvbiBnKCl7cmV0dXJuIG8/bDoobz0xLGw9e1pfTk9fRkxVU0g6MCxaX1BBUlRJQUxfRkxVU0g6MSxaX1NZTkNfRkxVU0g6MixaX0ZVTExfRkxVU0g6MyxaX0ZJTklTSDo0LFpfQkxPQ0s6NSxaX1RSRUVTOjYsWl9PSzowLFpfU1RSRUFNX0VORDoxLFpfTkVFRF9ESUNUOjIsWl9FUlJOTzotMSxaX1NUUkVBTV9FUlJPUjotMixaX0RBVEFfRVJST1I6LTMsWl9NRU1fRVJST1I6LTQsWl9CVUZfRVJST1I6LTUsWl9OT19DT01QUkVTU0lPTjowLFpfQkVTVF9TUEVFRDoxLFpfQkVTVF9DT01QUkVTU0lPTjo5LFpfREVGQVVMVF9DT01QUkVTU0lPTjotMSxaX0ZJTFRFUkVEOjEsWl9IVUZGTUFOX09OTFk6MixaX1JMRTozLFpfRklYRUQ6NCxaX0RFRkFVTFRfU1RSQVRFR1k6MCxaX0JJTkFSWTowLFpfVEVYVDoxLFpfVU5LTk9XTjoyLFpfREVGTEFURUQ6OH0pfWZ1bmN0aW9uIHAoKXtpZihoKXJldHVybiBfO2g9MTtjb25zdHtfdHJfaW5pdDp0LF90cl9zdG9yZWRfYmxvY2s6aSxfdHJfZmx1c2hfYmxvY2s6cyxfdHJfdGFsbHk6bCxfdHJfYWxpZ246b309dSgpLGY9cj9lOihyPTEsZT0odCxlLHIsbik9PntsZXQgYT02NTUzNSZ0LGk9dD4+PjE2JjY1NTM1LHM9MDtmb3IoOzAhPT1yOyl7cz1yPjJlMz8yZTM6cixyLT1zO2Rve2E9YStlW24rK118MCxpPWkrYXwwfXdoaWxlKC0tcyk7YSU9NjU1MjEsaSU9NjU1MjF9cmV0dXJuIGF8aTw8MTZ9KSxkPWZ1bmN0aW9uKCl7aWYoYSlyZXR1cm4gbjthPTE7Y29uc3QgdD1uZXcgVWludDMyQXJyYXkoKCgpPT57bGV0IHQsZT1bXTtmb3IodmFyIHI9MDtyPDI1NjtyKyspe3Q9cjtmb3IodmFyIG49MDtuPDg7bisrKXQ9MSZ0PzM5ODgyOTIzODRedD4+PjE6dD4+PjE7ZVtyXT10fXJldHVybiBlfSkoKSk7cmV0dXJuIG49KGUscixuLGEpPT57Y29uc3QgaT10LHM9YStuO2VePS0xO2ZvcihsZXQgdD1hO3Q8czt0KyspZT1lPj4+OF5pWzI1NSYoZV5yW3RdKV07cmV0dXJufmV9fSgpLHA9YygpLHtaX05PX0ZMVVNIOncsWl9QQVJUSUFMX0ZMVVNIOnYsWl9GVUxMX0ZMVVNIOmIsWl9GSU5JU0g6bSxaX0JMT0NLOnksWl9PSzpBLFpfU1RSRUFNX0VORDp6LFpfU1RSRUFNX0VSUk9SOngsWl9EQVRBX0VSUk9SOlUsWl9CVUZfRVJST1I6ayxaX0RFRkFVTFRfQ09NUFJFU1NJT046RSxaX0ZJTFRFUkVEOlIsWl9IVUZGTUFOX09OTFk6UyxaX1JMRTpULFpfRklYRUQ6WixaX0RFRkFVTFRfU1RSQVRFR1k6SSxaX1VOS05PV046QyxaX0RFRkxBVEVEOkx9PWcoKSxNPTI1OCxOPTI2MixEPTQyLEY9MTEzLE89NjY2LEI9KHQsZSk9Pih0Lm1zZz1wW2VdLGUpLEg9dD0+Mip0LSh0PjQ/OTowKSxQPXQ9PntsZXQgZT10Lmxlbmd0aDtmb3IoOy0tZT49MDspdFtlXT0wfSxZPXQ9PntsZXQgZSxyLG4sYT10Lndfc2l6ZTtlPXQuaGFzaF9zaXplLG49ZTtkb3tyPXQuaGVhZFstLW5dLHQuaGVhZFtuXT1yPj1hP3ItYTowfXdoaWxlKC0tZSk7ZT1hLG49ZTtkb3tyPXQucHJldlstLW5dLHQucHJldltuXT1yPj1hP3ItYTowfXdoaWxlKC0tZSl9O2xldCBxPSh0LGUscik9PihlPDx0Lmhhc2hfc2hpZnRecikmdC5oYXNoX21hc2s7Y29uc3QgRz10PT57Y29uc3QgZT10LnN0YXRlO2xldCByPWUucGVuZGluZztyPnQuYXZhaWxfb3V0JiYocj10LmF2YWlsX291dCksMCE9PXImJih0Lm91dHB1dC5zZXQoZS5wZW5kaW5nX2J1Zi5zdWJhcnJheShlLnBlbmRpbmdfb3V0LGUucGVuZGluZ19vdXQrciksdC5uZXh0X291dCksdC5uZXh0X291dCs9cixlLnBlbmRpbmdfb3V0Kz1yLHQudG90YWxfb3V0Kz1yLHQuYXZhaWxfb3V0LT1yLGUucGVuZGluZy09ciwwPT09ZS5wZW5kaW5nJiYoZS5wZW5kaW5nX291dD0wKSl9LEs9KHQsZSk9PntzKHQsdC5ibG9ja19zdGFydD49MD90LmJsb2NrX3N0YXJ0Oi0xLHQuc3Ryc3RhcnQtdC5ibG9ja19zdGFydCxlKSx0LmJsb2NrX3N0YXJ0PXQuc3Ryc3RhcnQsRyh0LnN0cm0pfSxqPSh0LGUpPT57dC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109ZX0sWD0odCxlKT0+e3QucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPWU+Pj44JjI1NSx0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT0yNTUmZX0sVj0odCxlLHIsbik9PntsZXQgYT10LmF2YWlsX2luO3JldHVybiBhPm4mJihhPW4pLDA9PT1hPzA6KHQuYXZhaWxfaW4tPWEsZS5zZXQodC5pbnB1dC5zdWJhcnJheSh0Lm5leHRfaW4sdC5uZXh0X2luK2EpLHIpLDE9PT10LnN0YXRlLndyYXA/dC5hZGxlcj1mKHQuYWRsZXIsZSxhLHIpOjI9PT10LnN0YXRlLndyYXAmJih0LmFkbGVyPWQodC5hZGxlcixlLGEscikpLHQubmV4dF9pbis9YSx0LnRvdGFsX2luKz1hLGEpfSxXPSh0LGUpPT57bGV0IHIsbixhPXQubWF4X2NoYWluX2xlbmd0aCxpPXQuc3Ryc3RhcnQscz10LnByZXZfbGVuZ3RoLGw9dC5uaWNlX21hdGNoO2NvbnN0IG89dC5zdHJzdGFydD50Lndfc2l6ZS1OP3Quc3Ryc3RhcnQtKHQud19zaXplLU4pOjAsaD10LndpbmRvdyxmPXQud19tYXNrLF89dC5wcmV2LGQ9dC5zdHJzdGFydCtNO2xldCB1PWhbaStzLTFdLGM9aFtpK3NdO3QucHJldl9sZW5ndGg+PXQuZ29vZF9tYXRjaCYmKGE+Pj0yKSxsPnQubG9va2FoZWFkJiYobD10Lmxvb2thaGVhZCk7ZG97aWYocj1lLGhbcitzXT09PWMmJmhbcitzLTFdPT09dSYmaFtyXT09PWhbaV0mJmhbKytyXT09PWhbaSsxXSl7aSs9MixyKys7ZG97fXdoaWxlKGhbKytpXT09PWhbKytyXSYmaFsrK2ldPT09aFsrK3JdJiZoWysraV09PT1oWysrcl0mJmhbKytpXT09PWhbKytyXSYmaFsrK2ldPT09aFsrK3JdJiZoWysraV09PT1oWysrcl0mJmhbKytpXT09PWhbKytyXSYmaFsrK2ldPT09aFsrK3JdJiZpPGQpO2lmKG49TS0oZC1pKSxpPWQtTSxuPnMpe2lmKHQubWF0Y2hfc3RhcnQ9ZSxzPW4sbj49bClicmVhazt1PWhbaStzLTFdLGM9aFtpK3NdfX19d2hpbGUoKGU9X1tlJmZdKT5vJiYwIT0tLWEpO3JldHVybiBzPD10Lmxvb2thaGVhZD9zOnQubG9va2FoZWFkfSxKPXQ9Pntjb25zdCBlPXQud19zaXplO2xldCByLG4sYTtkb3tpZihuPXQud2luZG93X3NpemUtdC5sb29rYWhlYWQtdC5zdHJzdGFydCx0LnN0cnN0YXJ0Pj1lKyhlLU4pJiYodC53aW5kb3cuc2V0KHQud2luZG93LnN1YmFycmF5KGUsZStlLW4pLDApLHQubWF0Y2hfc3RhcnQtPWUsdC5zdHJzdGFydC09ZSx0LmJsb2NrX3N0YXJ0LT1lLHQuaW5zZXJ0PnQuc3Ryc3RhcnQmJih0Lmluc2VydD10LnN0cnN0YXJ0KSxZKHQpLG4rPWUpLDA9PT10LnN0cm0uYXZhaWxfaW4pYnJlYWs7aWYocj1WKHQuc3RybSx0LndpbmRvdyx0LnN0cnN0YXJ0K3QubG9va2FoZWFkLG4pLHQubG9va2FoZWFkKz1yLHQubG9va2FoZWFkK3QuaW5zZXJ0Pj0zKWZvcihhPXQuc3Ryc3RhcnQtdC5pbnNlcnQsdC5pbnNfaD10LndpbmRvd1thXSx0Lmluc19oPXEodCx0Lmluc19oLHQud2luZG93W2ErMV0pO3QuaW5zZXJ0JiYodC5pbnNfaD1xKHQsdC5pbnNfaCx0LndpbmRvd1thKzMtMV0pLHQucHJldlthJnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPWEsYSsrLHQuaW5zZXJ0LS0sISh0Lmxvb2thaGVhZCt0Lmluc2VydDwzKSk7KTt9d2hpbGUodC5sb29rYWhlYWQ8TiYmMCE9PXQuc3RybS5hdmFpbF9pbil9LFE9KHQsZSk9PntsZXQgcixuLGEscz10LnBlbmRpbmdfYnVmX3NpemUtNT50Lndfc2l6ZT90Lndfc2l6ZTp0LnBlbmRpbmdfYnVmX3NpemUtNSxsPTAsbz10LnN0cm0uYXZhaWxfaW47ZG97aWYocj02NTUzNSxhPXQuYmlfdmFsaWQrNDI+PjMsdC5zdHJtLmF2YWlsX291dDxhKWJyZWFrO2lmKGE9dC5zdHJtLmF2YWlsX291dC1hLG49dC5zdHJzdGFydC10LmJsb2NrX3N0YXJ0LHI+bit0LnN0cm0uYXZhaWxfaW4mJihyPW4rdC5zdHJtLmF2YWlsX2luKSxyPmEmJihyPWEpLHI8cyYmKDA9PT1yJiZlIT09bXx8ZT09PXd8fHIhPT1uK3Quc3RybS5hdmFpbF9pbikpYnJlYWs7bD1lPT09bSYmcj09PW4rdC5zdHJtLmF2YWlsX2luPzE6MCxpKHQsMCwwLGwpLHQucGVuZGluZ19idWZbdC5wZW5kaW5nLTRdPXIsdC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmctM109cj4+OCx0LnBlbmRpbmdfYnVmW3QucGVuZGluZy0yXT1+cix0LnBlbmRpbmdfYnVmW3QucGVuZGluZy0xXT1+cj4+OCxHKHQuc3RybSksbiYmKG4+ciYmKG49ciksdC5zdHJtLm91dHB1dC5zZXQodC53aW5kb3cuc3ViYXJyYXkodC5ibG9ja19zdGFydCx0LmJsb2NrX3N0YXJ0K24pLHQuc3RybS5uZXh0X291dCksdC5zdHJtLm5leHRfb3V0Kz1uLHQuc3RybS5hdmFpbF9vdXQtPW4sdC5zdHJtLnRvdGFsX291dCs9bix0LmJsb2NrX3N0YXJ0Kz1uLHItPW4pLHImJihWKHQuc3RybSx0LnN0cm0ub3V0cHV0LHQuc3RybS5uZXh0X291dCxyKSx0LnN0cm0ubmV4dF9vdXQrPXIsdC5zdHJtLmF2YWlsX291dC09cix0LnN0cm0udG90YWxfb3V0Kz1yKX13aGlsZSgwPT09bCk7cmV0dXJuIG8tPXQuc3RybS5hdmFpbF9pbixvJiYobz49dC53X3NpemU/KHQubWF0Y2hlcz0yLHQud2luZG93LnNldCh0LnN0cm0uaW5wdXQuc3ViYXJyYXkodC5zdHJtLm5leHRfaW4tdC53X3NpemUsdC5zdHJtLm5leHRfaW4pLDApLHQuc3Ryc3RhcnQ9dC53X3NpemUsdC5pbnNlcnQ9dC5zdHJzdGFydCk6KHQud2luZG93X3NpemUtdC5zdHJzdGFydDw9byYmKHQuc3Ryc3RhcnQtPXQud19zaXplLHQud2luZG93LnNldCh0LndpbmRvdy5zdWJhcnJheSh0Lndfc2l6ZSx0Lndfc2l6ZSt0LnN0cnN0YXJ0KSwwKSx0Lm1hdGNoZXM8MiYmdC5tYXRjaGVzKyssdC5pbnNlcnQ+dC5zdHJzdGFydCYmKHQuaW5zZXJ0PXQuc3Ryc3RhcnQpKSx0LndpbmRvdy5zZXQodC5zdHJtLmlucHV0LnN1YmFycmF5KHQuc3RybS5uZXh0X2luLW8sdC5zdHJtLm5leHRfaW4pLHQuc3Ryc3RhcnQpLHQuc3Ryc3RhcnQrPW8sdC5pbnNlcnQrPW8+dC53X3NpemUtdC5pbnNlcnQ/dC53X3NpemUtdC5pbnNlcnQ6byksdC5ibG9ja19zdGFydD10LnN0cnN0YXJ0KSx0LmhpZ2hfd2F0ZXI8dC5zdHJzdGFydCYmKHQuaGlnaF93YXRlcj10LnN0cnN0YXJ0KSxsPzQ6ZSE9PXcmJmUhPT1tJiYwPT09dC5zdHJtLmF2YWlsX2luJiZ0LnN0cnN0YXJ0PT09dC5ibG9ja19zdGFydD8yOihhPXQud2luZG93X3NpemUtdC5zdHJzdGFydCx0LnN0cm0uYXZhaWxfaW4+YSYmdC5ibG9ja19zdGFydD49dC53X3NpemUmJih0LmJsb2NrX3N0YXJ0LT10Lndfc2l6ZSx0LnN0cnN0YXJ0LT10Lndfc2l6ZSx0LndpbmRvdy5zZXQodC53aW5kb3cuc3ViYXJyYXkodC53X3NpemUsdC53X3NpemUrdC5zdHJzdGFydCksMCksdC5tYXRjaGVzPDImJnQubWF0Y2hlcysrLGErPXQud19zaXplLHQuaW5zZXJ0PnQuc3Ryc3RhcnQmJih0Lmluc2VydD10LnN0cnN0YXJ0KSksYT50LnN0cm0uYXZhaWxfaW4mJihhPXQuc3RybS5hdmFpbF9pbiksYSYmKFYodC5zdHJtLHQud2luZG93LHQuc3Ryc3RhcnQsYSksdC5zdHJzdGFydCs9YSx0Lmluc2VydCs9YT50Lndfc2l6ZS10Lmluc2VydD90Lndfc2l6ZS10Lmluc2VydDphKSx0LmhpZ2hfd2F0ZXI8dC5zdHJzdGFydCYmKHQuaGlnaF93YXRlcj10LnN0cnN0YXJ0KSxhPXQuYmlfdmFsaWQrNDI+PjMsYT10LnBlbmRpbmdfYnVmX3NpemUtYT42NTUzNT82NTUzNTp0LnBlbmRpbmdfYnVmX3NpemUtYSxzPWE+dC53X3NpemU/dC53X3NpemU6YSxuPXQuc3Ryc3RhcnQtdC5ibG9ja19zdGFydCwobj49c3x8KG58fGU9PT1tKSYmZSE9PXcmJjA9PT10LnN0cm0uYXZhaWxfaW4mJm48PWEpJiYocj1uPmE/YTpuLGw9ZT09PW0mJjA9PT10LnN0cm0uYXZhaWxfaW4mJnI9PT1uPzE6MCxpKHQsdC5ibG9ja19zdGFydCxyLGwpLHQuYmxvY2tfc3RhcnQrPXIsRyh0LnN0cm0pKSxsPzM6MSl9LCQ9KHQsZSk9PntsZXQgcixuO2Zvcig7Oyl7aWYodC5sb29rYWhlYWQ8Til7aWYoSih0KSx0Lmxvb2thaGVhZDxOJiZlPT09dylyZXR1cm4gMTtpZigwPT09dC5sb29rYWhlYWQpYnJlYWt9aWYocj0wLHQubG9va2FoZWFkPj0zJiYodC5pbnNfaD1xKHQsdC5pbnNfaCx0LndpbmRvd1t0LnN0cnN0YXJ0KzMtMV0pLHI9dC5wcmV2W3Quc3Ryc3RhcnQmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09dC5zdHJzdGFydCksMCE9PXImJnQuc3Ryc3RhcnQtcjw9dC53X3NpemUtTiYmKHQubWF0Y2hfbGVuZ3RoPVcodCxyKSksdC5tYXRjaF9sZW5ndGg+PTMpaWYobj1sKHQsdC5zdHJzdGFydC10Lm1hdGNoX3N0YXJ0LHQubWF0Y2hfbGVuZ3RoLTMpLHQubG9va2FoZWFkLT10Lm1hdGNoX2xlbmd0aCx0Lm1hdGNoX2xlbmd0aDw9dC5tYXhfbGF6eV9tYXRjaCYmdC5sb29rYWhlYWQ+PTMpe3QubWF0Y2hfbGVuZ3RoLS07ZG97dC5zdHJzdGFydCsrLHQuaW5zX2g9cSh0LHQuaW5zX2gsdC53aW5kb3dbdC5zdHJzdGFydCszLTFdKSxyPXQucHJldlt0LnN0cnN0YXJ0JnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXQuc3Ryc3RhcnR9d2hpbGUoMCE9LS10Lm1hdGNoX2xlbmd0aCk7dC5zdHJzdGFydCsrfWVsc2UgdC5zdHJzdGFydCs9dC5tYXRjaF9sZW5ndGgsdC5tYXRjaF9sZW5ndGg9MCx0Lmluc19oPXQud2luZG93W3Quc3Ryc3RhcnRdLHQuaW5zX2g9cSh0LHQuaW5zX2gsdC53aW5kb3dbdC5zdHJzdGFydCsxXSk7ZWxzZSBuPWwodCwwLHQud2luZG93W3Quc3Ryc3RhcnRdKSx0Lmxvb2thaGVhZC0tLHQuc3Ryc3RhcnQrKztpZihuJiYoSyh0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIDF9cmV0dXJuIHQuaW5zZXJ0PXQuc3Ryc3RhcnQ8Mj90LnN0cnN0YXJ0OjIsZT09PW0/KEsodCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/Mzo0KTp0LnN5bV9uZXh0JiYoSyh0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCk/MToyfSx0dD0odCxlKT0+e2xldCByLG4sYTtmb3IoOzspe2lmKHQubG9va2FoZWFkPE4pe2lmKEoodCksdC5sb29rYWhlYWQ8TiYmZT09PXcpcmV0dXJuIDE7aWYoMD09PXQubG9va2FoZWFkKWJyZWFrfWlmKHI9MCx0Lmxvb2thaGVhZD49MyYmKHQuaW5zX2g9cSh0LHQuaW5zX2gsdC53aW5kb3dbdC5zdHJzdGFydCszLTFdKSxyPXQucHJldlt0LnN0cnN0YXJ0JnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXQuc3Ryc3RhcnQpLHQucHJldl9sZW5ndGg9dC5tYXRjaF9sZW5ndGgsdC5wcmV2X21hdGNoPXQubWF0Y2hfc3RhcnQsdC5tYXRjaF9sZW5ndGg9MiwwIT09ciYmdC5wcmV2X2xlbmd0aDx0Lm1heF9sYXp5X21hdGNoJiZ0LnN0cnN0YXJ0LXI8PXQud19zaXplLU4mJih0Lm1hdGNoX2xlbmd0aD1XKHQsciksdC5tYXRjaF9sZW5ndGg8PTUmJih0LnN0cmF0ZWd5PT09Unx8Mz09PXQubWF0Y2hfbGVuZ3RoJiZ0LnN0cnN0YXJ0LXQubWF0Y2hfc3RhcnQ+NDA5NikmJih0Lm1hdGNoX2xlbmd0aD0yKSksdC5wcmV2X2xlbmd0aD49MyYmdC5tYXRjaF9sZW5ndGg8PXQucHJldl9sZW5ndGgpe2E9dC5zdHJzdGFydCt0Lmxvb2thaGVhZC0zLG49bCh0LHQuc3Ryc3RhcnQtMS10LnByZXZfbWF0Y2gsdC5wcmV2X2xlbmd0aC0zKSx0Lmxvb2thaGVhZC09dC5wcmV2X2xlbmd0aC0xLHQucHJldl9sZW5ndGgtPTI7ZG97Kyt0LnN0cnN0YXJ0PD1hJiYodC5pbnNfaD1xKHQsdC5pbnNfaCx0LndpbmRvd1t0LnN0cnN0YXJ0KzMtMV0pLHI9dC5wcmV2W3Quc3Ryc3RhcnQmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09dC5zdHJzdGFydCl9d2hpbGUoMCE9LS10LnByZXZfbGVuZ3RoKTtpZih0Lm1hdGNoX2F2YWlsYWJsZT0wLHQubWF0Y2hfbGVuZ3RoPTIsdC5zdHJzdGFydCsrLG4mJihLKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gMX1lbHNlIGlmKHQubWF0Y2hfYXZhaWxhYmxlKXtpZihuPWwodCwwLHQud2luZG93W3Quc3Ryc3RhcnQtMV0pLG4mJksodCwhMSksdC5zdHJzdGFydCsrLHQubG9va2FoZWFkLS0sMD09PXQuc3RybS5hdmFpbF9vdXQpcmV0dXJuIDF9ZWxzZSB0Lm1hdGNoX2F2YWlsYWJsZT0xLHQuc3Ryc3RhcnQrKyx0Lmxvb2thaGVhZC0tfXJldHVybiB0Lm1hdGNoX2F2YWlsYWJsZSYmKG49bCh0LDAsdC53aW5kb3dbdC5zdHJzdGFydC0xXSksdC5tYXRjaF9hdmFpbGFibGU9MCksdC5pbnNlcnQ9dC5zdHJzdGFydDwyP3Quc3Ryc3RhcnQ6MixlPT09bT8oSyh0LCEwKSwwPT09dC5zdHJtLmF2YWlsX291dD8zOjQpOnQuc3ltX25leHQmJihLKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KT8xOjJ9O2Z1bmN0aW9uIGV0KHQsZSxyLG4sYSl7dGhpcy5nb29kX2xlbmd0aD10LHRoaXMubWF4X2xhenk9ZSx0aGlzLm5pY2VfbGVuZ3RoPXIsdGhpcy5tYXhfY2hhaW49bix0aGlzLmZ1bmM9YX1jb25zdCBydD1bbmV3IGV0KDAsMCwwLDAsUSksbmV3IGV0KDQsNCw4LDQsJCksbmV3IGV0KDQsNSwxNiw4LCQpLG5ldyBldCg0LDYsMzIsMzIsJCksbmV3IGV0KDQsNCwxNiwxNix0dCksbmV3IGV0KDgsMTYsMzIsMzIsdHQpLG5ldyBldCg4LDE2LDEyOCwxMjgsdHQpLG5ldyBldCg4LDMyLDEyOCwyNTYsdHQpLG5ldyBldCgzMiwxMjgsMjU4LDEwMjQsdHQpLG5ldyBldCgzMiwyNTgsMjU4LDQwOTYsdHQpXTtmdW5jdGlvbiBudCgpe3RoaXMuc3RybT1udWxsLHRoaXMuc3RhdHVzPTAsdGhpcy5wZW5kaW5nX2J1Zj1udWxsLHRoaXMucGVuZGluZ19idWZfc2l6ZT0wLHRoaXMucGVuZGluZ19vdXQ9MCx0aGlzLnBlbmRpbmc9MCx0aGlzLndyYXA9MCx0aGlzLmd6aGVhZD1udWxsLHRoaXMuZ3ppbmRleD0wLHRoaXMubWV0aG9kPUwsdGhpcy5sYXN0X2ZsdXNoPS0xLHRoaXMud19zaXplPTAsdGhpcy53X2JpdHM9MCx0aGlzLndfbWFzaz0wLHRoaXMud2luZG93PW51bGwsdGhpcy53aW5kb3dfc2l6ZT0wLHRoaXMucHJldj1udWxsLHRoaXMuaGVhZD1udWxsLHRoaXMuaW5zX2g9MCx0aGlzLmhhc2hfc2l6ZT0wLHRoaXMuaGFzaF9iaXRzPTAsdGhpcy5oYXNoX21hc2s9MCx0aGlzLmhhc2hfc2hpZnQ9MCx0aGlzLmJsb2NrX3N0YXJ0PTAsdGhpcy5tYXRjaF9sZW5ndGg9MCx0aGlzLnByZXZfbWF0Y2g9MCx0aGlzLm1hdGNoX2F2YWlsYWJsZT0wLHRoaXMuc3Ryc3RhcnQ9MCx0aGlzLm1hdGNoX3N0YXJ0PTAsdGhpcy5sb29rYWhlYWQ9MCx0aGlzLnByZXZfbGVuZ3RoPTAsdGhpcy5tYXhfY2hhaW5fbGVuZ3RoPTAsdGhpcy5tYXhfbGF6eV9tYXRjaD0wLHRoaXMubGV2ZWw9MCx0aGlzLnN0cmF0ZWd5PTAsdGhpcy5nb29kX21hdGNoPTAsdGhpcy5uaWNlX21hdGNoPTAsdGhpcy5keW5fbHRyZWU9bmV3IFVpbnQxNkFycmF5KDExNDYpLHRoaXMuZHluX2R0cmVlPW5ldyBVaW50MTZBcnJheSgxMjIpLHRoaXMuYmxfdHJlZT1uZXcgVWludDE2QXJyYXkoNzgpLFAodGhpcy5keW5fbHRyZWUpLFAodGhpcy5keW5fZHRyZWUpLFAodGhpcy5ibF90cmVlKSx0aGlzLmxfZGVzYz1udWxsLHRoaXMuZF9kZXNjPW51bGwsdGhpcy5ibF9kZXNjPW51bGwsdGhpcy5ibF9jb3VudD1uZXcgVWludDE2QXJyYXkoMTYpLHRoaXMuaGVhcD1uZXcgVWludDE2QXJyYXkoNTczKSxQKHRoaXMuaGVhcCksdGhpcy5oZWFwX2xlbj0wLHRoaXMuaGVhcF9tYXg9MCx0aGlzLmRlcHRoPW5ldyBVaW50MTZBcnJheSg1NzMpLFAodGhpcy5kZXB0aCksdGhpcy5zeW1fYnVmPTAsdGhpcy5saXRfYnVmc2l6ZT0wLHRoaXMuc3ltX25leHQ9MCx0aGlzLnN5bV9lbmQ9MCx0aGlzLm9wdF9sZW49MCx0aGlzLnN0YXRpY19sZW49MCx0aGlzLm1hdGNoZXM9MCx0aGlzLmluc2VydD0wLHRoaXMuYmlfYnVmPTAsdGhpcy5iaV92YWxpZD0wfWNvbnN0IGF0PXQ9PntpZighdClyZXR1cm4gMTtjb25zdCBlPXQuc3RhdGU7cmV0dXJuIWV8fGUuc3RybSE9PXR8fGUuc3RhdHVzIT09RCYmNTchPT1lLnN0YXR1cyYmNjkhPT1lLnN0YXR1cyYmNzMhPT1lLnN0YXR1cyYmOTEhPT1lLnN0YXR1cyYmMTAzIT09ZS5zdGF0dXMmJmUuc3RhdHVzIT09RiYmZS5zdGF0dXMhPT1PPzE6MH0saXQ9ZT0+e2lmKGF0KGUpKXJldHVybiBCKGUseCk7ZS50b3RhbF9pbj1lLnRvdGFsX291dD0wLGUuZGF0YV90eXBlPUM7Y29uc3Qgcj1lLnN0YXRlO3JldHVybiByLnBlbmRpbmc9MCxyLnBlbmRpbmdfb3V0PTAsci53cmFwPDAmJihyLndyYXA9LXIud3JhcCksci5zdGF0dXM9Mj09PXIud3JhcD81NzpyLndyYXA/RDpGLGUuYWRsZXI9Mj09PXIud3JhcD8wOjEsci5sYXN0X2ZsdXNoPS0yLHQociksQX0sc3Q9dD0+e2NvbnN0IGU9aXQodCk7dmFyIHI7cmV0dXJuIGU9PT1BJiYoKHI9dC5zdGF0ZSkud2luZG93X3NpemU9MipyLndfc2l6ZSxQKHIuaGVhZCksci5tYXhfbGF6eV9tYXRjaD1ydFtyLmxldmVsXS5tYXhfbGF6eSxyLmdvb2RfbWF0Y2g9cnRbci5sZXZlbF0uZ29vZF9sZW5ndGgsci5uaWNlX21hdGNoPXJ0W3IubGV2ZWxdLm5pY2VfbGVuZ3RoLHIubWF4X2NoYWluX2xlbmd0aD1ydFtyLmxldmVsXS5tYXhfY2hhaW4sci5zdHJzdGFydD0wLHIuYmxvY2tfc3RhcnQ9MCxyLmxvb2thaGVhZD0wLHIuaW5zZXJ0PTAsci5tYXRjaF9sZW5ndGg9ci5wcmV2X2xlbmd0aD0yLHIubWF0Y2hfYXZhaWxhYmxlPTAsci5pbnNfaD0wKSxlfSxsdD0odCxlLHIsbixhLGkpPT57aWYoIXQpcmV0dXJuIHg7bGV0IHM9MTtpZihlPT09RSYmKGU9NiksbjwwPyhzPTAsbj0tbik6bj4xNSYmKHM9MixuLT0xNiksYTwxfHxhPjl8fHIhPT1MfHxuPDh8fG4+MTV8fGU8MHx8ZT45fHxpPDB8fGk+Wnx8OD09PW4mJjEhPT1zKXJldHVybiBCKHQseCk7OD09PW4mJihuPTkpO2NvbnN0IGw9bmV3IG50O3JldHVybiB0LnN0YXRlPWwsbC5zdHJtPXQsbC5zdGF0dXM9RCxsLndyYXA9cyxsLmd6aGVhZD1udWxsLGwud19iaXRzPW4sbC53X3NpemU9MTw8bC53X2JpdHMsbC53X21hc2s9bC53X3NpemUtMSxsLmhhc2hfYml0cz1hKzcsbC5oYXNoX3NpemU9MTw8bC5oYXNoX2JpdHMsbC5oYXNoX21hc2s9bC5oYXNoX3NpemUtMSxsLmhhc2hfc2hpZnQ9fn4oKGwuaGFzaF9iaXRzKzMtMSkvMyksbC53aW5kb3c9bmV3IFVpbnQ4QXJyYXkoMipsLndfc2l6ZSksbC5oZWFkPW5ldyBVaW50MTZBcnJheShsLmhhc2hfc2l6ZSksbC5wcmV2PW5ldyBVaW50MTZBcnJheShsLndfc2l6ZSksbC5saXRfYnVmc2l6ZT0xPDxhKzYsbC5wZW5kaW5nX2J1Zl9zaXplPTQqbC5saXRfYnVmc2l6ZSxsLnBlbmRpbmdfYnVmPW5ldyBVaW50OEFycmF5KGwucGVuZGluZ19idWZfc2l6ZSksbC5zeW1fYnVmPWwubGl0X2J1ZnNpemUsbC5zeW1fZW5kPTMqKGwubGl0X2J1ZnNpemUtMSksbC5sZXZlbD1lLGwuc3RyYXRlZ3k9aSxsLm1ldGhvZD1yLHN0KHQpfTtyZXR1cm4gXy5kZWZsYXRlSW5pdD0odCxlKT0+bHQodCxlLEwsMTUsOCxJKSxfLmRlZmxhdGVJbml0Mj1sdCxfLmRlZmxhdGVSZXNldD1zdCxfLmRlZmxhdGVSZXNldEtlZXA9aXQsXy5kZWZsYXRlU2V0SGVhZGVyPSh0LGUpPT5hdCh0KXx8MiE9PXQuc3RhdGUud3JhcD94Oih0LnN0YXRlLmd6aGVhZD1lLEEpLF8uZGVmbGF0ZT0odCxlKT0+e2lmKGF0KHQpfHxlPnl8fGU8MClyZXR1cm4gdD9CKHQseCk6eDtjb25zdCByPXQuc3RhdGU7aWYoIXQub3V0cHV0fHwwIT09dC5hdmFpbF9pbiYmIXQuaW5wdXR8fHIuc3RhdHVzPT09TyYmZSE9PW0pcmV0dXJuIEIodCwwPT09dC5hdmFpbF9vdXQ/azp4KTtjb25zdCBuPXIubGFzdF9mbHVzaDtpZihyLmxhc3RfZmx1c2g9ZSwwIT09ci5wZW5kaW5nKXtpZihHKHQpLDA9PT10LmF2YWlsX291dClyZXR1cm4gci5sYXN0X2ZsdXNoPS0xLEF9ZWxzZSBpZigwPT09dC5hdmFpbF9pbiYmSChlKTw9SChuKSYmZSE9PW0pcmV0dXJuIEIodCxrKTtpZihyLnN0YXR1cz09PU8mJjAhPT10LmF2YWlsX2luKXJldHVybiBCKHQsayk7aWYoci5zdGF0dXM9PT1EJiYwPT09ci53cmFwJiYoci5zdGF0dXM9Riksci5zdGF0dXM9PT1EKXtsZXQgZT1MKyhyLndfYml0cy04PDw0KTw8OCxuPS0xO2lmKG49ci5zdHJhdGVneT49U3x8ci5sZXZlbDwyPzA6ci5sZXZlbDw2PzE6Nj09PXIubGV2ZWw/MjozLGV8PW48PDYsMCE9PXIuc3Ryc3RhcnQmJihlfD0zMiksZSs9MzEtZSUzMSxYKHIsZSksMCE9PXIuc3Ryc3RhcnQmJihYKHIsdC5hZGxlcj4+PjE2KSxYKHIsNjU1MzUmdC5hZGxlcikpLHQuYWRsZXI9MSxyLnN0YXR1cz1GLEcodCksMCE9PXIucGVuZGluZylyZXR1cm4gci5sYXN0X2ZsdXNoPS0xLEF9aWYoNTc9PT1yLnN0YXR1cylpZih0LmFkbGVyPTAsaihyLDMxKSxqKHIsMTM5KSxqKHIsOCksci5nemhlYWQpaihyLChyLmd6aGVhZC50ZXh0PzE6MCkrKHIuZ3poZWFkLmhjcmM/MjowKSsoci5nemhlYWQuZXh0cmE/NDowKSsoci5nemhlYWQubmFtZT84OjApKyhyLmd6aGVhZC5jb21tZW50PzE2OjApKSxqKHIsMjU1JnIuZ3poZWFkLnRpbWUpLGoocixyLmd6aGVhZC50aW1lPj44JjI1NSksaihyLHIuZ3poZWFkLnRpbWU+PjE2JjI1NSksaihyLHIuZ3poZWFkLnRpbWU+PjI0JjI1NSksaihyLDk9PT1yLmxldmVsPzI6ci5zdHJhdGVneT49U3x8ci5sZXZlbDwyPzQ6MCksaihyLDI1NSZyLmd6aGVhZC5vcyksci5nemhlYWQuZXh0cmEmJnIuZ3poZWFkLmV4dHJhLmxlbmd0aCYmKGoociwyNTUmci5nemhlYWQuZXh0cmEubGVuZ3RoKSxqKHIsci5nemhlYWQuZXh0cmEubGVuZ3RoPj44JjI1NSkpLHIuZ3poZWFkLmhjcmMmJih0LmFkbGVyPWQodC5hZGxlcixyLnBlbmRpbmdfYnVmLHIucGVuZGluZywwKSksci5nemluZGV4PTAsci5zdGF0dXM9Njk7ZWxzZSBpZihqKHIsMCksaihyLDApLGoociwwKSxqKHIsMCksaihyLDApLGoociw5PT09ci5sZXZlbD8yOnIuc3RyYXRlZ3k+PVN8fHIubGV2ZWw8Mj80OjApLGoociwzKSxyLnN0YXR1cz1GLEcodCksMCE9PXIucGVuZGluZylyZXR1cm4gci5sYXN0X2ZsdXNoPS0xLEE7aWYoNjk9PT1yLnN0YXR1cyl7aWYoci5nemhlYWQuZXh0cmEpe2xldCBlPXIucGVuZGluZyxuPSg2NTUzNSZyLmd6aGVhZC5leHRyYS5sZW5ndGgpLXIuZ3ppbmRleDtmb3IoO3IucGVuZGluZytuPnIucGVuZGluZ19idWZfc2l6ZTspe2xldCBhPXIucGVuZGluZ19idWZfc2l6ZS1yLnBlbmRpbmc7aWYoci5wZW5kaW5nX2J1Zi5zZXQoci5nemhlYWQuZXh0cmEuc3ViYXJyYXkoci5nemluZGV4LHIuZ3ppbmRleCthKSxyLnBlbmRpbmcpLHIucGVuZGluZz1yLnBlbmRpbmdfYnVmX3NpemUsci5nemhlYWQuaGNyYyYmci5wZW5kaW5nPmUmJih0LmFkbGVyPWQodC5hZGxlcixyLnBlbmRpbmdfYnVmLHIucGVuZGluZy1lLGUpKSxyLmd6aW5kZXgrPWEsRyh0KSwwIT09ci5wZW5kaW5nKXJldHVybiByLmxhc3RfZmx1c2g9LTEsQTtlPTAsbi09YX1sZXQgYT1uZXcgVWludDhBcnJheShyLmd6aGVhZC5leHRyYSk7ci5wZW5kaW5nX2J1Zi5zZXQoYS5zdWJhcnJheShyLmd6aW5kZXgsci5nemluZGV4K24pLHIucGVuZGluZyksci5wZW5kaW5nKz1uLHIuZ3poZWFkLmhjcmMmJnIucGVuZGluZz5lJiYodC5hZGxlcj1kKHQuYWRsZXIsci5wZW5kaW5nX2J1ZixyLnBlbmRpbmctZSxlKSksci5nemluZGV4PTB9ci5zdGF0dXM9NzN9aWYoNzM9PT1yLnN0YXR1cyl7aWYoci5nemhlYWQubmFtZSl7bGV0IGUsbj1yLnBlbmRpbmc7ZG97aWYoci5wZW5kaW5nPT09ci5wZW5kaW5nX2J1Zl9zaXplKXtpZihyLmd6aGVhZC5oY3JjJiZyLnBlbmRpbmc+biYmKHQuYWRsZXI9ZCh0LmFkbGVyLHIucGVuZGluZ19idWYsci5wZW5kaW5nLW4sbikpLEcodCksMCE9PXIucGVuZGluZylyZXR1cm4gci5sYXN0X2ZsdXNoPS0xLEE7bj0wfWU9ci5nemluZGV4PHIuZ3poZWFkLm5hbWUubGVuZ3RoPzI1NSZyLmd6aGVhZC5uYW1lLmNoYXJDb2RlQXQoci5nemluZGV4KyspOjAsaihyLGUpfXdoaWxlKDAhPT1lKTtyLmd6aGVhZC5oY3JjJiZyLnBlbmRpbmc+biYmKHQuYWRsZXI9ZCh0LmFkbGVyLHIucGVuZGluZ19idWYsci5wZW5kaW5nLW4sbikpLHIuZ3ppbmRleD0wfXIuc3RhdHVzPTkxfWlmKDkxPT09ci5zdGF0dXMpe2lmKHIuZ3poZWFkLmNvbW1lbnQpe2xldCBlLG49ci5wZW5kaW5nO2Rve2lmKHIucGVuZGluZz09PXIucGVuZGluZ19idWZfc2l6ZSl7aWYoci5nemhlYWQuaGNyYyYmci5wZW5kaW5nPm4mJih0LmFkbGVyPWQodC5hZGxlcixyLnBlbmRpbmdfYnVmLHIucGVuZGluZy1uLG4pKSxHKHQpLDAhPT1yLnBlbmRpbmcpcmV0dXJuIHIubGFzdF9mbHVzaD0tMSxBO249MH1lPXIuZ3ppbmRleDxyLmd6aGVhZC5jb21tZW50Lmxlbmd0aD8yNTUmci5nemhlYWQuY29tbWVudC5jaGFyQ29kZUF0KHIuZ3ppbmRleCsrKTowLGoocixlKX13aGlsZSgwIT09ZSk7ci5nemhlYWQuaGNyYyYmci5wZW5kaW5nPm4mJih0LmFkbGVyPWQodC5hZGxlcixyLnBlbmRpbmdfYnVmLHIucGVuZGluZy1uLG4pKX1yLnN0YXR1cz0xMDN9aWYoMTAzPT09ci5zdGF0dXMpe2lmKHIuZ3poZWFkLmhjcmMpe2lmKHIucGVuZGluZysyPnIucGVuZGluZ19idWZfc2l6ZSYmKEcodCksMCE9PXIucGVuZGluZykpcmV0dXJuIHIubGFzdF9mbHVzaD0tMSxBO2oociwyNTUmdC5hZGxlciksaihyLHQuYWRsZXI+PjgmMjU1KSx0LmFkbGVyPTB9aWYoci5zdGF0dXM9RixHKHQpLDAhPT1yLnBlbmRpbmcpcmV0dXJuIHIubGFzdF9mbHVzaD0tMSxBfWlmKDAhPT10LmF2YWlsX2lufHwwIT09ci5sb29rYWhlYWR8fGUhPT13JiZyLnN0YXR1cyE9PU8pe2xldCBuPTA9PT1yLmxldmVsP1EocixlKTpyLnN0cmF0ZWd5PT09Uz8oKHQsZSk9PntsZXQgcjtmb3IoOzspe2lmKDA9PT10Lmxvb2thaGVhZCYmKEoodCksMD09PXQubG9va2FoZWFkKSl7aWYoZT09PXcpcmV0dXJuIDE7YnJlYWt9aWYodC5tYXRjaF9sZW5ndGg9MCxyPWwodCwwLHQud2luZG93W3Quc3Ryc3RhcnRdKSx0Lmxvb2thaGVhZC0tLHQuc3Ryc3RhcnQrKyxyJiYoSyh0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIDF9cmV0dXJuIHQuaW5zZXJ0PTAsZT09PW0/KEsodCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/Mzo0KTp0LnN5bV9uZXh0JiYoSyh0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCk/MToyfSkocixlKTpyLnN0cmF0ZWd5PT09VD8oKHQsZSk9PntsZXQgcixuLGEsaTtjb25zdCBzPXQud2luZG93O2Zvcig7Oyl7aWYodC5sb29rYWhlYWQ8PU0pe2lmKEoodCksdC5sb29rYWhlYWQ8PU0mJmU9PT13KXJldHVybiAxO2lmKDA9PT10Lmxvb2thaGVhZClicmVha31pZih0Lm1hdGNoX2xlbmd0aD0wLHQubG9va2FoZWFkPj0zJiZ0LnN0cnN0YXJ0PjAmJihhPXQuc3Ryc3RhcnQtMSxuPXNbYV0sbj09PXNbKythXSYmbj09PXNbKythXSYmbj09PXNbKythXSkpe2k9dC5zdHJzdGFydCtNO2Rve313aGlsZShuPT09c1srK2FdJiZuPT09c1srK2FdJiZuPT09c1srK2FdJiZuPT09c1srK2FdJiZuPT09c1srK2FdJiZuPT09c1srK2FdJiZuPT09c1srK2FdJiZuPT09c1srK2FdJiZhPGkpO3QubWF0Y2hfbGVuZ3RoPU0tKGktYSksdC5tYXRjaF9sZW5ndGg+dC5sb29rYWhlYWQmJih0Lm1hdGNoX2xlbmd0aD10Lmxvb2thaGVhZCl9aWYodC5tYXRjaF9sZW5ndGg+PTM/KHI9bCh0LDEsdC5tYXRjaF9sZW5ndGgtMyksdC5sb29rYWhlYWQtPXQubWF0Y2hfbGVuZ3RoLHQuc3Ryc3RhcnQrPXQubWF0Y2hfbGVuZ3RoLHQubWF0Y2hfbGVuZ3RoPTApOihyPWwodCwwLHQud2luZG93W3Quc3Ryc3RhcnRdKSx0Lmxvb2thaGVhZC0tLHQuc3Ryc3RhcnQrKyksciYmKEsodCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiAxfXJldHVybiB0Lmluc2VydD0wLGU9PT1tPyhLKHQsITApLDA9PT10LnN0cm0uYXZhaWxfb3V0PzM6NCk6dC5zeW1fbmV4dCYmKEsodCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpPzE6Mn0pKHIsZSk6cnRbci5sZXZlbF0uZnVuYyhyLGUpO2lmKDMhPT1uJiY0IT09bnx8KHIuc3RhdHVzPU8pLDE9PT1ufHwzPT09bilyZXR1cm4gMD09PXQuYXZhaWxfb3V0JiYoci5sYXN0X2ZsdXNoPS0xKSxBO2lmKDI9PT1uJiYoZT09PXY/byhyKTplIT09eSYmKGkociwwLDAsITEpLGU9PT1iJiYoUChyLmhlYWQpLDA9PT1yLmxvb2thaGVhZCYmKHIuc3Ryc3RhcnQ9MCxyLmJsb2NrX3N0YXJ0PTAsci5pbnNlcnQ9MCkpKSxHKHQpLDA9PT10LmF2YWlsX291dCkpcmV0dXJuIHIubGFzdF9mbHVzaD0tMSxBfXJldHVybiBlIT09bT9BOnIud3JhcDw9MD96OigyPT09ci53cmFwPyhqKHIsMjU1JnQuYWRsZXIpLGoocix0LmFkbGVyPj44JjI1NSksaihyLHQuYWRsZXI+PjE2JjI1NSksaihyLHQuYWRsZXI+PjI0JjI1NSksaihyLDI1NSZ0LnRvdGFsX2luKSxqKHIsdC50b3RhbF9pbj4+OCYyNTUpLGoocix0LnRvdGFsX2luPj4xNiYyNTUpLGoocix0LnRvdGFsX2luPj4yNCYyNTUpKTooWChyLHQuYWRsZXI+Pj4xNiksWChyLDY1NTM1JnQuYWRsZXIpKSxHKHQpLHIud3JhcD4wJiYoci53cmFwPS1yLndyYXApLDAhPT1yLnBlbmRpbmc/QTp6KX0sXy5kZWZsYXRlRW5kPXQ9PntpZihhdCh0KSlyZXR1cm4geDtjb25zdCBlPXQuc3RhdGUuc3RhdHVzO3JldHVybiB0LnN0YXRlPW51bGwsZT09PUY/Qih0LFUpOkF9LF8uZGVmbGF0ZVNldERpY3Rpb25hcnk9KHQsZSk9PntsZXQgcj1lLmxlbmd0aDtpZihhdCh0KSlyZXR1cm4geDtjb25zdCBuPXQuc3RhdGUsYT1uLndyYXA7aWYoMj09PWF8fDE9PT1hJiZuLnN0YXR1cyE9PUR8fG4ubG9va2FoZWFkKXJldHVybiB4O2lmKDE9PT1hJiYodC5hZGxlcj1mKHQuYWRsZXIsZSxyLDApKSxuLndyYXA9MCxyPj1uLndfc2l6ZSl7MD09PWEmJihQKG4uaGVhZCksbi5zdHJzdGFydD0wLG4uYmxvY2tfc3RhcnQ9MCxuLmluc2VydD0wKTtsZXQgdD1uZXcgVWludDhBcnJheShuLndfc2l6ZSk7dC5zZXQoZS5zdWJhcnJheShyLW4ud19zaXplLHIpLDApLGU9dCxyPW4ud19zaXplfWNvbnN0IGk9dC5hdmFpbF9pbixzPXQubmV4dF9pbixsPXQuaW5wdXQ7Zm9yKHQuYXZhaWxfaW49cix0Lm5leHRfaW49MCx0LmlucHV0PWUsSihuKTtuLmxvb2thaGVhZD49Mzspe2xldCB0PW4uc3Ryc3RhcnQsZT1uLmxvb2thaGVhZC0yO2Rve24uaW5zX2g9cShuLG4uaW5zX2gsbi53aW5kb3dbdCszLTFdKSxuLnByZXZbdCZuLndfbWFza109bi5oZWFkW24uaW5zX2hdLG4uaGVhZFtuLmluc19oXT10LHQrK313aGlsZSgtLWUpO24uc3Ryc3RhcnQ9dCxuLmxvb2thaGVhZD0yLEoobil9cmV0dXJuIG4uc3Ryc3RhcnQrPW4ubG9va2FoZWFkLG4uYmxvY2tfc3RhcnQ9bi5zdHJzdGFydCxuLmluc2VydD1uLmxvb2thaGVhZCxuLmxvb2thaGVhZD0wLG4ubWF0Y2hfbGVuZ3RoPW4ucHJldl9sZW5ndGg9MixuLm1hdGNoX2F2YWlsYWJsZT0wLHQubmV4dF9pbj1zLHQuaW5wdXQ9bCx0LmF2YWlsX2luPWksbi53cmFwPWEsQX0sXy5kZWZsYXRlSW5mbz1cInBha28gZGVmbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdClcIixffXZhciB3LHY9e307dmFyIGIsbSx5LEEsej17fTtmdW5jdGlvbiB4KCl7aWYoYilyZXR1cm4gejtiPTE7bGV0IHQ9ITA7dHJ5e1N0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxuZXcgVWludDhBcnJheSgxKSl9Y2F0Y2goZSl7dD0hMX1jb25zdCBlPW5ldyBVaW50OEFycmF5KDI1Nik7Zm9yKGxldCB0PTA7dDwyNTY7dCsrKWVbdF09dD49MjUyPzY6dD49MjQ4PzU6dD49MjQwPzQ6dD49MjI0PzM6dD49MTkyPzI6MTtlWzI1NF09ZVsyNTRdPTEsei5zdHJpbmcyYnVmPXQ9PntpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBUZXh0RW5jb2RlciYmVGV4dEVuY29kZXIucHJvdG90eXBlLmVuY29kZSlyZXR1cm4obmV3IFRleHRFbmNvZGVyKS5lbmNvZGUodCk7bGV0IGUscixuLGEsaSxzPXQubGVuZ3RoLGw9MDtmb3IoYT0wO2E8czthKyspcj10LmNoYXJDb2RlQXQoYSksNTUyOTY9PSg2NDUxMiZyKSYmYSsxPHMmJihuPXQuY2hhckNvZGVBdChhKzEpLDU2MzIwPT0oNjQ1MTImbikmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKG4tNTYzMjApLGErKykpLGwrPXI8MTI4PzE6cjwyMDQ4PzI6cjw2NTUzNj8zOjQ7Zm9yKGU9bmV3IFVpbnQ4QXJyYXkobCksaT0wLGE9MDtpPGw7YSsrKXI9dC5jaGFyQ29kZUF0KGEpLDU1Mjk2PT0oNjQ1MTImcikmJmErMTxzJiYobj10LmNoYXJDb2RlQXQoYSsxKSw1NjMyMD09KDY0NTEyJm4pJiYocj02NTUzNisoci01NTI5Njw8MTApKyhuLTU2MzIwKSxhKyspKSxyPDEyOD9lW2krK109cjpyPDIwNDg/KGVbaSsrXT0xOTJ8cj4+PjYsZVtpKytdPTEyOHw2MyZyKTpyPDY1NTM2PyhlW2krK109MjI0fHI+Pj4xMixlW2krK109MTI4fHI+Pj42JjYzLGVbaSsrXT0xMjh8NjMmcik6KGVbaSsrXT0yNDB8cj4+PjE4LGVbaSsrXT0xMjh8cj4+PjEyJjYzLGVbaSsrXT0xMjh8cj4+PjYmNjMsZVtpKytdPTEyOHw2MyZyKTtyZXR1cm4gZX07cmV0dXJuIHouYnVmMnN0cmluZz0ocixuKT0+e2NvbnN0IGE9bnx8ci5sZW5ndGg7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgVGV4dERlY29kZXImJlRleHREZWNvZGVyLnByb3RvdHlwZS5kZWNvZGUpcmV0dXJuKG5ldyBUZXh0RGVjb2RlcikuZGVjb2RlKHIuc3ViYXJyYXkoMCxuKSk7bGV0IGkscztjb25zdCBsPW5ldyBBcnJheSgyKmEpO2ZvcihzPTAsaT0wO2k8YTspe2xldCB0PXJbaSsrXTtpZih0PDEyOCl7bFtzKytdPXQ7Y29udGludWV9bGV0IG49ZVt0XTtpZihuPjQpbFtzKytdPTY1NTMzLGkrPW4tMTtlbHNle2Zvcih0Jj0yPT09bj8zMTozPT09bj8xNTo3O24+MSYmaTxhOyl0PXQ8PDZ8NjMmcltpKytdLG4tLTtuPjE/bFtzKytdPTY1NTMzOnQ8NjU1MzY/bFtzKytdPXQ6KHQtPTY1NTM2LGxbcysrXT01NTI5Nnx0Pj4xMCYxMDIzLGxbcysrXT01NjMyMHwxMDIzJnQpfX1yZXR1cm4oKGUscik9PntpZihyPDY1NTM0JiZlLnN1YmFycmF5JiZ0KXJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsZS5sZW5ndGg9PT1yP2U6ZS5zdWJhcnJheSgwLHIpKTtsZXQgbj1cIlwiO2ZvcihsZXQgdD0wO3Q8cjt0Kyspbis9U3RyaW5nLmZyb21DaGFyQ29kZShlW3RdKTtyZXR1cm4gbn0pKGwscyl9LHoudXRmOGJvcmRlcj0odCxyKT0+eyhyPXJ8fHQubGVuZ3RoKT50Lmxlbmd0aCYmKHI9dC5sZW5ndGgpO2xldCBuPXItMTtmb3IoO24+PTAmJjEyOD09KDE5MiZ0W25dKTspbi0tO3JldHVybiBuPDB8fDA9PT1uP3I6bitlW3Rbbl1dPnI/bjpyfSx6fXZhciBVPWZ1bmN0aW9uKCl7aWYoQSlyZXR1cm4gZjtBPTE7Y29uc3QgdD1wKCksZT1mdW5jdGlvbigpe2lmKHcpcmV0dXJuIHY7dz0xO2NvbnN0IHQ9KHQsZSk9Pk9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0LGUpO3JldHVybiB2LmFzc2lnbj1mdW5jdGlvbihlKXtjb25zdCByPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywxKTtmb3IoO3IubGVuZ3RoOyl7Y29uc3Qgbj1yLnNoaWZ0KCk7aWYobil7aWYoXCJvYmplY3RcIiE9dHlwZW9mIG4pdGhyb3cgbmV3IFR5cGVFcnJvcihuK1wibXVzdCBiZSBub24tb2JqZWN0XCIpO2Zvcihjb25zdCByIGluIG4pdChuLHIpJiYoZVtyXT1uW3JdKX19cmV0dXJuIGV9LHYuZmxhdHRlbkNodW5rcz10PT57bGV0IGU9MDtmb3IobGV0IHI9MCxuPXQubGVuZ3RoO3I8bjtyKyspZSs9dFtyXS5sZW5ndGg7Y29uc3Qgcj1uZXcgVWludDhBcnJheShlKTtmb3IobGV0IGU9MCxuPTAsYT10Lmxlbmd0aDtlPGE7ZSsrKXtsZXQgYT10W2VdO3Iuc2V0KGEsbiksbis9YS5sZW5ndGh9cmV0dXJuIHJ9LHZ9KCkscj14KCksbj1jKCksYT15P206KHk9MSxtPWZ1bmN0aW9uKCl7dGhpcy5pbnB1dD1udWxsLHRoaXMubmV4dF9pbj0wLHRoaXMuYXZhaWxfaW49MCx0aGlzLnRvdGFsX2luPTAsdGhpcy5vdXRwdXQ9bnVsbCx0aGlzLm5leHRfb3V0PTAsdGhpcy5hdmFpbF9vdXQ9MCx0aGlzLnRvdGFsX291dD0wLHRoaXMubXNnPVwiXCIsdGhpcy5zdGF0ZT1udWxsLHRoaXMuZGF0YV90eXBlPTIsdGhpcy5hZGxlcj0wfSksaT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLHtaX05PX0ZMVVNIOnMsWl9TWU5DX0ZMVVNIOmwsWl9GVUxMX0ZMVVNIOm8sWl9GSU5JU0g6aCxaX09LOl8sWl9TVFJFQU1fRU5EOmQsWl9ERUZBVUxUX0NPTVBSRVNTSU9OOnUsWl9ERUZBVUxUX1NUUkFURUdZOmIsWl9ERUZMQVRFRDp6fT1nKCk7ZnVuY3Rpb24gVShzKXt0aGlzLm9wdGlvbnM9ZS5hc3NpZ24oe2xldmVsOnUsbWV0aG9kOnosY2h1bmtTaXplOjE2Mzg0LHdpbmRvd0JpdHM6MTUsbWVtTGV2ZWw6OCxzdHJhdGVneTpifSxzfHx7fSk7bGV0IGw9dGhpcy5vcHRpb25zO2wucmF3JiZsLndpbmRvd0JpdHM+MD9sLndpbmRvd0JpdHM9LWwud2luZG93Qml0czpsLmd6aXAmJmwud2luZG93Qml0cz4wJiZsLndpbmRvd0JpdHM8MTYmJihsLndpbmRvd0JpdHMrPTE2KSx0aGlzLmVycj0wLHRoaXMubXNnPVwiXCIsdGhpcy5lbmRlZD0hMSx0aGlzLmNodW5rcz1bXSx0aGlzLnN0cm09bmV3IGEsdGhpcy5zdHJtLmF2YWlsX291dD0wO2xldCBvPXQuZGVmbGF0ZUluaXQyKHRoaXMuc3RybSxsLmxldmVsLGwubWV0aG9kLGwud2luZG93Qml0cyxsLm1lbUxldmVsLGwuc3RyYXRlZ3kpO2lmKG8hPT1fKXRocm93IG5ldyBFcnJvcihuW29dKTtpZihsLmhlYWRlciYmdC5kZWZsYXRlU2V0SGVhZGVyKHRoaXMuc3RybSxsLmhlYWRlciksbC5kaWN0aW9uYXJ5KXtsZXQgZTtpZihlPVwic3RyaW5nXCI9PXR5cGVvZiBsLmRpY3Rpb25hcnk/ci5zdHJpbmcyYnVmKGwuZGljdGlvbmFyeSk6XCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiPT09aS5jYWxsKGwuZGljdGlvbmFyeSk/bmV3IFVpbnQ4QXJyYXkobC5kaWN0aW9uYXJ5KTpsLmRpY3Rpb25hcnksbz10LmRlZmxhdGVTZXREaWN0aW9uYXJ5KHRoaXMuc3RybSxlKSxvIT09Xyl0aHJvdyBuZXcgRXJyb3IobltvXSk7dGhpcy5fZGljdF9zZXQ9ITB9fWZ1bmN0aW9uIGsodCxlKXtjb25zdCByPW5ldyBVKGUpO2lmKHIucHVzaCh0LCEwKSxyLmVycil0aHJvdyByLm1zZ3x8bltyLmVycl07cmV0dXJuIHIucmVzdWx0fXJldHVybiBVLnByb3RvdHlwZS5wdXNoPWZ1bmN0aW9uKGUsbil7Y29uc3QgYT10aGlzLnN0cm0sZj10aGlzLm9wdGlvbnMuY2h1bmtTaXplO2xldCB1LGM7aWYodGhpcy5lbmRlZClyZXR1cm4hMTtmb3IoYz1uPT09fn5uP246ITA9PT1uP2g6cyxcInN0cmluZ1wiPT10eXBlb2YgZT9hLmlucHV0PXIuc3RyaW5nMmJ1ZihlKTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT1pLmNhbGwoZSk/YS5pbnB1dD1uZXcgVWludDhBcnJheShlKTphLmlucHV0PWUsYS5uZXh0X2luPTAsYS5hdmFpbF9pbj1hLmlucHV0Lmxlbmd0aDs7KWlmKDA9PT1hLmF2YWlsX291dCYmKGEub3V0cHV0PW5ldyBVaW50OEFycmF5KGYpLGEubmV4dF9vdXQ9MCxhLmF2YWlsX291dD1mKSwoYz09PWx8fGM9PT1vKSYmYS5hdmFpbF9vdXQ8PTYpdGhpcy5vbkRhdGEoYS5vdXRwdXQuc3ViYXJyYXkoMCxhLm5leHRfb3V0KSksYS5hdmFpbF9vdXQ9MDtlbHNle2lmKHU9dC5kZWZsYXRlKGEsYyksdT09PWQpcmV0dXJuIGEubmV4dF9vdXQ+MCYmdGhpcy5vbkRhdGEoYS5vdXRwdXQuc3ViYXJyYXkoMCxhLm5leHRfb3V0KSksdT10LmRlZmxhdGVFbmQodGhpcy5zdHJtKSx0aGlzLm9uRW5kKHUpLHRoaXMuZW5kZWQ9ITAsdT09PV87aWYoMCE9PWEuYXZhaWxfb3V0KXtpZihjPjAmJmEubmV4dF9vdXQ+MCl0aGlzLm9uRGF0YShhLm91dHB1dC5zdWJhcnJheSgwLGEubmV4dF9vdXQpKSxhLmF2YWlsX291dD0wO2Vsc2UgaWYoMD09PWEuYXZhaWxfaW4pYnJlYWt9ZWxzZSB0aGlzLm9uRGF0YShhLm91dHB1dCl9cmV0dXJuITB9LFUucHJvdG90eXBlLm9uRGF0YT1mdW5jdGlvbih0KXt0aGlzLmNodW5rcy5wdXNoKHQpfSxVLnByb3RvdHlwZS5vbkVuZD1mdW5jdGlvbih0KXt0PT09XyYmKHRoaXMucmVzdWx0PWUuZmxhdHRlbkNodW5rcyh0aGlzLmNodW5rcykpLHRoaXMuY2h1bmtzPVtdLHRoaXMuZXJyPXQsdGhpcy5tc2c9dGhpcy5zdHJtLm1zZ30sZi5EZWZsYXRlPVUsZi5kZWZsYXRlPWssZi5kZWZsYXRlUmF3PWZ1bmN0aW9uKHQsZSl7cmV0dXJuKGU9ZXx8e30pLnJhdz0hMCxrKHQsZSl9LGYuZ3ppcD1mdW5jdGlvbih0LGUpe3JldHVybihlPWV8fHt9KS5nemlwPSEwLGsodCxlKX0sZi5jb25zdGFudHM9ZygpLGZ9KCksaz17ZGVmbGF0ZTpVLmRlZmxhdGV9LEU9ZnVuY3Rpb24oKXt2YXIgdD17bmV4dFplcm86ZnVuY3Rpb24odCxlKXtmb3IoOzAhPXRbZV07KWUrKztyZXR1cm4gZX0scmVhZFVzaG9ydDpmdW5jdGlvbih0LGUpe3JldHVybiB0W2VdPDw4fHRbZSsxXX0sd3JpdGVVc2hvcnQ6ZnVuY3Rpb24odCxlLHIpe3RbZV09cj4+OCYyNTUsdFtlKzFdPTI1NSZyfSxyZWFkVWludDpmdW5jdGlvbih0LGUpe3JldHVybiAxNjc3NzIxNip0W2VdKyh0W2UrMV08PDE2fHRbZSsyXTw8OHx0W2UrM10pfSx3cml0ZVVpbnQ6ZnVuY3Rpb24odCxlLHIpe3RbZV09cj4+MjQmMjU1LHRbZSsxXT1yPj4xNiYyNTUsdFtlKzJdPXI+PjgmMjU1LHRbZSszXT0yNTUmcn0scmVhZEFTQ0lJOmZ1bmN0aW9uKHQsZSxyKXtmb3IodmFyIG49XCJcIixhPTA7YTxyO2ErKyluKz1TdHJpbmcuZnJvbUNoYXJDb2RlKHRbZSthXSk7cmV0dXJuIG59LHdyaXRlQVNDSUk6ZnVuY3Rpb24odCxlLHIpe2Zvcih2YXIgbj0wO248ci5sZW5ndGg7bisrKXRbZStuXT1yLmNoYXJDb2RlQXQobil9LHJlYWRCeXRlczpmdW5jdGlvbih0LGUscil7Zm9yKHZhciBuPVtdLGE9MDthPHI7YSsrKW4ucHVzaCh0W2UrYV0pO3JldHVybiBufSxwYWQ6ZnVuY3Rpb24odCl7cmV0dXJuIHQubGVuZ3RoPDI/XCIwXCIrdDp0fSxyZWFkVVRGODpmdW5jdGlvbihlLHIsbil7Zm9yKHZhciBhLGk9XCJcIixzPTA7czxuO3MrKylpKz1cIiVcIit0LnBhZChlW3Irc10udG9TdHJpbmcoMTYpKTt0cnl7YT1kZWNvZGVVUklDb21wb25lbnQoaSl9Y2F0Y2goYSl7cmV0dXJuIHQucmVhZEFTQ0lJKGUscixuKX1yZXR1cm4gYX19O2Z1bmN0aW9uIGUoZSxyLG4sYSl7dmFyIHM9cipuLGw9aShhKSxvPU1hdGguY2VpbChyKmwvOCksaD1uZXcgVWludDhBcnJheSg0KnMpLGY9bmV3IFVpbnQzMkFycmF5KGguYnVmZmVyKSxfPWEuY3R5cGUsZD1hLmRlcHRoLHU9dC5yZWFkVXNob3J0O2lmKDY9PV8pe3ZhciBjPXM8PDI7aWYoOD09ZClmb3IodmFyIGc9MDtnPGM7Zys9NCloW2ddPWVbZ10saFtnKzFdPWVbZysxXSxoW2crMl09ZVtnKzJdLGhbZyszXT1lW2crM107aWYoMTY9PWQpZm9yKGc9MDtnPGM7ZysrKWhbZ109ZVtnPDwxXX1lbHNlIGlmKDI9PV8pe3ZhciBwPWEudGFicy50Uk5TO2lmKG51bGw9PXApe2lmKDg9PWQpZm9yKGc9MDtnPHM7ZysrKXt2YXIgdz0zKmc7ZltnXT0yNTU8PDI0fGVbdysyXTw8MTZ8ZVt3KzFdPDw4fGVbd119aWYoMTY9PWQpZm9yKGc9MDtnPHM7ZysrKXt3PTYqZztmW2ddPTI1NTw8MjR8ZVt3KzRdPDwxNnxlW3crMl08PDh8ZVt3XX19ZWxzZXt2YXIgdj1wWzBdLGI9cFsxXSxtPXBbMl07aWYoOD09ZClmb3IoZz0wO2c8cztnKyspe3ZhciB5PWc8PDI7dz0zKmc7ZltnXT0yNTU8PDI0fGVbdysyXTw8MTZ8ZVt3KzFdPDw4fGVbd10sZVt3XT09diYmZVt3KzFdPT1iJiZlW3crMl09PW0mJihoW3krM109MCl9aWYoMTY9PWQpZm9yKGc9MDtnPHM7ZysrKXt5PWc8PDIsdz02Kmc7ZltnXT0yNTU8PDI0fGVbdys0XTw8MTZ8ZVt3KzJdPDw4fGVbd10sdShlLHcpPT12JiZ1KGUsdysyKT09YiYmdShlLHcrNCk9PW0mJihoW3krM109MCl9fX1lbHNlIGlmKDM9PV8pe3ZhciBBPWEudGFicy5QTFRFLHo9YS50YWJzLnRSTlMseD16P3oubGVuZ3RoOjA7aWYoMT09ZClmb3IodmFyIFU9MDtVPG47VSsrKXt2YXIgaz1VKm8sRT1VKnI7Zm9yKGc9MDtnPHI7ZysrKXt5PUUrZzw8Mjt2YXIgUj0zKihTPWVbaysoZz4+MyldPj43LSg3JmcpJjEpO2hbeV09QVtSXSxoW3krMV09QVtSKzFdLGhbeSsyXT1BW1IrMl0saFt5KzNdPVM8eD96W1NdOjI1NX19aWYoMj09ZClmb3IoVT0wO1U8bjtVKyspZm9yKGs9VSpvLEU9VSpyLGc9MDtnPHI7ZysrKXt5PUUrZzw8MixSPTMqKFM9ZVtrKyhnPj4yKV0+PjYtKCgzJmcpPDwxKSYzKTtoW3ldPUFbUl0saFt5KzFdPUFbUisxXSxoW3krMl09QVtSKzJdLGhbeSszXT1TPHg/eltTXToyNTV9aWYoND09ZClmb3IoVT0wO1U8bjtVKyspZm9yKGs9VSpvLEU9VSpyLGc9MDtnPHI7ZysrKXt5PUUrZzw8MixSPTMqKFM9ZVtrKyhnPj4xKV0+PjQtKCgxJmcpPDwyKSYxNSk7aFt5XT1BW1JdLGhbeSsxXT1BW1IrMV0saFt5KzJdPUFbUisyXSxoW3krM109Uzx4P3pbU106MjU1fWlmKDg9PWQpZm9yKGc9MDtnPHM7ZysrKXt2YXIgUzt5PWc8PDIsUj0zKihTPWVbZ10pO2hbeV09QVtSXSxoW3krMV09QVtSKzFdLGhbeSsyXT1BW1IrMl0saFt5KzNdPVM8eD96W1NdOjI1NX19ZWxzZSBpZig0PT1fKXtpZig4PT1kKWZvcihnPTA7ZzxzO2crKyl7eT1nPDwyO3ZhciBUPWVbWj1nPDwxXTtoW3ldPVQsaFt5KzFdPVQsaFt5KzJdPVQsaFt5KzNdPWVbWisxXX1pZigxNj09ZClmb3IoZz0wO2c8cztnKyspe3ZhciBaO3k9Zzw8MixUPWVbWj1nPDwyXTtoW3ldPVQsaFt5KzFdPVQsaFt5KzJdPVQsaFt5KzNdPWVbWisyXX19ZWxzZSBpZigwPT1fKWZvcih2PWEudGFicy50Uk5TP2EudGFicy50Uk5TOi0xLFU9MDtVPG47VSsrKXt2YXIgST1VKm8sQz1VKnI7aWYoMT09ZClmb3IodmFyIEw9MDtMPHI7TCsrKXt2YXIgTT0oVD0yNTUqKGVbSSsoTD4+PjMpXT4+PjctKDcmTCkmMSkpPT0yNTUqdj8wOjI1NTtmW0MrTF09TTw8MjR8VDw8MTZ8VDw8OHxUfWVsc2UgaWYoMj09ZClmb3IoTD0wO0w8cjtMKyspe009KFQ9ODUqKGVbSSsoTD4+PjIpXT4+PjYtKCgzJkwpPDwxKSYzKSk9PTg1KnY/MDoyNTU7ZltDK0xdPU08PDI0fFQ8PDE2fFQ8PDh8VH1lbHNlIGlmKDQ9PWQpZm9yKEw9MDtMPHI7TCsrKXtNPShUPTE3KihlW0krKEw+Pj4xKV0+Pj40LSgoMSZMKTw8MikmMTUpKT09MTcqdj8wOjI1NTtmW0MrTF09TTw8MjR8VDw8MTZ8VDw8OHxUfWVsc2UgaWYoOD09ZClmb3IoTD0wO0w8cjtMKyspe009KFQ9ZVtJK0xdKT09dj8wOjI1NTtmW0MrTF09TTw8MjR8VDw8MTZ8VDw8OHxUfWVsc2UgaWYoMTY9PWQpZm9yKEw9MDtMPHI7TCsrKXtUPWVbSSsoTDw8MSldLE09dShlLEkrKEw8PDEpKT09dj8wOjI1NTtmW0MrTF09TTw8MjR8VDw8MTZ8VDw8OHxUfX1yZXR1cm4gaH1mdW5jdGlvbiByKHQsZSxyLGwpe3ZhciBvPWkodCksaD1NYXRoLmNlaWwocipvLzgpLGY9bmV3IFVpbnQ4QXJyYXkoKGgrMSt0LmludGVybGFjZSkqbCk7cmV0dXJuIGU9dC50YWJzLkNnQkk/YShlLGYpOm4oZSxmKSwwPT10LmludGVybGFjZT9lPXMoZSx0LDAscixsKToxPT10LmludGVybGFjZSYmKGU9ZnVuY3Rpb24odCxlKXt2YXIgcj1lLndpZHRoLG49ZS5oZWlnaHQsYT1pKGUpLGw9YT4+MyxvPU1hdGguY2VpbChyKmEvOCksaD1uZXcgVWludDhBcnJheShuKm8pLGY9MCxfPVswLDAsNCwwLDIsMCwxXSxkPVswLDQsMCwyLDAsMSwwXSx1PVs4LDgsOCw0LDQsMiwyXSxjPVs4LDgsNCw0LDIsMiwxXSxnPTA7Zm9yKDtnPDc7KXtmb3IodmFyIHA9dVtnXSx3PWNbZ10sdj0wLGI9MCxtPV9bZ107bTxuOyltKz1wLGIrKztmb3IodmFyIHk9ZFtnXTt5PHI7KXkrPXcsdisrO3ZhciBBPU1hdGguY2VpbCh2KmEvOCk7cyh0LGUsZix2LGIpO2Zvcih2YXIgej0wLHg9X1tnXTt4PG47KXtmb3IodmFyIFU9ZFtnXSxrPWYreipBPDwzO1U8cjspe3ZhciBFO2lmKDE9PWEpRT0oRT10W2s+PjNdKT4+Ny0oNyZrKSYxLGhbeCpvKyhVPj4zKV18PUU8PDctKDcmVSk7aWYoMj09YSlFPShFPXRbaz4+M10pPj42LSg3JmspJjMsaFt4Km8rKFU+PjIpXXw9RTw8Ni0oKDMmVSk8PDEpO2lmKDQ9PWEpRT0oRT10W2s+PjNdKT4+NC0oNyZrKSYxNSxoW3gqbysoVT4+MSldfD1FPDw0LSgoMSZVKTw8Mik7aWYoYT49OClmb3IodmFyIFI9eCpvK1UqbCxTPTA7UzxsO1MrKyloW1IrU109dFsoaz4+MykrU107ays9YSxVKz13fXorKyx4Kz1wfXYqYiE9MCYmKGYrPWIqKDErQSkpLGcrPTF9cmV0dXJuIGh9KGUsdCkpLGV9ZnVuY3Rpb24gbih0LGUpe3JldHVybiBhKG5ldyBVaW50OEFycmF5KHQuYnVmZmVyLDIsdC5sZW5ndGgtNiksZSl9dmFyIGE9ZnVuY3Rpb24oKXt2YXIgdCxlLHI9KHQ9VWludDE2QXJyYXksZT1VaW50MzJBcnJheSx7bTpuZXcgdCgxNiksdjpuZXcgdCgxNiksZDpbMTYsMTcsMTgsMCw4LDcsOSw2LDEwLDUsMTEsNCwxMiwzLDEzLDIsMTQsMSwxNV0sbzpbMyw0LDUsNiw3LDgsOSwxMCwxMSwxMywxNSwxNywxOSwyMywyNywzMSwzNSw0Myw1MSw1OSw2Nyw4Myw5OSwxMTUsMTMxLDE2MywxOTUsMjI3LDI1OCw5OTksOTk5LDk5OV0sejpbMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMiwyLDIsMiwzLDMsMywzLDQsNCw0LDQsNSw1LDUsNSwwLDAsMCwwXSxCOm5ldyB0KDMyKSxwOlsxLDIsMyw0LDUsNyw5LDEzLDE3LDI1LDMzLDQ5LDY1LDk3LDEyOSwxOTMsMjU3LDM4NSw1MTMsNzY5LDEwMjUsMTUzNywyMDQ5LDMwNzMsNDA5Nyw2MTQ1LDgxOTMsMTIyODksMTYzODUsMjQ1NzcsNjU1MzUsNjU1MzVdLHc6WzAsMCwwLDAsMSwxLDIsMiwzLDMsNCw0LDUsNSw2LDYsNyw3LDgsOCw5LDksMTAsMTAsMTEsMTEsMTIsMTIsMTMsMTMsMCwwXSxoOm5ldyBlKDMyKSxnOm5ldyB0KDUxMiksczpbXSxBOm5ldyB0KDMyKSx0OltdLGs6bmV3IHQoMzI3NjgpLGM6W10sYTpbXSxuOm5ldyB0KDMyNzY4KSxlOltdLEM6bmV3IHQoNTEyKSxiOltdLGk6bmV3IHQoMzI3NjgpLHI6bmV3IGUoMjg2KSxmOm5ldyBlKDMwKSxsOm5ldyBlKDE5KSx1Om5ldyBlKDE1ZTMpLHE6bmV3IHQoNjU1MzYpLGo6bmV3IHQoMzI3NjgpfSk7ZnVuY3Rpb24gbih0LGUpe2Zvcih2YXIgbixhLGkscyxsPXQubGVuZ3RoLG89ci52LGg9MDtoPD1lO2grKylvW2hdPTA7Zm9yKGg9MTtoPGw7aCs9MilvW3RbaF1dKys7dmFyIGY9ci5tO2ZvcihuPTAsb1swXT0wLGE9MTthPD1lO2ErKyluPW4rb1thLTFdPDwxLGZbYV09bjtmb3IoaT0wO2k8bDtpKz0yKTAhPShzPXRbaSsxXSkmJih0W2ldPWZbc10sZltzXSsrKX1mdW5jdGlvbiBhKHQsZSxuKXtmb3IodmFyIGE9dC5sZW5ndGgsaT1yLmkscz0wO3M8YTtzKz0yKWlmKDAhPXRbcysxXSlmb3IodmFyIGw9cz4+MSxvPXRbcysxXSxoPWw8PDR8byxmPWUtbyxfPXRbc108PGYsZD1fKygxPDxmKTtfIT1kOyl7bltpW19dPj4+MTUtZV09aCxfKyt9fWZ1bmN0aW9uIGkodCxlKXtmb3IodmFyIG49ci5pLGE9MTUtZSxpPTA7aTx0Lmxlbmd0aDtpKz0yKXt2YXIgcz10W2ldPDxlLXRbaSsxXTt0W2ldPW5bc10+Pj5hfX1mdW5jdGlvbiBzKHQsZSxyKXtyZXR1cm4odFtlPj4+M118dFsxKyhlPj4+MyldPDw4KT4+Pig3JmUpJigxPDxyKS0xfWZ1bmN0aW9uIGwodCxlLHIpe3JldHVybih0W2U+Pj4zXXx0WzErKGU+Pj4zKV08PDh8dFsyKyhlPj4+MyldPDwxNik+Pj4oNyZlKSYoMTw8ciktMX1mdW5jdGlvbiBvKHQsZSl7cmV0dXJuKHRbZT4+PjNdfHRbMSsoZT4+PjMpXTw8OHx0WzIrKGU+Pj4zKV08PDE2KT4+Pig3JmUpfWZ1bmN0aW9uIGgodCxlKXt2YXIgcj10Lmxlbmd0aDtpZihlPD1yKXJldHVybiB0O3ZhciBuPW5ldyBVaW50OEFycmF5KE1hdGgubWF4KHI8PDEsZSkpO3JldHVybiBuLnNldCh0LDApLG59ZnVuY3Rpb24gZih0LGUscixuLGEsaSl7Zm9yKHZhciBsPTA7bDxyOyl7dmFyIGg9dFtvKG4sYSkmZV07YSs9MTUmaDt2YXIgZj1oPj4+NDtpZihmPD0xNSlpW2xdPWYsbCsrO2Vsc2V7dmFyIF89MCxkPTA7MTY9PWY/KGQ9MytzKG4sYSwyKSxhKz0yLF89aVtsLTFdKToxNz09Zj8oZD0zK3MobixhLDMpLGErPTMpOjE4PT1mJiYoZD0xMStzKG4sYSw3KSxhKz03KTtmb3IodmFyIHU9bCtkO2w8dTspaVtsXT1fLGwrK319cmV0dXJuIGF9ZnVuY3Rpb24gXyh0LGUscixuKXtmb3IodmFyIGE9MCxpPTAscz1uLmxlbmd0aD4+PjE7aTxyOyl7dmFyIGw9dFtpK2VdO25baTw8MV09MCxuWzErKGk8PDEpXT1sLGw+YSYmKGE9bCksaSsrfWZvcig7aTxzOyluW2k8PDFdPTAsblsxKyhpPDwxKV09MCxpKys7cmV0dXJuIGF9cmV0dXJuIGZ1bmN0aW9uKCl7Zm9yKHZhciB0PTA7dDwzMjc2ODt0Kyspe3ZhciBlPXQ7ZT0oNDI3ODI1NTM2MCYoZT0oNDA0MjMyMjE2MCYoZT0oMzQzNTk3MzgzNiYoZT0oMjg2MzMxMTUzMCZlKT4+PjF8KDE0MzE2NTU3NjUmZSk8PDEpKT4+PjJ8KDg1ODk5MzQ1OSZlKTw8MikpPj4+NHwoMjUyNjQ1MTM1JmUpPDw0KSk+Pj44fCgxNjcxMTkzNSZlKTw8OCxyLmlbdF09KGU+Pj4xNnxlPDwxNik+Pj4xN31mdW5jdGlvbiBzKHQsZSxyKXtmb3IoOzAhPWUtLTspdC5wdXNoKDAscil9Zm9yKHQ9MDt0PDMyO3QrKylyLkJbdF09ci5vW3RdPDwzfHIuelt0XSxyLmhbdF09ci5wW3RdPDw0fHIud1t0XTtzKHIucywxNDQsOCkscyhyLnMsMTEyLDkpLHMoci5zLDI0LDcpLHMoci5zLDgsOCksbihyLnMsOSksYShyLnMsOSxyLmcpLGkoci5zLDkpLHMoci50LDMyLDUpLG4oci50LDUpLGEoci50LDUsci5BKSxpKHIudCw1KSxzKHIuYiwxOSwwKSxzKHIuYywyODYsMCkscyhyLmUsMzAsMCkscyhyLmEsMzIwLDApfSgpLGZ1bmN0aW9uKHQsZSl7dmFyIGksZCx1PVVpbnQ4QXJyYXksYz0wLGc9MCxwPTAsdz0wLHY9MCxiPTAsbT0wLHk9MCxBPTA7aWYoMz09dFswXSYmMD09dFsxXSlyZXR1cm4gZXx8bmV3IHUoMCk7dmFyIHo9bnVsbD09ZTtmb3IoeiYmKGU9bmV3IHUodC5sZW5ndGg+Pj4yPDwzKSk7MD09YzspaWYoYz1sKHQsQSwxKSxnPWwodCxBKzEsMiksQSs9MywwIT1nKXtpZih6JiYoZT1oKGUseSsoMTw8MTcpKSksMT09ZyYmKGk9ci5nLGQ9ci5BLGI9NTExLG09MzEpLDI9PWcpe3A9cyh0LEEsNSkrMjU3LHc9cyh0LEErNSw1KSsxLHY9cyh0LEErMTAsNCkrNCxBKz0xNDtmb3IodmFyIHg9MSxVPTA7VTwzODtVKz0yKXIuYltVXT0wLHIuYltVKzFdPTA7Zm9yKFU9MDtVPHY7VSsrKXt2YXIgaz1zKHQsQSszKlUsMyk7ci5iWzErKHIuZFtVXTw8MSldPWssaz54JiYoeD1rKX1BKz0zKnYsbihyLmIseCksYShyLmIseCxyLkMpLGk9ci5rLGQ9ci5uLEE9ZihyLkMsKDE8PHgpLTEscCt3LHQsQSxyLmEpO3ZhciBFPV8oci5hLDAscCxyLmMpO2I9KDE8PEUpLTE7dmFyIFI9XyhyLmEscCx3LHIuZSk7bT0oMTw8UiktMSxuKHIuYyxFKSxhKHIuYyxFLGkpLG4oci5lLFIpLGEoci5lLFIsZCl9Zm9yKDs7KXt2YXIgUz1pW28odCxBKSZiXTtBKz0xNSZTO3ZhciBUPVM+Pj40O2lmKFQ+Pj44PT0wKWVbeSsrXT1UO2Vsc2V7aWYoMjU2PT1UKWJyZWFrO3ZhciBaPXkrVC0yNTQ7aWYoVD4yNjQpe3ZhciBJPXIuQltULTI1N107Wj15KyhJPj4+Mykrcyh0LEEsNyZJKSxBKz03Jkl9dmFyIEM9ZFtvKHQsQSkmbV07QSs9MTUmQzt2YXIgTD1DPj4+NCxNPXIuaFtMXSxOPShNPj4+NCkrbCh0LEEsMTUmTSk7Zm9yKEErPTE1Jk0seiYmKGU9aChlLHkrKDE8PDE3KSkpO3k8WjspZVt5XT1lW3krKy1OXSxlW3ldPWVbeSsrLU5dLGVbeV09ZVt5KystTl0sZVt5XT1lW3krKy1OXTt5PVp9fX1lbHNlezcmQSYmKEErPTgtKDcmQSkpO3ZhciBEPTQrKEE+Pj4zKSxGPXRbRC00XXx0W0QtM108PDg7eiYmKGU9aChlLHkrRikpLGUuc2V0KG5ldyB1KHQuYnVmZmVyLHQuYnl0ZU9mZnNldCtELEYpLHkpLEE9RCtGPDwzLHkrPUZ9cmV0dXJuIGUubGVuZ3RoPT15P2U6ZS5zbGljZSgwLHkpfX0oKTtmdW5jdGlvbiBpKHQpe3JldHVyblsxLG51bGwsMywxLDIsbnVsbCw0XVt0LmN0eXBlXSp0LmRlcHRofWZ1bmN0aW9uIHModCxlLHIsbixhKXt2YXIgcz1pKGUpLG89TWF0aC5jZWlsKG4qcy84KTtzPU1hdGguY2VpbChzLzgpO3ZhciBoLGYsXz10W3JdLGQ9MDtpZihfPjEmJih0W3JdPVswLDAsMV1bXy0yXSksMz09Xylmb3IoZD1zO2Q8bztkKyspdFtkKzFdPXRbZCsxXSsodFtkKzEtc10+Pj4xKSYyNTU7Zm9yKHZhciB1PTA7dTxhO3UrKylpZihkPTAsMD09KF89dFsoZj0oaD1yK3UqbykrdSsxKS0xXSkpZm9yKDtkPG87ZCsrKXRbaCtkXT10W2YrZF07ZWxzZSBpZigxPT1fKXtmb3IoO2Q8cztkKyspdFtoK2RdPXRbZitkXTtmb3IoO2Q8bztkKyspdFtoK2RdPXRbZitkXSt0W2grZC1zXX1lbHNlIGlmKDI9PV8pZm9yKDtkPG87ZCsrKXRbaCtkXT10W2YrZF0rdFtoK2Qtb107ZWxzZSBpZigzPT1fKXtmb3IoO2Q8cztkKyspdFtoK2RdPXRbZitkXSsodFtoK2Qtb10+Pj4xKTtmb3IoO2Q8bztkKyspdFtoK2RdPXRbZitkXSsodFtoK2Qtb10rdFtoK2Qtc10+Pj4xKX1lbHNle2Zvcig7ZDxzO2QrKyl0W2grZF09dFtmK2RdK2woMCx0W2grZC1vXSwwKTtmb3IoO2Q8bztkKyspdFtoK2RdPXRbZitkXStsKHRbaCtkLXNdLHRbaCtkLW9dLHRbaCtkLXMtb10pfXJldHVybiB0fWZ1bmN0aW9uIGwodCxlLHIpe3ZhciBuPXQrZS1yLGE9bi10LGk9bi1lLHM9bi1yO3JldHVybiBhKmE8PWkqaSYmYSphPD1zKnM/dDppKmk8PXMqcz9lOnJ9ZnVuY3Rpb24gbyhlLHIsbil7bi53aWR0aD10LnJlYWRVaW50KGUscikscis9NCxuLmhlaWdodD10LnJlYWRVaW50KGUscikscis9NCxuLmRlcHRoPWVbcl0scisrLG4uY3R5cGU9ZVtyXSxyKyssbi5jb21wcmVzcz1lW3JdLHIrKyxuLmZpbHRlcj1lW3JdLHIrKyxuLmludGVybGFjZT1lW3JdLHIrK31mdW5jdGlvbiBoKHQsZSxyLG4sYSxpLHMsbCxvKXtmb3IodmFyIGg9TWF0aC5taW4oZSxhKSxmPU1hdGgubWluKHIsaSksXz0wLGQ9MCx1PTA7dTxmO3UrKylmb3IodmFyIGM9MDtjPGg7YysrKWlmKHM+PTAmJmw+PTA/KF89dSplK2M8PDIsZD0obCt1KSphK3MrYzw8Mik6KF89KC1sK3UpKmUtcytjPDwyLGQ9dSphK2M8PDIpLDA9PW8pbltkXT10W19dLG5bZCsxXT10W18rMV0sbltkKzJdPXRbXysyXSxuW2QrM109dFtfKzNdO2Vsc2UgaWYoMT09byl7dmFyIGc9dFtfKzNdKigxLzI1NSkscD10W19dKmcsdz10W18rMV0qZyx2PXRbXysyXSpnLGI9bltkKzNdKigxLzI1NSksbT1uW2RdKmIseT1uW2QrMV0qYixBPW5bZCsyXSpiLHo9MS1nLHg9ZytiKnosVT0wPT14PzA6MS94O25bZCszXT0yNTUqeCxuW2QrMF09KHArbSp6KSpVLG5bZCsxXT0odyt5KnopKlUsbltkKzJdPSh2K0EqeikqVX1lbHNlIGlmKDI9PW8pe2c9dFtfKzNdLHA9dFtfXSx3PXRbXysxXSx2PXRbXysyXSxiPW5bZCszXSxtPW5bZF0seT1uW2QrMV0sQT1uW2QrMl07Zz09YiYmcD09bSYmdz09eSYmdj09QT8obltkXT0wLG5bZCsxXT0wLG5bZCsyXT0wLG5bZCszXT0wKToobltkXT1wLG5bZCsxXT13LG5bZCsyXT12LG5bZCszXT1nKX1lbHNlIGlmKDM9PW8pe2c9dFtfKzNdLHA9dFtfXSx3PXRbXysxXSx2PXRbXysyXSxiPW5bZCszXSxtPW5bZF0seT1uW2QrMV0sQT1uW2QrMl07aWYoZz09YiYmcD09bSYmdz09eSYmdj09QSljb250aW51ZTtpZihnPDIyMCYmYj4yMClyZXR1cm4hMX1yZXR1cm4hMH1yZXR1cm57ZGVjb2RlOmZ1bmN0aW9uKGUpe2Zvcih2YXIgaSxzPW5ldyBVaW50OEFycmF5KGUpLGw9OCxoPXQsZj1oLnJlYWRVc2hvcnQsXz1oLnJlYWRVaW50LGQ9e3RhYnM6e30sZnJhbWVzOltdfSx1PW5ldyBVaW50OEFycmF5KHMubGVuZ3RoKSxjPTAsZz0wLHA9WzEzNyw4MCw3OCw3MSwxMywxMCwyNiwxMF0sdz0wO3c8ODt3KyspaWYoc1t3XSE9cFt3XSl0aHJvd1wiVGhlIGlucHV0IGlzIG5vdCBhIFBORyBmaWxlIVwiO2Zvcig7bDxzLmxlbmd0aDspe3ZhciB2PWgucmVhZFVpbnQocyxsKTtsKz00O3ZhciBiPWgucmVhZEFTQ0lJKHMsbCw0KTtpZihsKz00LFwiSUhEUlwiPT1iKW8ocyxsLGQpO2Vsc2UgaWYoXCJpQ0NQXCI9PWIpe2Zvcih2YXIgbT1sOzAhPXNbbV07KW0rKztoLnJlYWRBU0NJSShzLGwsbS1sKSxzW20rMV07dmFyIHk9cy5zbGljZShtKzIsbCt2KSxBPW51bGw7dHJ5e0E9bih5KX1jYXRjaCh0KXtBPWEoeSl9ZC50YWJzW2JdPUF9ZWxzZSBpZihcIkNnQklcIj09YilkLnRhYnNbYl09cy5zbGljZShsLGwrNCk7ZWxzZSBpZihcIklEQVRcIj09Yil7Zm9yKHc9MDt3PHY7dysrKXVbYyt3XT1zW2wrd107Yys9dn1lbHNlIGlmKFwiYWNUTFwiPT1iKWQudGFic1tiXT17bnVtX2ZyYW1lczpfKHMsbCksbnVtX3BsYXlzOl8ocyxsKzQpfSxpPW5ldyBVaW50OEFycmF5KHMubGVuZ3RoKTtlbHNlIGlmKFwiZmNUTFwiPT1iKXt2YXIgejtpZigwIT1nKSh6PWQuZnJhbWVzW2QuZnJhbWVzLmxlbmd0aC0xXSkuZGF0YT1yKGQsaS5zbGljZSgwLGcpLHoucmVjdC53aWR0aCx6LnJlY3QuaGVpZ2h0KSxnPTA7dmFyIHg9e3g6XyhzLGwrMTIpLHk6XyhzLGwrMTYpLHdpZHRoOl8ocyxsKzQpLGhlaWdodDpfKHMsbCs4KX0sVT1mKHMsbCsyMik7VT1mKHMsbCsyMCkvKDA9PVU/MTAwOlUpO3ZhciBrPXtyZWN0OngsZGVsYXk6TWF0aC5yb3VuZCgxZTMqVSksZGlzcG9zZTpzW2wrMjRdLGJsZW5kOnNbbCsyNV19O2QuZnJhbWVzLnB1c2goayl9ZWxzZSBpZihcImZkQVRcIj09Yil7Zm9yKHc9MDt3PHYtNDt3KyspaVtnK3ddPXNbbCt3KzRdO2crPXYtNH1lbHNlIGlmKFwicEhZc1wiPT1iKWQudGFic1tiXT1baC5yZWFkVWludChzLGwpLGgucmVhZFVpbnQocyxsKzQpLHNbbCs4XV07ZWxzZSBpZihcImNIUk1cIj09Yil7ZC50YWJzW2JdPVtdO2Zvcih3PTA7dzw4O3crKylkLnRhYnNbYl0ucHVzaChoLnJlYWRVaW50KHMsbCs0KncpKX1lbHNlIGlmKFwidEVYdFwiPT1ifHxcInpUWHRcIj09Yil7bnVsbD09ZC50YWJzW2JdJiYoZC50YWJzW2JdPXt9KTt2YXIgRT1oLm5leHRaZXJvKHMsbCksUj1oLnJlYWRBU0NJSShzLGwsRS1sKSxTPWwrdi1FLTE7aWYoXCJ0RVh0XCI9PWIpST1oLnJlYWRBU0NJSShzLEUrMSxTKTtlbHNle3ZhciBUPW4ocy5zbGljZShFKzIsRSsyK1MpKTtJPWgucmVhZFVURjgoVCwwLFQubGVuZ3RoKX1kLnRhYnNbYl1bUl09SX1lbHNlIGlmKFwiaVRYdFwiPT1iKXtudWxsPT1kLnRhYnNbYl0mJihkLnRhYnNbYl09e30pO0U9MCxtPWw7RT1oLm5leHRaZXJvKHMsbSk7Uj1oLnJlYWRBU0NJSShzLG0sRS1tKTt2YXIgWj1zW209RSsxXTtzW20rMV0sbSs9MixFPWgubmV4dFplcm8ocyxtKSxoLnJlYWRBU0NJSShzLG0sRS1tKSxtPUUrMSxFPWgubmV4dFplcm8ocyxtKSxoLnJlYWRVVEY4KHMsbSxFLW0pO3ZhciBJO1M9di0oKG09RSsxKS1sKTtpZigwPT1aKUk9aC5yZWFkVVRGOChzLG0sUyk7ZWxzZXtUPW4ocy5zbGljZShtLG0rUykpO0k9aC5yZWFkVVRGOChULDAsVC5sZW5ndGgpfWQudGFic1tiXVtSXT1JfWVsc2UgaWYoXCJQTFRFXCI9PWIpZC50YWJzW2JdPWgucmVhZEJ5dGVzKHMsbCx2KTtlbHNlIGlmKFwiaElTVFwiPT1iKXt2YXIgQz1kLnRhYnMuUExURS5sZW5ndGgvMztkLnRhYnNbYl09W107Zm9yKHc9MDt3PEM7dysrKWQudGFic1tiXS5wdXNoKGYocyxsKzIqdykpfWVsc2UgaWYoXCJ0Uk5TXCI9PWIpMz09ZC5jdHlwZT9kLnRhYnNbYl09aC5yZWFkQnl0ZXMocyxsLHYpOjA9PWQuY3R5cGU/ZC50YWJzW2JdPWYocyxsKToyPT1kLmN0eXBlJiYoZC50YWJzW2JdPVtmKHMsbCksZihzLGwrMiksZihzLGwrNCldKTtlbHNlIGlmKFwiZ0FNQVwiPT1iKWQudGFic1tiXT1oLnJlYWRVaW50KHMsbCkvMWU1O2Vsc2UgaWYoXCJzUkdCXCI9PWIpZC50YWJzW2JdPXNbbF07ZWxzZSBpZihcImJLR0RcIj09YikwPT1kLmN0eXBlfHw0PT1kLmN0eXBlP2QudGFic1tiXT1bZihzLGwpXToyPT1kLmN0eXBlfHw2PT1kLmN0eXBlP2QudGFic1tiXT1bZihzLGwpLGYocyxsKzIpLGYocyxsKzQpXTozPT1kLmN0eXBlJiYoZC50YWJzW2JdPXNbbF0pO2Vsc2UgaWYoXCJJRU5EXCI9PWIpYnJlYWs7bCs9dixoLnJlYWRVaW50KHMsbCksbCs9NH1yZXR1cm4gMCE9ZyYmKCh6PWQuZnJhbWVzW2QuZnJhbWVzLmxlbmd0aC0xXSkuZGF0YT1yKGQsaS5zbGljZSgwLGcpLHoucmVjdC53aWR0aCx6LnJlY3QuaGVpZ2h0KSksZC5kYXRhPXIoZCx1LGQud2lkdGgsZC5oZWlnaHQpLGRlbGV0ZSBkLmNvbXByZXNzLGRlbGV0ZSBkLmludGVybGFjZSxkZWxldGUgZC5maWx0ZXIsZH0sdG9SR0JBODpmdW5jdGlvbih0KXt2YXIgcj10LndpZHRoLG49dC5oZWlnaHQ7aWYobnVsbD09dC50YWJzLmFjVEwpcmV0dXJuW2UodC5kYXRhLHIsbix0KS5idWZmZXJdO3ZhciBhPVtdO251bGw9PXQuZnJhbWVzWzBdLmRhdGEmJih0LmZyYW1lc1swXS5kYXRhPXQuZGF0YSk7Zm9yKHZhciBpPXIqbio0LHM9bmV3IFVpbnQ4QXJyYXkoaSksbD1uZXcgVWludDhBcnJheShpKSxvPW5ldyBVaW50OEFycmF5KGkpLGY9MDtmPHQuZnJhbWVzLmxlbmd0aDtmKyspe3ZhciBfPXQuZnJhbWVzW2ZdLGQ9Xy5yZWN0LngsdT1fLnJlY3QueSxjPV8ucmVjdC53aWR0aCxnPV8ucmVjdC5oZWlnaHQscD1lKF8uZGF0YSxjLGcsdCk7aWYoMCE9Zilmb3IodmFyIHc9MDt3PGk7dysrKW9bd109c1t3XTtpZigwPT1fLmJsZW5kP2gocCxjLGcscyxyLG4sZCx1LDApOjE9PV8uYmxlbmQmJmgocCxjLGcscyxyLG4sZCx1LDEpLGEucHVzaChzLmJ1ZmZlci5zbGljZSgwKSksMD09Xy5kaXNwb3NlKTtlbHNlIGlmKDE9PV8uZGlzcG9zZSloKGwsYyxnLHMscixuLGQsdSwwKTtlbHNlIGlmKDI9PV8uZGlzcG9zZSlmb3Iodz0wO3c8aTt3Kyspc1t3XT1vW3ddfXJldHVybiBhfSxfcGFldGg6bCxfY29weVRpbGU6aCxfYmluOnR9fSgpO3JldHVybiBmdW5jdGlvbigpe3ZhciB0PUUuX2NvcHlUaWxlLGU9RS5fYmluLHI9RS5fcGFldGgsbj17dGFibGU6ZnVuY3Rpb24oKXtmb3IodmFyIHQ9bmV3IFVpbnQzMkFycmF5KDI1NiksZT0wO2U8MjU2O2UrKyl7Zm9yKHZhciByPWUsbj0wO248ODtuKyspMSZyP3I9Mzk4ODI5MjM4NF5yPj4+MTpyPj4+PTE7dFtlXT1yfXJldHVybiB0fSgpLHVwZGF0ZTpmdW5jdGlvbih0LGUscixhKXtmb3IodmFyIGk9MDtpPGE7aSsrKXQ9bi50YWJsZVsyNTUmKHReZVtyK2ldKV1edD4+Pjg7cmV0dXJuIHR9LGNyYzpmdW5jdGlvbih0LGUscil7cmV0dXJuIDQyOTQ5NjcyOTVebi51cGRhdGUoNDI5NDk2NzI5NSx0LGUscil9fTtmdW5jdGlvbiBhKHQsZSxyLG4pe2Vbcl0rPXRbMF0qbj4+NCxlW3IrMV0rPXRbMV0qbj4+NCxlW3IrMl0rPXRbMl0qbj4+NCxlW3IrM10rPXRbM10qbj4+NH1mdW5jdGlvbiBpKHQpe3JldHVybiBNYXRoLm1heCgwLE1hdGgubWluKDI1NSx0KSl9ZnVuY3Rpb24gcyh0LGUpe3ZhciByPXRbMF0tZVswXSxuPXRbMV0tZVsxXSxhPXRbMl0tZVsyXSxpPXRbM10tZVszXTtyZXR1cm4gcipyK24qbithKmEraSppfWZ1bmN0aW9uIGwodCxlLHIsbixsLG8saCl7bnVsbD09aCYmKGg9MSk7Zm9yKHZhciBmPW4ubGVuZ3RoLF89W10sZD0wO2Q8ZjtkKyspe3ZhciB1PW5bZF07Xy5wdXNoKFt1Pj4+MCYyNTUsdT4+PjgmMjU1LHU+Pj4xNiYyNTUsdT4+PjI0JjI1NV0pfWZvcihkPTA7ZDxmO2QrKylmb3IodmFyIGM9NDI5NDk2NzI5NSxnPTAscD0wO3A8ZjtwKyspe3ZhciB3PXMoX1tkXSxfW3BdKTtwIT1kJiZ3PGMmJihjPXcsZz1wKX12YXIgdj1uZXcgVWludDMyQXJyYXkobC5idWZmZXIpLGI9bmV3IEludDE2QXJyYXkoZSpyKjQpLG09WzAsOCwyLDEwLDEyLDQsMTQsNiwzLDExLDEsOSwxNSw3LDEzLDVdO2ZvcihkPTA7ZDxtLmxlbmd0aDtkKyspbVtkXT0yNTUqKChtW2RdKy41KS8xNi0uNSk7Zm9yKHZhciB5PTA7eTxyO3krKylmb3IodmFyIEE9MDtBPGU7QSsrKXt2YXIgejtkPTQqKHkqZStBKTtpZigyIT1oKXo9W2kodFtkXStiW2RdKSxpKHRbZCsxXStiW2QrMV0pLGkodFtkKzJdK2JbZCsyXSksaSh0W2QrM10rYltkKzNdKV07ZWxzZXt3PW1bNCooMyZ5KSsoMyZBKV07ej1baSh0W2RdK3cpLGkodFtkKzFdK3cpLGkodFtkKzJdK3cpLGkodFtkKzNdK3cpXX1nPTA7dmFyIHg9MTY3NzcyMTU7Zm9yKHA9MDtwPGY7cCsrKXt2YXIgVT1zKHosX1twXSk7VTx4JiYoeD1VLGc9cCl9dmFyIGs9X1tnXSxFPVt6WzBdLWtbMF0selsxXS1rWzFdLHpbMl0ta1syXSx6WzNdLWtbM11dOzE9PWgmJihBIT1lLTEmJmEoRSxiLGQrNCw3KSx5IT1yLTEmJigwIT1BJiZhKEUsYixkKzQqZS00LDMpLGEoRSxiLGQrNCplLDUpLEEhPWUtMSYmYShFLGIsZCs0KmUrNCwxKSkpLG9bZD4+Ml09Zyx2W2Q+PjJdPW5bZ119fWZ1bmN0aW9uIG8odCxyLGEsaSxzKXtudWxsPT1zJiYocz17fSk7dmFyIGwsbz1uLmNyYyxoPWUud3JpdGVVaW50LGY9ZS53cml0ZVVzaG9ydCxfPWUud3JpdGVBU0NJSSxkPTgsdT10LmZyYW1lcy5sZW5ndGg+MSxjPSExLGc9MzMrKHU/MjA6MCk7aWYobnVsbCE9cy5zUkdCJiYoZys9MTMpLG51bGwhPXMucEhZcyYmKGcrPTIxKSxudWxsIT1zLmlDQ1AmJihnKz0yMSsobD1rLmRlZmxhdGUocy5pQ0NQKSkubGVuZ3RoKzQpLDM9PXQuY3R5cGUpe2Zvcih2YXIgcD10LnBsdGUubGVuZ3RoLHc9MDt3PHA7dysrKXQucGx0ZVt3XT4+PjI0IT0yNTUmJihjPSEwKTtnKz04KzMqcCs0KyhjPzgrMSpwKzQ6MCl9Zm9yKHZhciB2PTA7djx0LmZyYW1lcy5sZW5ndGg7disrKXt1JiYoZys9MzgpLGcrPShTPXQuZnJhbWVzW3ZdKS5jaW1nLmxlbmd0aCsxMiwwIT12JiYoZys9NCl9Zys9MTI7dmFyIGI9bmV3IFVpbnQ4QXJyYXkoZyksbT1bMTM3LDgwLDc4LDcxLDEzLDEwLDI2LDEwXTtmb3Iodz0wO3c8ODt3KyspYlt3XT1tW3ddO2lmKGgoYixkLDEzKSxfKGIsZCs9NCxcIklIRFJcIiksaChiLGQrPTQsciksaChiLGQrPTQsYSksYltkKz00XT10LmRlcHRoLGJbKytkXT10LmN0eXBlLGJbKytkXT0wLGJbKytkXT0wLGJbKytkXT0wLGgoYiwrK2QsbyhiLGQtMTcsMTcpKSxkKz00LG51bGwhPXMuc1JHQiYmKGgoYixkLDEpLF8oYixkKz00LFwic1JHQlwiKSxiW2QrPTRdPXMuc1JHQixoKGIsKytkLG8oYixkLTUsNSkpLGQrPTQpLG51bGwhPXMuaUNDUCl7dmFyIHk9MTMrbC5sZW5ndGg7aChiLGQseSksXyhiLGQrPTQsXCJpQ0NQXCIpLF8oYixkKz00LFwiSUNDIHByb2ZpbGVcIiksZCs9MTEsZCs9MixiLnNldChsLGQpLGgoYixkKz1sLmxlbmd0aCxvKGIsZC0oeSs0KSx5KzQpKSxkKz00fWlmKG51bGwhPXMucEhZcyYmKGgoYixkLDkpLF8oYixkKz00LFwicEhZc1wiKSxoKGIsZCs9NCxzLnBIWXNbMF0pLGgoYixkKz00LHMucEhZc1sxXSksYltkKz00XT1zLnBIWXNbMl0saChiLCsrZCxvKGIsZC0xMywxMykpLGQrPTQpLHUmJihoKGIsZCw4KSxfKGIsZCs9NCxcImFjVExcIiksaChiLGQrPTQsdC5mcmFtZXMubGVuZ3RoKSxoKGIsZCs9NCxudWxsIT1zLmxvb3A/cy5sb29wOjApLGgoYixkKz00LG8oYixkLTEyLDEyKSksZCs9NCksMz09dC5jdHlwZSl7aChiLGQsMyoocD10LnBsdGUubGVuZ3RoKSksXyhiLGQrPTQsXCJQTFRFXCIpLGQrPTQ7Zm9yKHc9MDt3PHA7dysrKXt2YXIgQT0zKncsej10LnBsdGVbd10seD0yNTUmeixVPXo+Pj44JjI1NSxFPXo+Pj4xNiYyNTU7YltkK0ErMF09eCxiW2QrQSsxXT1VLGJbZCtBKzJdPUV9aWYoaChiLGQrPTMqcCxvKGIsZC0zKnAtNCwzKnArNCkpLGQrPTQsYyl7aChiLGQscCksXyhiLGQrPTQsXCJ0Uk5TXCIpLGQrPTQ7Zm9yKHc9MDt3PHA7dysrKWJbZCt3XT10LnBsdGVbd10+Pj4yNCYyNTU7aChiLGQrPXAsbyhiLGQtcC00LHArNCkpLGQrPTR9fXZhciBSPTA7Zm9yKHY9MDt2PHQuZnJhbWVzLmxlbmd0aDt2Kyspe3ZhciBTPXQuZnJhbWVzW3ZdO3UmJihoKGIsZCwyNiksXyhiLGQrPTQsXCJmY1RMXCIpLGgoYixkKz00LFIrKyksaChiLGQrPTQsUy5yZWN0LndpZHRoKSxoKGIsZCs9NCxTLnJlY3QuaGVpZ2h0KSxoKGIsZCs9NCxTLnJlY3QueCksaChiLGQrPTQsUy5yZWN0LnkpLGYoYixkKz00LGlbdl0pLGYoYixkKz0yLDFlMyksYltkKz0yXT1TLmRpc3Bvc2UsYlsrK2RdPVMuYmxlbmQsaChiLCsrZCxvKGIsZC0zMCwzMCkpLGQrPTQpO3ZhciBUPVMuY2ltZztoKGIsZCwocD1ULmxlbmd0aCkrKDA9PXY/MDo0KSk7dmFyIFo9ZCs9NDtfKGIsZCwwPT12P1wiSURBVFwiOlwiZmRBVFwiKSxkKz00LDAhPXYmJihoKGIsZCxSKyspLGQrPTQpLGIuc2V0KFQsZCksaChiLGQrPXAsbyhiLFosZC1aKSksZCs9NH1yZXR1cm4gaChiLGQsMCksXyhiLGQrPTQsXCJJRU5EXCIpLGgoYixkKz00LG8oYixkLTQsNCkpLGQrPTQsYi5idWZmZXJ9ZnVuY3Rpb24gaCh0LGUscil7Zm9yKHZhciBuPTA7bjx0LmZyYW1lcy5sZW5ndGg7bisrKXt2YXIgYT10LmZyYW1lc1tuXTthLnJlY3Qud2lkdGg7dmFyIGk9YS5yZWN0LmhlaWdodCxzPW5ldyBVaW50OEFycmF5KGkqYS5icGwraSk7YS5jaW1nPXUoYS5pbWcsaSxhLmJwcCxhLmJwbCxzLGUscil9fWZ1bmN0aW9uIGYoZSxyLG4sYSxpKXtmb3IodmFyIHM9aVswXSxvPWlbMV0saD1pWzJdLGY9aVszXSx1PWlbNF0sYz1pWzVdLHA9Nix3PTgsdj0yNTUsYj0wO2I8ZS5sZW5ndGg7YisrKWZvcih2YXIgbT1uZXcgVWludDhBcnJheShlW2JdKSx5PW0ubGVuZ3RoLEE9MDtBPHk7QSs9NCl2Jj1tW0ErM107dmFyIHo9MjU1IT12LHg9ZnVuY3Rpb24oZSxyLG4sYSxpLHMpe2Zvcih2YXIgbD1bXSxvPTA7bzxlLmxlbmd0aDtvKyspe3ZhciBoLGY9bmV3IFVpbnQ4QXJyYXkoZVtvXSksdT1uZXcgVWludDMyQXJyYXkoZi5idWZmZXIpLGM9MCxnPTAscD1yLHc9bix2PWE/MTowO2lmKDAhPW8pe2Zvcih2YXIgYj1zfHxhfHwxPT1vfHwwIT1sW28tMl0uZGlzcG9zZT8xOjIsbT0wLHk9MWU5LEE9MDtBPGI7QSsrKXtmb3IodmFyIHo9bmV3IFVpbnQ4QXJyYXkoZVtvLTEtQV0pLHg9bmV3IFVpbnQzMkFycmF5KGVbby0xLUFdKSxVPXIsaz1uLEU9LTEsUj0tMSxTPTA7UzxuO1MrKylmb3IodmFyIFQ9MDtUPHI7VCsrKXt1W0Q9UypyK1RdIT14W0RdJiYoVDxVJiYoVT1UKSxUPkUmJihFPVQpLFM8ayYmKGs9UyksUz5SJiYoUj1TKSl9LTE9PUUmJihVPWs9RT1SPTApLGkmJigxJn5VfHxVLS0sMSZ+a3x8ay0tKTt2YXIgWj0oRS1VKzEpKihSLWsrMSk7Wjx5JiYoeT1aLG09QSxjPVUsZz1rLHA9RS1VKzEsdz1SLWsrMSl9ej1uZXcgVWludDhBcnJheShlW28tMS1tXSk7MT09bSYmKGxbby0xXS5kaXNwb3NlPTIpLGg9bmV3IFVpbnQ4QXJyYXkocCp3KjQpLHQoeixyLG4saCxwLHcsLWMsLWcsMCksMT09KHY9dChmLHIsbixoLHAsdywtYywtZywzKT8xOjApP2QoZixyLG4saCx7eDpjLHk6Zyx3aWR0aDpwLGhlaWdodDp3fSk6dChmLHIsbixoLHAsdywtYywtZywwKX1lbHNlIGg9Zi5zbGljZSgwKTtsLnB1c2goe3JlY3Q6e3g6Yyx5Omcsd2lkdGg6cCxoZWlnaHQ6d30saW1nOmgsYmxlbmQ6dixkaXNwb3NlOjB9KX1pZihhKWZvcihvPTA7bzxsLmxlbmd0aDtvKyspe2lmKDEhPShGPWxbb10pLmJsZW5kKXt2YXIgST1GLnJlY3QsQz1sW28tMV0ucmVjdCxMPU1hdGgubWluKEkueCxDLngpLE09TWF0aC5taW4oSS55LEMueSksTj17eDpMLHk6TSx3aWR0aDpNYXRoLm1heChJLngrSS53aWR0aCxDLngrQy53aWR0aCktTCxoZWlnaHQ6TWF0aC5tYXgoSS55K0kuaGVpZ2h0LEMueStDLmhlaWdodCktTX07bFtvLTFdLmRpc3Bvc2U9MSxvLTEhPTAmJl8oZSxyLG4sbCxvLTEsTixpKSxfKGUscixuLGwsbyxOLGkpfX1pZigxIT1lLmxlbmd0aClmb3IodmFyIEQ9MDtEPGwubGVuZ3RoO0QrKyl7dmFyIEY7KEY9bFtEXSkucmVjdC53aWR0aCpGLnJlY3QuaGVpZ2h0fXJldHVybiBsfShlLHIsbixzLG8saCksVT17fSxrPVtdLEU9W107aWYoMCE9YSl7dmFyIFI9W107Zm9yKEE9MDtBPHgubGVuZ3RoO0ErKylSLnB1c2goeFtBXS5pbWcuYnVmZmVyKTt2YXIgUz1mdW5jdGlvbih0KXtmb3IodmFyIGU9MCxyPTA7cjx0Lmxlbmd0aDtyKyspZSs9dFtyXS5ieXRlTGVuZ3RoO3ZhciBuPW5ldyBVaW50OEFycmF5KGUpLGE9MDtmb3Iocj0wO3I8dC5sZW5ndGg7cisrKXtmb3IodmFyIGk9bmV3IFVpbnQ4QXJyYXkodFtyXSkscz1pLmxlbmd0aCxsPTA7bDxzO2wrPTQpe3ZhciBvPWlbbF0saD1pW2wrMV0sZj1pW2wrMl0sXz1pW2wrM107MD09XyYmKG89aD1mPTApLG5bYStsXT1vLG5bYStsKzFdPWgsblthK2wrMl09ZixuW2ErbCszXT1ffWErPXN9cmV0dXJuIG4uYnVmZmVyfShSKSxUPWcoUyxhKTtmb3IoQT0wO0E8VC5wbHRlLmxlbmd0aDtBKyspay5wdXNoKFQucGx0ZVtBXS5lc3QucmdiYSk7dmFyIFo9MDtmb3IoQT0wO0E8eC5sZW5ndGg7QSsrKXt2YXIgST0oTT14W0FdKS5pbWcubGVuZ3RoLEM9bmV3IFVpbnQ4QXJyYXkoVC5pbmRzLmJ1ZmZlcixaPj4yLEk+PjIpO0UucHVzaChDKTt2YXIgTD1uZXcgVWludDhBcnJheShULmFidWYsWixJKTtjJiZsKE0uaW1nLE0ucmVjdC53aWR0aCxNLnJlY3QuaGVpZ2h0LGssTCxDKSxNLmltZy5zZXQoTCksWis9SX19ZWxzZSBmb3IoYj0wO2I8eC5sZW5ndGg7YisrKXt2YXIgTT14W2JdLE49bmV3IFVpbnQzMkFycmF5KE0uaW1nLmJ1ZmZlciksRD1NLnJlY3Qud2lkdGg7eT1OLmxlbmd0aCxDPW5ldyBVaW50OEFycmF5KHkpO0UucHVzaChDKTtmb3IoQT0wO0E8eTtBKyspe3ZhciBGPU5bQV07aWYoMCE9QSYmRj09TltBLTFdKUNbQV09Q1tBLTFdO2Vsc2UgaWYoQT5EJiZGPT1OW0EtRF0pQ1tBXT1DW0EtRF07ZWxzZXt2YXIgTz1VW0ZdO2lmKG51bGw9PU8mJihVW0ZdPU89ay5sZW5ndGgsay5wdXNoKEYpLGsubGVuZ3RoPj0zMDApKWJyZWFrO0NbQV09T319fXZhciBCPWsubGVuZ3RoO0I8PTI1NiYmMD09dSYmKHc9Qjw9Mj8xOkI8PTQ/MjpCPD0xNj80Ojgsdz1NYXRoLm1heCh3LGYpKTtmb3IoYj0wO2I8eC5sZW5ndGg7YisrKXsoTT14W2JdKS5yZWN0LngsTS5yZWN0Lnk7RD1NLnJlY3Qud2lkdGg7dmFyIEg9TS5yZWN0LmhlaWdodCxQPU0uaW1nO25ldyBVaW50MzJBcnJheShQLmJ1ZmZlcik7dmFyIFk9NCpELHE9NDtpZihCPD0yNTYmJjA9PXUpe1k9TWF0aC5jZWlsKHcqRC84KTtmb3IodmFyIEc9bmV3IFVpbnQ4QXJyYXkoWSpIKSxLPUVbYl0saj0wO2o8SDtqKyspe0E9aipZO3ZhciBYPWoqRDtpZig4PT13KWZvcih2YXIgVj0wO1Y8RDtWKyspR1tBK1ZdPUtbWCtWXTtlbHNlIGlmKDQ9PXcpZm9yKFY9MDtWPEQ7VisrKUdbQSsoVj4+MSldfD1LW1grVl08PDQtNCooMSZWKTtlbHNlIGlmKDI9PXcpZm9yKFY9MDtWPEQ7VisrKUdbQSsoVj4+MildfD1LW1grVl08PDYtMiooMyZWKTtlbHNlIGlmKDE9PXcpZm9yKFY9MDtWPEQ7VisrKUdbQSsoVj4+MyldfD1LW1grVl08PDctMSooNyZWKX1QPUcscD0zLHE9MX1lbHNlIGlmKDA9PXomJjE9PXgubGVuZ3RoKXtHPW5ldyBVaW50OEFycmF5KEQqSCozKTt2YXIgVz1EKkg7Zm9yKEE9MDtBPFc7QSsrKXt2YXIgSj0zKkEsUT00KkE7R1tKXT1QW1FdLEdbSisxXT1QW1ErMV0sR1tKKzJdPVBbUSsyXX1QPUcscD0yLHE9MyxZPTMqRH1NLmltZz1QLE0uYnBsPVksTS5icHA9cX1yZXR1cm57Y3R5cGU6cCxkZXB0aDp3LHBsdGU6ayxmcmFtZXM6eH19ZnVuY3Rpb24gXyhlLHIsbixhLGkscyxsKXtmb3IodmFyIG89VWludDhBcnJheSxoPVVpbnQzMkFycmF5LGY9bmV3IG8oZVtpLTFdKSxfPW5ldyBoKGVbaS0xXSksdT1pKzE8ZS5sZW5ndGg/bmV3IG8oZVtpKzFdKTpudWxsLGM9bmV3IG8oZVtpXSksZz1uZXcgaChjLmJ1ZmZlcikscD1yLHc9bix2PS0xLGI9LTEsbT0wO208cy5oZWlnaHQ7bSsrKWZvcih2YXIgeT0wO3k8cy53aWR0aDt5Kyspe3ZhciBBPXMueCt5LHo9cy55K20seD16KnIrQSxVPWdbeF07MD09VXx8MD09YVtpLTFdLmRpc3Bvc2UmJl9beF09PVUmJihudWxsPT11fHwwIT11WzQqeCszXSl8fChBPHAmJihwPUEpLEE+diYmKHY9QSksejx3JiYodz16KSx6PmImJihiPXopKX0tMT09diYmKHA9dz12PWI9MCksbCYmKDEmfnB8fHAtLSwxJn53fHx3LS0pLHM9e3g6cCx5Oncsd2lkdGg6di1wKzEsaGVpZ2h0OmItdysxfTt2YXIgaz1hW2ldO2sucmVjdD1zLGsuYmxlbmQ9MSxrLmltZz1uZXcgVWludDhBcnJheShzLndpZHRoKnMuaGVpZ2h0KjQpLDA9PWFbaS0xXS5kaXNwb3NlPyh0KGYscixuLGsuaW1nLHMud2lkdGgscy5oZWlnaHQsLXMueCwtcy55LDApLGQoYyxyLG4say5pbWcscykpOnQoYyxyLG4say5pbWcscy53aWR0aCxzLmhlaWdodCwtcy54LC1zLnksMCl9ZnVuY3Rpb24gZChlLHIsbixhLGkpe3QoZSxyLG4sYSxpLndpZHRoLGkuaGVpZ2h0LC1pLngsLWkueSwyKX1mdW5jdGlvbiB1KHQsZSxyLG4sYSxpLHMpe3ZhciBsLG89W10saD1bMCwxLDIsMyw0XTstMSE9aT9oPVtpXTooZSpuPjVlNXx8MT09cikmJihoPVswXSkscyYmKGw9e2xldmVsOjB9KTtmb3IodmFyIGY9YS5sZW5ndGg+MWU3JiZudWxsIT13aW5kb3cuVVpJUD93aW5kb3cuVVpJUDprLF89MDtfPGgubGVuZ3RoO18rKyl7Zm9yKHZhciBkPTA7ZDxlO2QrKyljKGEsdCxkLG4scixoW19dKTtvLnB1c2goZi5kZWZsYXRlKGEsbCkpfXZhciB1LGc9MWU5O2ZvcihfPTA7XzxvLmxlbmd0aDtfKyspb1tfXS5sZW5ndGg8ZyYmKHU9XyxnPW9bX10ubGVuZ3RoKTtyZXR1cm4gb1t1XX1mdW5jdGlvbiBjKHQsZSxuLGEsaSxzKXt2YXIgbD1uKmEsbz1sK247aWYodFtvXT1zLG8rKywwPT1zKWlmKGE8NTAwKWZvcih2YXIgaD0wO2g8YTtoKyspdFtvK2hdPWVbbCtoXTtlbHNlIHQuc2V0KG5ldyBVaW50OEFycmF5KGUuYnVmZmVyLGwsYSksbyk7ZWxzZSBpZigxPT1zKXtmb3IoaD0wO2g8aTtoKyspdFtvK2hdPWVbbCtoXTtmb3IoaD1pO2g8YTtoKyspdFtvK2hdPWVbbCtoXS1lW2wraC1pXSsyNTYmMjU1fWVsc2UgaWYoMD09bil7Zm9yKGg9MDtoPGk7aCsrKXRbbytoXT1lW2wraF07aWYoMj09cylmb3IoaD1pO2g8YTtoKyspdFtvK2hdPWVbbCtoXTtpZigzPT1zKWZvcihoPWk7aDxhO2grKyl0W28raF09ZVtsK2hdLShlW2wraC1pXT4+MSkrMjU2JjI1NTtpZig0PT1zKWZvcihoPWk7aDxhO2grKyl0W28raF09ZVtsK2hdLXIoZVtsK2gtaV0sMCwwKSsyNTYmMjU1fWVsc2V7aWYoMj09cylmb3IoaD0wO2g8YTtoKyspdFtvK2hdPWVbbCtoXSsyNTYtZVtsK2gtYV0mMjU1O2lmKDM9PXMpe2ZvcihoPTA7aDxpO2grKyl0W28raF09ZVtsK2hdKzI1Ni0oZVtsK2gtYV0+PjEpJjI1NTtmb3IoaD1pO2g8YTtoKyspdFtvK2hdPWVbbCtoXSsyNTYtKGVbbCtoLWFdK2VbbCtoLWldPj4xKSYyNTV9aWYoND09cyl7Zm9yKGg9MDtoPGk7aCsrKXRbbytoXT1lW2wraF0rMjU2LXIoMCxlW2wraC1hXSwwKSYyNTU7Zm9yKGg9aTtoPGE7aCsrKXRbbytoXT1lW2wraF0rMjU2LXIoZVtsK2gtaV0sZVtsK2gtYV0sZVtsK2gtaS1hXSkmMjU1fX19ZnVuY3Rpb24gZyh0LGUscil7Zm9yKHZhciBuPW5ldyBVaW50OEFycmF5KHQpLGE9bi5zbGljZSgwKSxpPW5ldyBVaW50MzJBcnJheShhLmJ1ZmZlcikscz1iKGEsZSksbD1zWzBdLG89c1sxXSxoPW8ubGVuZ3RoLGY9bmV3IFVpbnQzMkFycmF5KGgpLF89bmV3IFVpbnQ4QXJyYXkoZi5idWZmZXIpLGQ9MDtkPGg7ZCsrKWZbZF09b1tkXS5lc3QucmdiYTt2YXIgdSxjPW4ubGVuZ3RoLGc9bmV3IFVpbnQ4QXJyYXkoYz4+Mik7aWYoaDw9NjApdihuLGcsXykscChnLGksZik7ZWxzZSBpZihuLmxlbmd0aDwzMmU2KWZvcihkPTA7ZDxjO2QrPTQpe3U9bShsLEE9bltkXSooMS8yNTUpLHo9bltkKzFdKigxLzI1NSkseD1uW2QrMl0qKDEvMjU1KSxVPW5bZCszXSooMS8yNTUpKSxnW2Q+PjJdPXUuaW5kLGlbZD4+Ml09dS5lc3QucmdiYX1lbHNlIGZvcihkPTA7ZDxjO2QrPTQpe3ZhciBBPW5bZF0qKDEvMjU1KSx6PW5bZCsxXSooMS8yNTUpLHg9bltkKzJdKigxLzI1NSksVT1uW2QrM10qKDEvMjU1KTtmb3IodT1sO3UubGVmdDspdT15KHUuZXN0LEEseix4LFUpPD0wP3UubGVmdDp1LnJpZ2h0O2dbZD4+Ml09dS5pbmQsaVtkPj4yXT11LmVzdC5yZ2JhfWlmKHJ8fG4ubGVuZ3RoKmg8NGU3KXt2YXIgaz0xZTk7Zm9yKGQ9MDtkPDEwO2QrKyl7dmFyIEU9dyhuLGcsXyk7aWYoRS9rPi45OTcpYnJlYWs7az1FfWZvcihkPTA7ZDxoO2QrKylvW2RdLmVzdC5yZ2JhPWZbZF07cChnLGksZil9cmV0dXJue2FidWY6YS5idWZmZXIsaW5kczpnLHBsdGU6b319ZnVuY3Rpb24gcCh0LGUscil7Zm9yKHZhciBuPTA7bjx0Lmxlbmd0aDtuKyspZVtuXT1yW3Rbbl1dfWZ1bmN0aW9uIHcodCxlLHIpe3JldHVybiBmdW5jdGlvbih0LGUscil7Zm9yKHZhciBuPXIubGVuZ3RoPj4+MixhPW5ldyBVaW50MzJBcnJheSg0Km4pLGk9bmV3IFVpbnQzMkFycmF5KG4pLHM9MDtzPHQubGVuZ3RoO3MrPTQpe3ZhciBsPWVbcz4+PjJdLG89NCpsO2lbbF0rKyxhW29dKz10W3NdLGFbbysxXSs9dFtzKzFdLGFbbysyXSs9dFtzKzJdLGFbbyszXSs9dFtzKzNdfWZvcihzPTA7czxyLmxlbmd0aDtzKyspcltzXT1NYXRoLnJvdW5kKGFbc10vaVtzPj4+Ml0pfSh0LGUsciksdih0LGUscil9ZnVuY3Rpb24gdih0LGUscil7Zm9yKHZhciBuPTAsYT1yLmxlbmd0aD4+PjIsaT1bXSxzPTA7czxhO3MrKyl7Zm9yKHZhciBsPXJbZz00KnNdLG89cltnKzFdLGg9cltnKzJdLGY9cltnKzNdLF89MCxkPTFlOSx1PTA7dTxhO3UrKylpZihzIT11KXt2YXIgYz00KnU7KG09KHA9bC1yW2NdKSpwKyh3PW8tcltjKzFdKSp3Kyh2PWgtcltjKzJdKSp2KyhiPWYtcltjKzNdKSpiKTxkJiYoZD1tLF89dSl9aVtzXT0uNSpNYXRoLnNxcnQoZCksaVtzXT1pW3NdKmlbc119Zm9yKHM9MDtzPHQubGVuZ3RoO3MrPTQpe3ZhciBnLHAsdyx2LGI7bD10W3NdLG89dFtzKzFdLGg9dFtzKzJdLGY9dFtzKzNdO2lmKChkPShwPWwtcltnPTQqKF89ZVtzPj4+Ml0pXSkqcCsodz1vLXJbZysxXSkqdysodj1oLXJbZysyXSkqdisoYj1mLXJbZyszXSkqYik+aVtfXSlmb3IodT0wO3U8YTt1Kyspe3ZhciBtO2lmKChtPShwPWwtcltnPTQqdV0pKnArKHc9by1yW2crMV0pKncrKHY9aC1yW2crMl0pKnYrKGI9Zi1yW2crM10pKmIpPGQmJihfPXUsKGQ9bSk8aVt1XSkpYnJlYWt9ZVtzPj4+Ml09XyxuKz1kfXJldHVybiBuLyh0Lmxlbmd0aD4+PjIpfWZ1bmN0aW9uIGIodCxlLHIpe251bGw9PXImJihyPTFlLTQpO3ZhciBuPW5ldyBVaW50MzJBcnJheSh0LmJ1ZmZlciksYT17aTA6MCxpMTp0Lmxlbmd0aCxic3Q6bnVsbCxlc3Q6bnVsbCx0ZHN0OjAsbGVmdDpudWxsLHJpZ2h0Om51bGx9O2EuYnN0PXgodCxhLmkwLGEuaTEpLGEuZXN0PVUoYS5ic3QpO2Zvcih2YXIgaT1bYV07aS5sZW5ndGg8ZTspe2Zvcih2YXIgcz0wLGw9MCxvPTA7bzxpLmxlbmd0aDtvKyspaVtvXS5lc3QuTD5zJiYocz1pW29dLmVzdC5MLGw9byk7aWYoczxyKWJyZWFrO3ZhciBoPWlbbF0sZj1BKHQsbixoLmkwLGguaTEsaC5lc3QuZSxoLmVzdC5lTXEyNTUpO2lmKGguaTA+PWZ8fGguaTE8PWYpaC5lc3QuTD0wO2Vsc2V7dmFyIF89e2kwOmguaTAsaTE6Zixic3Q6bnVsbCxlc3Q6bnVsbCx0ZHN0OjAsbGVmdDpudWxsLHJpZ2h0Om51bGx9O18uYnN0PXgodCxfLmkwLF8uaTEpLF8uZXN0PVUoXy5ic3QpO3ZhciBkPXtpMDpmLGkxOmguaTEsYnN0Om51bGwsZXN0Om51bGwsdGRzdDowLGxlZnQ6bnVsbCxyaWdodDpudWxsfTtkLmJzdD17UjpbXSxtOltdLE46aC5ic3QuTi1fLmJzdC5OfTtmb3Iobz0wO288MTY7bysrKWQuYnN0LlJbb109aC5ic3QuUltvXS1fLmJzdC5SW29dO2ZvcihvPTA7bzw0O28rKylkLmJzdC5tW29dPWguYnN0Lm1bb10tXy5ic3QubVtvXTtkLmVzdD1VKGQuYnN0KSxoLmxlZnQ9XyxoLnJpZ2h0PWQsaVtsXT1fLGkucHVzaChkKX19aS5zb3J0KChmdW5jdGlvbih0LGUpe3JldHVybiBlLmJzdC5OLXQuYnN0Lk59KSk7Zm9yKG89MDtvPGkubGVuZ3RoO28rKylpW29dLmluZD1vO3JldHVyblthLGldfWZ1bmN0aW9uIG0odCxlLHIsbixhKXtpZihudWxsPT10LmxlZnQpcmV0dXJuIHQudGRzdD1mdW5jdGlvbih0LGUscixuLGEpe3ZhciBpPWUtdFswXSxzPXItdFsxXSxsPW4tdFsyXSxvPWEtdFszXTtyZXR1cm4gaSppK3MqcytsKmwrbypvfSh0LmVzdC5xLGUscixuLGEpLHQ7dmFyIGk9eSh0LmVzdCxlLHIsbixhKSxzPXQubGVmdCxsPXQucmlnaHQ7aT4wJiYocz10LnJpZ2h0LGw9dC5sZWZ0KTt2YXIgbz1tKHMsZSxyLG4sYSk7aWYoby50ZHN0PD1pKmkpcmV0dXJuIG87dmFyIGg9bShsLGUscixuLGEpO3JldHVybiBoLnRkc3Q8by50ZHN0P2g6b31mdW5jdGlvbiB5KHQsZSxyLG4sYSl7dmFyIGk9dC5lO3JldHVybiBpWzBdKmUraVsxXSpyK2lbMl0qbitpWzNdKmEtdC5lTXF9ZnVuY3Rpb24gQSh0LGUscixuLGEsaSl7Zm9yKG4tPTQ7cjxuOyl7Zm9yKDt6KHQscixhKTw9aTspcis9NDtmb3IoO3oodCxuLGEpPmk7KW4tPTQ7aWYocj49bilicmVhazt2YXIgcz1lW3I+PjJdO2Vbcj4+Ml09ZVtuPj4yXSxlW24+PjJdPXMscis9NCxuLT00fWZvcig7eih0LHIsYSk+aTspci09NDtyZXR1cm4gcis0fWZ1bmN0aW9uIHoodCxlLHIpe3JldHVybiB0W2VdKnJbMF0rdFtlKzFdKnJbMV0rdFtlKzJdKnJbMl0rdFtlKzNdKnJbM119ZnVuY3Rpb24geCh0LGUscil7Zm9yKHZhciBuPVswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSxhPVswLDAsMCwwXSxpPXItZT4+MixzPWU7czxyO3MrPTQpe3ZhciBsPXRbc10qKDEvMjU1KSxvPXRbcysxXSooMS8yNTUpLGg9dFtzKzJdKigxLzI1NSksZj10W3MrM10qKDEvMjU1KTthWzBdKz1sLGFbMV0rPW8sYVsyXSs9aCxhWzNdKz1mLG5bMF0rPWwqbCxuWzFdKz1sKm8sblsyXSs9bCpoLG5bM10rPWwqZixuWzVdKz1vKm8sbls2XSs9bypoLG5bN10rPW8qZixuWzEwXSs9aCpoLG5bMTFdKz1oKmYsblsxNV0rPWYqZn1yZXR1cm4gbls0XT1uWzFdLG5bOF09blsyXSxuWzldPW5bNl0sblsxMl09blszXSxuWzEzXT1uWzddLG5bMTRdPW5bMTFdLHtSOm4sbTphLE46aX19ZnVuY3Rpb24gVSh0KXt2YXIgZT10LlIscj10Lm0sbj10Lk4sYT1yWzBdLGk9clsxXSxzPXJbMl0sbD1yWzNdLG89MD09bj8wOjEvbixoPVtlWzBdLWEqYSpvLGVbMV0tYSppKm8sZVsyXS1hKnMqbyxlWzNdLWEqbCpvLGVbNF0taSphKm8sZVs1XS1pKmkqbyxlWzZdLWkqcypvLGVbN10taSpsKm8sZVs4XS1zKmEqbyxlWzldLXMqaSpvLGVbMTBdLXMqcypvLGVbMTFdLXMqbCpvLGVbMTJdLWwqYSpvLGVbMTNdLWwqaSpvLGVbMTRdLWwqcypvLGVbMTVdLWwqbCpvXSxmPWgsXz1SLGQ9W01hdGgucmFuZG9tKCksTWF0aC5yYW5kb20oKSxNYXRoLnJhbmRvbSgpLE1hdGgucmFuZG9tKCldLHU9MCxjPTA7aWYoMCE9bilmb3IodmFyIGc9MDtnPDE2JiYoZD1fLm11bHRWZWMoZixkKSxjPU1hdGguc3FydChfLmRvdChkLGQpKSxkPV8uc21sKDEvYyxkKSwhKDAhPWcmJk1hdGguYWJzKGMtdSk8MWUtOSkpO2crKyl1PWM7dmFyIHA9W2EqbyxpKm8scypvLGwqb107cmV0dXJue0NvdjpoLHE6cCxlOmQsTDp1LGVNcTI1NTpfLmRvdChfLnNtbCgyNTUscCksZCksZU1xOl8uZG90KGQscCkscmdiYTooTWF0aC5yb3VuZCgyNTUqcFszXSk8PDI0fE1hdGgucm91bmQoMjU1KnBbMl0pPDwxNnxNYXRoLnJvdW5kKDI1NSpwWzFdKTw8OHxNYXRoLnJvdW5kKDI1NSpwWzBdKSk+Pj4wfX12YXIgUj17bXVsdFZlYzpmdW5jdGlvbih0LGUpe3JldHVyblt0WzBdKmVbMF0rdFsxXSplWzFdK3RbMl0qZVsyXSt0WzNdKmVbM10sdFs0XSplWzBdK3RbNV0qZVsxXSt0WzZdKmVbMl0rdFs3XSplWzNdLHRbOF0qZVswXSt0WzldKmVbMV0rdFsxMF0qZVsyXSt0WzExXSplWzNdLHRbMTJdKmVbMF0rdFsxM10qZVsxXSt0WzE0XSplWzJdK3RbMTVdKmVbM11dfSxkb3Q6ZnVuY3Rpb24odCxlKXtyZXR1cm4gdFswXSplWzBdK3RbMV0qZVsxXSt0WzJdKmVbMl0rdFszXSplWzNdfSxzbWw6ZnVuY3Rpb24odCxlKXtyZXR1cm5bdCplWzBdLHQqZVsxXSx0KmVbMl0sdCplWzNdXX19O0UuZW5jb2RlPWZ1bmN0aW9uKHQsZSxyLG4sYSxpLHMpe251bGw9PW4mJihuPTApLG51bGw9PXMmJihzPSExKTt2YXIgbD1mKHQsZSxyLG4sWyExLCExLCExLDAscywhMV0pO3JldHVybiBoKGwsLTEpLG8obCxlLHIsYSxpKX0sRS5lbmNvZGVMTD1mdW5jdGlvbih0LGUscixuLGEsaSxzLGwpe2Zvcih2YXIgZj17Y3R5cGU6MCsoMT09bj8wOjIpKygwPT1hPzA6NCksZGVwdGg6aSxmcmFtZXM6W119LF89KG4rYSkqaSxkPV8qZSx1PTA7dTx0Lmxlbmd0aDt1KyspZi5mcmFtZXMucHVzaCh7cmVjdDp7eDowLHk6MCx3aWR0aDplLGhlaWdodDpyfSxpbWc6bmV3IFVpbnQ4QXJyYXkodFt1XSksYmxlbmQ6MCxkaXNwb3NlOjEsYnBwOk1hdGguY2VpbChfLzgpLGJwbDpNYXRoLmNlaWwoZC84KX0pO3JldHVybiBoKGYsMCwhMCksbyhmLGUscixzLGwpfSxFLmVuY29kZS5jb21wcmVzcz1mLEUuZW5jb2RlLmRpdGhlcj1sLEUucXVhbnRpemU9ZyxFLnF1YW50aXplLmZpbmROZWFyZXN0PXYsRS5xdWFudGl6ZS5nZXRLRHRyZWU9YixFLnF1YW50aXplLmdldE5lYXJlc3Q9bX0oKSxFfSkpO1xuIiwiaW1wb3J0IFVQTkcgZnJvbSAnQHVwbmcvdXBuZy1qcyc7XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0ltYWdlKFxyXG4gIGZpbGU6IEZpbGUsXHJcbiAgb3B0aW9uczoge1xyXG4gICAgbWluQnl0ZXM/OiBudW1iZXI7XHJcbiAgICBtYXhCeXRlcz86IG51bWJlcjtcclxuICAgIGZvcm1hdD86ICdqcGVnJyB8ICdwbmcnIHwgJ3dlYnAnO1xyXG4gIH1cclxuKTogUHJvbWlzZTxGaWxlPiB7XHJcbiAgY29uc3Qge1xyXG4gICAgbWluQnl0ZXMsXHJcbiAgICBtYXhCeXRlcyxcclxuICAgIGZvcm1hdCA9ICdqcGVnJyxcclxuICB9ID0gb3B0aW9ucztcclxuXHJcbiAgaWYgKCFmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgYENhbm5vdCBjb21wcmVzcyBub24taW1hZ2UgZmlsZTogJHtmaWxlLnR5cGV9YFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vIEFscmVhZHkgd2l0aGluIHRoZSByZXF1aXJlZCByYW5nZS5cclxuICBpZiAoXHJcbiAgICAobWluQnl0ZXMgPT09IHVuZGVmaW5lZCB8fCBmaWxlLnNpemUgPj0gbWluQnl0ZXMpICYmXHJcbiAgICAobWF4Qnl0ZXMgPT09IHVuZGVmaW5lZCB8fCBmaWxlLnNpemUgPD0gbWF4Qnl0ZXMpXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gZmlsZTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGltYWdlID0gYXdhaXQgbG9hZEltYWdlKGZpbGUpO1xyXG5cclxuICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuXHJcbiAgY2FudmFzLndpZHRoID0gaW1hZ2UubmF0dXJhbFdpZHRoO1xyXG4gIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xyXG5cclxuICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gIGlmICghY29udGV4dCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY3JlYXRlIGNhbnZhcyBjb250ZXh0LicpO1xyXG4gIH1cclxuXHJcbiAgY29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZmZmZic7XHJcblxyXG4gIGNvbnRleHQuZmlsbFJlY3QoXHJcbiAgICAwLFxyXG4gICAgMCxcclxuICAgIGNhbnZhcy53aWR0aCxcclxuICAgIGNhbnZhcy5oZWlnaHRcclxuICApO1xyXG5cclxuICBjb250ZXh0LmRyYXdJbWFnZShcclxuICAgIGltYWdlLFxyXG4gICAgMCxcclxuICAgIDAsXHJcbiAgICBjYW52YXMud2lkdGgsXHJcbiAgICBjYW52YXMuaGVpZ2h0XHJcbiAgKTtcclxuXHJcbiAgLy8gRmlsZSBpcyBiZWxvdyB0aGUgbWluaW11bSBzaXplLlxyXG4gIGlmIChcclxuICAgIG1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgIGZpbGUuc2l6ZSA8IG1pbkJ5dGVzXHJcbiAgKSB7XHJcbiAgICBjb25zdCBibG9iID0gYXdhaXQgY2FudmFzVG9CbG9iKFxyXG4gICAgICBjYW52YXMsXHJcbiAgICAgIDEsXHJcbiAgICAgIGZvcm1hdFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcclxuICAgICAgJ1tGaWxlVGhyb3VnaF0gTWluaW11bS1zaXplIGF0dGVtcHQ6JyxcclxuICAgICAge1xyXG4gICAgICAgIHF1YWxpdHk6IDEsXHJcbiAgICAgICAgc2l6ZUJ5dGVzOiBibG9iLnNpemUsXHJcbiAgICAgICAgbWluQnl0ZXMsXHJcbiAgICAgICAgbWF4Qnl0ZXMsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBibG9iLnNpemUgPj0gbWluQnl0ZXMgJiZcclxuICAgICAgKG1heEJ5dGVzID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgICBibG9iLnNpemUgPD0gbWF4Qnl0ZXMpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIGNyZWF0ZUNvbXByZXNzZWRGaWxlKFxyXG4gICAgICAgIGZpbGUsXHJcbiAgICAgICAgYmxvYixcclxuICAgICAgICBmb3JtYXRcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIGJsb2Iuc2l6ZSA8IG1pbkJ5dGVzICYmXHJcbiAgICAgIChtYXhCeXRlcyA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgYmxvYi5zaXplIDw9IG1heEJ5dGVzKVxyXG4gICAgKSB7XHJcbiAgICAgIGxldCBwYWRkZWRCbG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgICBpZiAoZm9ybWF0ID09PSAnanBlZycpIHtcclxuICAgICAgICBwYWRkZWRCbG9iID1cclxuICAgICAgICAgIGF3YWl0IHBhZEpwZWdUb01pbmltdW0oXHJcbiAgICAgICAgICAgIGJsb2IsXHJcbiAgICAgICAgICAgIG1pbkJ5dGVzXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZm9ybWF0ID09PSAncG5nJykge1xyXG4gICAgICAgIHBhZGRlZEJsb2IgPVxyXG4gICAgICAgICAgYXdhaXQgcGFkUG5nVG9NaW5pbXVtKFxyXG4gICAgICAgICAgICBibG9iLFxyXG4gICAgICAgICAgICBtaW5CeXRlc1xyXG4gICAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKFxyXG4gICAgICAgIHBhZGRlZEJsb2IgJiZcclxuICAgICAgICBwYWRkZWRCbG9iLnNpemUgPj0gbWluQnl0ZXMgJiZcclxuICAgICAgICAobWF4Qnl0ZXMgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgICAgcGFkZGVkQmxvYi5zaXplIDw9IG1heEJ5dGVzKVxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm4gY3JlYXRlQ29tcHJlc3NlZEZpbGUoXHJcbiAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgcGFkZGVkQmxvYixcclxuICAgICAgICAgIGZvcm1hdFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIGBVbmFibGUgdG8gcHJvZHVjZSBhbiBpbWFnZSBiZXR3ZWVuICR7bWluQnl0ZXN9IGFuZCAke1xyXG4gICAgICAgIG1heEJ5dGVzID8/ICd1bmxpbWl0ZWQnXHJcbiAgICAgIH0gYnl0ZXMgYXQgdGhlIHJlcXVpcmVkIGRpbWVuc2lvbnMuYFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vIEZpbGUgaXMgYWJvdmUgdGhlIG1heGltdW0gc2l6ZS5cclxuICBpZiAobWF4Qnl0ZXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAnQ2Fubm90IGNvbXByZXNzIGltYWdlIHdpdGhvdXQgYSBtYXhpbXVtIGJ5dGUgbGltaXQuJ1xyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGxldCBsb3cgPSAwLjA1O1xyXG4gIGxldCBoaWdoID0gMTtcclxuICBsZXQgYmVzdEJsb2I6IEJsb2IgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAxMDsgYXR0ZW1wdCsrKSB7XHJcbiAgICBjb25zdCBxdWFsaXR5ID1cclxuICAgICAgKGxvdyArIGhpZ2gpIC8gMjtcclxuXHJcbmNvbnN0IGJsb2IgPVxyXG4gICAgZm9ybWF0ID09PSAncG5nJ1xyXG4gICAgICAgID8gYXdhaXQgY2FudmFzVG9QbmdCbG9iKFxyXG4gICAgICAgICAgICBjYW52YXMsXHJcbiAgICAgICAgICAgIDI1NlxyXG4gICAgICAgIClcclxuICAgICAgICA6IGF3YWl0IGNhbnZhc1RvQmxvYihcclxuICAgICAgICAgICAgY2FudmFzLFxyXG4gICAgICAgICAgICBxdWFsaXR5LFxyXG4gICAgICAgICAgICBmb3JtYXRcclxuICAgICAgICApO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICBgW0ZpbGVUaHJvdWdoXSBDb21wcmVzc2lvbiBhdHRlbXB0ICR7YXR0ZW1wdCArIDF9OmAsXHJcbiAgICAgIHtcclxuICAgICAgICBxdWFsaXR5LFxyXG4gICAgICAgIHNpemVCeXRlczogYmxvYi5zaXplLFxyXG4gICAgICAgIG1pbkJ5dGVzLFxyXG4gICAgICAgIG1heEJ5dGVzLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGlmIChibG9iLnNpemUgPiBtYXhCeXRlcykge1xyXG4gICAgICBoaWdoID0gcXVhbGl0eTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBtaW5CeXRlcyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICAgIGJsb2Iuc2l6ZSA8IG1pbkJ5dGVzXHJcbiAgICApIHtcclxuICAgICAgbG93ID0gcXVhbGl0eTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgYmVzdEJsb2IgPSBibG9iO1xyXG4gICAgbG93ID0gcXVhbGl0eTtcclxuICB9XHJcblxyXG4gIGlmICghYmVzdEJsb2IpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgYFVuYWJsZSB0byBwcm9kdWNlIGFuIGltYWdlIGJldHdlZW4gJHtcclxuICAgICAgICBtaW5CeXRlcyA/PyAwXHJcbiAgICAgIH0gYW5kICR7bWF4Qnl0ZXN9IGJ5dGVzLmBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY3JlYXRlQ29tcHJlc3NlZEZpbGUoXHJcbiAgICBmaWxlLFxyXG4gICAgYmVzdEJsb2IsXHJcbiAgICBmb3JtYXRcclxuICApO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjYW52YXNUb1BuZ0Jsb2IoXHJcbiAgICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxyXG4gICAgY29sb3JDb3VudDogbnVtYmVyXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIGlmICghY29udGV4dCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNyZWF0ZSBjYW52YXMgY29udGV4dC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YShcclxuICAgICAgICAwLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgY2FudmFzLndpZHRoLFxyXG4gICAgICAgIGNhbnZhcy5oZWlnaHRcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gVVBORy5lbmNvZGUoXHJcbiAgICAgICAgW2ltYWdlRGF0YS5kYXRhLmJ1ZmZlcl0sXHJcbiAgICAgICAgY2FudmFzLndpZHRoLFxyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQsXHJcbiAgICAgICAgY29sb3JDb3VudFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEJsb2IoXHJcbiAgICAgICAgW2J1ZmZlcl0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICB9XHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVDb21wcmVzc2VkRmlsZShcclxuICBvcmlnaW5hbEZpbGU6IEZpbGUsXHJcbiAgYmxvYjogQmxvYixcclxuICBmb3JtYXQ6ICdqcGVnJyB8ICdwbmcnIHwgJ3dlYnAnXHJcbik6IEZpbGUge1xyXG4gIGNvbnN0IGV4dGVuc2lvbiA9XHJcbiAgICBmb3JtYXQgPT09ICdqcGVnJ1xyXG4gICAgICA/ICdqcGcnXHJcbiAgICAgIDogZm9ybWF0O1xyXG5cclxuICBjb25zdCBtaW1lVHlwZSA9XHJcbiAgICBmb3JtYXQgPT09ICdqcGVnJ1xyXG4gICAgICA/ICdpbWFnZS9qcGVnJ1xyXG4gICAgICA6IGZvcm1hdCA9PT0gJ3BuZydcclxuICAgICAgICA/ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgOiAnaW1hZ2Uvd2VicCc7XHJcblxyXG4gIHJldHVybiBuZXcgRmlsZShcclxuICAgIFtibG9iXSxcclxuICAgIHJlcGxhY2VFeHRlbnNpb24oXHJcbiAgICAgIG9yaWdpbmFsRmlsZS5uYW1lLFxyXG4gICAgICBleHRlbnNpb25cclxuICAgICksXHJcbiAgICB7XHJcbiAgICAgIHR5cGU6IG1pbWVUeXBlLFxyXG4gICAgICBsYXN0TW9kaWZpZWQ6IERhdGUubm93KCksXHJcbiAgICB9XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZEltYWdlKFxyXG4gIGZpbGU6IEZpbGVcclxuKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XHJcblxyXG4gICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgcmVzb2x2ZShpbWFnZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuXHJcbiAgICAgIHJlamVjdChcclxuICAgICAgICBuZXcgRXJyb3IoJ1VuYWJsZSB0byBkZWNvZGUgaW1hZ2UuJylcclxuICAgICAgKTtcclxuICAgIH07XHJcblxyXG4gICAgaW1hZ2Uuc3JjID0gdXJsO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjYW52YXNUb0Jsb2IoXHJcbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCxcclxuICBxdWFsaXR5OiBudW1iZXIsXHJcbiAgZm9ybWF0OiAnanBlZycgfCAncG5nJyB8ICd3ZWJwJ1xyXG4pOiBQcm9taXNlPEJsb2I+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgbWltZVR5cGUgPVxyXG4gICAgICBmb3JtYXQgPT09ICdqcGVnJ1xyXG4gICAgICAgID8gJ2ltYWdlL2pwZWcnXHJcbiAgICAgICAgOiBmb3JtYXQgPT09ICdwbmcnXHJcbiAgICAgICAgICA/ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICA6ICdpbWFnZS93ZWJwJztcclxuXHJcbiAgICBjYW52YXMudG9CbG9iKFxyXG4gICAgICAoYmxvYikgPT4ge1xyXG4gICAgICAgIGlmICghYmxvYikge1xyXG4gICAgICAgICAgcmVqZWN0KFxyXG4gICAgICAgICAgICBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgYEZhaWxlZCB0byBjcmVhdGUgJHtmb3JtYXR9IGltYWdlLmBcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXNvbHZlKGJsb2IpO1xyXG4gICAgICB9LFxyXG4gICAgICBtaW1lVHlwZSxcclxuICAgICAgZm9ybWF0ID09PSAncG5nJ1xyXG4gICAgICAgID8gdW5kZWZpbmVkXHJcbiAgICAgICAgOiBxdWFsaXR5XHJcbiAgICApO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYWRKcGVnVG9NaW5pbXVtKFxyXG4gIGJsb2I6IEJsb2IsXHJcbiAgbWluQnl0ZXM6IG51bWJlclxyXG4pOiBQcm9taXNlPEJsb2I+IHtcclxuICByZXR1cm4gYmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oKGJ1ZmZlcikgPT4ge1xyXG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgYnl0ZXMubGVuZ3RoIDwgNCB8fFxyXG4gICAgICBieXRlc1swXSAhPT0gMHhmZiB8fFxyXG4gICAgICBieXRlc1sxXSAhPT0gMHhkOCB8fFxyXG4gICAgICBieXRlc1tieXRlcy5sZW5ndGggLSAyXSAhPT0gMHhmZiB8fFxyXG4gICAgICBieXRlc1tieXRlcy5sZW5ndGggLSAxXSAhPT0gMHhkOVxyXG4gICAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHBhZCBKUEVHOiBpbnZhbGlkIEpQRUcgZGF0YS4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFkZGluZ0J5dGVzID1cclxuICAgICAgbWluQnl0ZXMgLSBieXRlcy5sZW5ndGg7XHJcblxyXG4gICAgaWYgKHBhZGRpbmdCeXRlcyA8PSAwKSB7XHJcbiAgICAgIHJldHVybiBibG9iO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbW1lbnREYXRhTGVuZ3RoID1cclxuICAgICAgcGFkZGluZ0J5dGVzO1xyXG5cclxuICAgIGNvbnN0IGNvbW1lbnRMZW5ndGggPVxyXG4gICAgICBjb21tZW50RGF0YUxlbmd0aCArIDI7XHJcblxyXG4gICAgaWYgKGNvbW1lbnRMZW5ndGggPiA2NTUzNSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ0Nhbm5vdCBwYWQgSlBFRzogcGFkZGluZyBpcyB0b28gbGFyZ2UuJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbW1lbnQgPSBuZXcgVWludDhBcnJheShcclxuICAgICAgY29tbWVudERhdGFMZW5ndGggKyA0XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEpQRUcgQ09NIG1hcmtlclxyXG4gICAgY29tbWVudFswXSA9IDB4ZmY7XHJcbiAgICBjb21tZW50WzFdID0gMHhmZTtcclxuXHJcbiAgICAvLyBMZW5ndGggaW5jbHVkZXMgdGhlc2UgdHdvIGxlbmd0aCBieXRlcy5cclxuICAgIGNvbW1lbnRbMl0gPVxyXG4gICAgICAoY29tbWVudExlbmd0aCA+PiA4KSAmIDB4ZmY7XHJcblxyXG4gICAgY29tbWVudFszXSA9XHJcbiAgICAgIGNvbW1lbnRMZW5ndGggJiAweGZmO1xyXG5cclxuICAgIGNvbnN0IGVvaUluZGV4ID1cclxuICAgICAgYnl0ZXMubGVuZ3RoIC0gMjtcclxuXHJcbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgVWludDhBcnJheShcclxuICAgICAgYnl0ZXMubGVuZ3RoICsgY29tbWVudC5sZW5ndGhcclxuICAgICk7XHJcblxyXG4gICAgLy8gRXZlcnl0aGluZyBiZWZvcmUgRU9JXHJcbiAgICBvdXRwdXQuc2V0KFxyXG4gICAgICBieXRlcy5zbGljZSgwLCBlb2lJbmRleCksXHJcbiAgICAgIDBcclxuICAgICk7XHJcblxyXG4gICAgLy8gQ29tbWVudCBzZWdtZW50XHJcbiAgICBvdXRwdXQuc2V0KFxyXG4gICAgICBjb21tZW50LFxyXG4gICAgICBlb2lJbmRleFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBPcmlnaW5hbCBFT0kgbWFya2VyXHJcbiAgICBvdXRwdXQuc2V0KFxyXG4gICAgICBieXRlcy5zbGljZShlb2lJbmRleCksXHJcbiAgICAgIGVvaUluZGV4ICsgY29tbWVudC5sZW5ndGhcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBCbG9iKFxyXG4gICAgICBbb3V0cHV0XSxcclxuICAgICAgeyB0eXBlOiAnaW1hZ2UvanBlZycgfVxyXG4gICAgKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFkUG5nVG9NaW5pbXVtKFxyXG4gIGJsb2I6IEJsb2IsXHJcbiAgbWluQnl0ZXM6IG51bWJlclxyXG4pOiBQcm9taXNlPEJsb2I+IHtcclxuICByZXR1cm4gYmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oKGJ1ZmZlcikgPT4ge1xyXG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgYnl0ZXMubGVuZ3RoIDwgMTIgfHxcclxuICAgICAgYnl0ZXNbMF0gIT09IDB4ODkgfHxcclxuICAgICAgYnl0ZXNbMV0gIT09IDB4NTAgfHxcclxuICAgICAgYnl0ZXNbMl0gIT09IDB4NGUgfHxcclxuICAgICAgYnl0ZXNbM10gIT09IDB4NDcgfHxcclxuICAgICAgYnl0ZXNbNF0gIT09IDB4MGQgfHxcclxuICAgICAgYnl0ZXNbNV0gIT09IDB4MGEgfHxcclxuICAgICAgYnl0ZXNbNl0gIT09IDB4MWEgfHxcclxuICAgICAgYnl0ZXNbN10gIT09IDB4MGFcclxuICAgICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ0Nhbm5vdCBwYWQgUE5HOiBpbnZhbGlkIFBORyBkYXRhLidcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYWRkaW5nQnl0ZXMgPVxyXG4gICAgICBtaW5CeXRlcyAtIGJ5dGVzLmxlbmd0aDtcclxuXHJcbiAgICBpZiAocGFkZGluZ0J5dGVzIDw9IDApIHtcclxuICAgICAgcmV0dXJuIGJsb2I7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY2h1bmtEYXRhTGVuZ3RoID1cclxuICAgICAgcGFkZGluZ0J5dGVzIC0gMTI7XHJcblxyXG4gICAgaWYgKGNodW5rRGF0YUxlbmd0aCA8IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICdDYW5ub3QgcGFkIFBORzogcGFkZGluZyBpcyB0b28gc21hbGwuJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNodW5rID0gY3JlYXRlUG5nVGV4dENodW5rKFxyXG4gICAgICBjaHVua0RhdGFMZW5ndGhcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgaWVuZEluZGV4ID1cclxuICAgICAgYnl0ZXMubGVuZ3RoIC0gMTI7XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0ID0gbmV3IFVpbnQ4QXJyYXkoXHJcbiAgICAgIGJ5dGVzLmxlbmd0aCArIGNodW5rLmxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICBvdXRwdXQuc2V0KFxyXG4gICAgICBieXRlcy5zbGljZSgwLCBpZW5kSW5kZXgpLFxyXG4gICAgICAwXHJcbiAgICApO1xyXG5cclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGNodW5rLFxyXG4gICAgICBpZW5kSW5kZXhcclxuICAgICk7XHJcblxyXG4gICAgb3V0cHV0LnNldChcclxuICAgICAgYnl0ZXMuc2xpY2UoaWVuZEluZGV4KSxcclxuICAgICAgaWVuZEluZGV4ICsgY2h1bmsubGVuZ3RoXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBuZXcgQmxvYihcclxuICAgICAgW291dHB1dF0sXHJcbiAgICAgIHsgdHlwZTogJ2ltYWdlL3BuZycgfVxyXG4gICAgKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUG5nVGV4dENodW5rKFxyXG4gIGRhdGFMZW5ndGg6IG51bWJlclxyXG4pOiBVaW50OEFycmF5IHtcclxuICBjb25zdCBjaHVuayA9IG5ldyBVaW50OEFycmF5KFxyXG4gICAgMTIgKyBkYXRhTGVuZ3RoXHJcbiAgKTtcclxuXHJcbiAgLy8gQ2h1bmsgbGVuZ3RoXHJcbiAgY2h1bmtbMF0gPVxyXG4gICAgKGRhdGFMZW5ndGggPj4gMjQpICYgMHhmZjtcclxuXHJcbiAgY2h1bmtbMV0gPVxyXG4gICAgKGRhdGFMZW5ndGggPj4gMTYpICYgMHhmZjtcclxuXHJcbiAgY2h1bmtbMl0gPVxyXG4gICAgKGRhdGFMZW5ndGggPj4gOCkgJiAweGZmO1xyXG5cclxuICBjaHVua1szXSA9XHJcbiAgICBkYXRhTGVuZ3RoICYgMHhmZjtcclxuXHJcbiAgLy8gQ2h1bmsgdHlwZTogdEVYdFxyXG4gIGNodW5rWzRdID0gMHg3NDtcclxuICBjaHVua1s1XSA9IDB4NDU7XHJcbiAgY2h1bmtbNl0gPSAweDU4O1xyXG4gIGNodW5rWzddID0gMHg3NDtcclxuXHJcbiAgLy8gTGVhdmUgdGhlIHRleHQgZGF0YSBhcyB6ZXJvIGJ5dGVzLlxyXG4gIC8vIENSQyBpcyBjYWxjdWxhdGVkIGJlbG93LlxyXG4gIGNvbnN0IGNyYyA9IGNyYzMyKFxyXG4gICAgY2h1bmsuc2xpY2UoNCwgOCArIGRhdGFMZW5ndGgpXHJcbiAgKTtcclxuXHJcbiAgY2h1bmtbOF0gPVxyXG4gICAgKGNyYyA+Pj4gMjQpICYgMHhmZjtcclxuXHJcbiAgY2h1bmtbOV0gPVxyXG4gICAgKGNyYyA+Pj4gMTYpICYgMHhmZjtcclxuXHJcbiAgY2h1bmtbMTBdID1cclxuICAgIChjcmMgPj4+IDgpICYgMHhmZjtcclxuXHJcbiAgY2h1bmtbMTFdID1cclxuICAgIGNyYyAmIDB4ZmY7XHJcblxyXG4gIHJldHVybiBjaHVuaztcclxufVxyXG5cclxuZnVuY3Rpb24gY3JjMzIoXHJcbiAgYnl0ZXM6IFVpbnQ4QXJyYXlcclxuKTogbnVtYmVyIHtcclxuICBsZXQgY3JjID0gMHhmZmZmZmZmZjtcclxuXHJcbiAgZm9yIChjb25zdCBieXRlIG9mIGJ5dGVzKSB7XHJcbiAgICBjcmMgXj0gYnl0ZTtcclxuXHJcbiAgICBmb3IgKGxldCBiaXQgPSAwOyBiaXQgPCA4OyBiaXQrKykge1xyXG4gICAgICBjcmMgPVxyXG4gICAgICAgIChjcmMgPj4+IDEpIF5cclxuICAgICAgICAoY3JjICYgMVxyXG4gICAgICAgICAgPyAweGVkYjg4MzIwXHJcbiAgICAgICAgICA6IDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChjcmMgXiAweGZmZmZmZmZmKSA+Pj4gMDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVwbGFjZUV4dGVuc2lvbihcclxuICBmaWxlTmFtZTogc3RyaW5nLFxyXG4gIGV4dGVuc2lvbjogc3RyaW5nXHJcbik6IHN0cmluZyB7XHJcbiAgY29uc3QgbGFzdERvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XHJcblxyXG4gIGlmIChsYXN0RG90ID09PSAtMSkge1xyXG4gICAgcmV0dXJuIGAke2ZpbGVOYW1lfS4ke2V4dGVuc2lvbn1gO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGAke2ZpbGVOYW1lLnNsaWNlKDAsIGxhc3REb3QpfS4ke2V4dGVuc2lvbn1gO1xyXG59OyIsImltcG9ydCB0eXBlIHtcclxuICBGaWxlUHJvY2Vzc2VkTWVzc2FnZSxcclxuICBGaWxlUHJvY2Vzc2luZ0ZhaWxlZE1lc3NhZ2UsXHJcbn0gZnJvbSAnLi4vY29yZS9tZXNzYWdlcyc7XHJcbmltcG9ydCB7IHBhcnNlQ29uc3RyYWludHMgfSBmcm9tICcuLi9jb3JlL3BhcnNlci9wYXJzZUNvbnN0cmFpbnRzJztcclxuaW1wb3J0IHsgZXh0cmFjdFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9jb3JlL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcclxuaW1wb3J0IHsgaW5zcGVjdEZpbGUgfSBmcm9tICcuLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XHJcbmltcG9ydCB7IHZhbGlkYXRlRmlsZSB9IGZyb20gJy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZSc7XHJcbmltcG9ydCB7IGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4nO1xyXG5pbXBvcnQgeyB0cmFuc2Zvcm1JbWFnZSB9IGZyb20gJy4uL2NvcmUvdHJhbnNmb3JtZXIvdHJhbnNmb3JtSW1hZ2UnO1xyXG5pbXBvcnQgeyBjb21wcmVzc0ltYWdlIH0gZnJvbSAnLi4vY29yZS90cmFuc2Zvcm1lci9jb21wcmVzc0ltYWdlJztcclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29udGVudFNjcmlwdCh7XHJcbiAgbWF0Y2hlczogWyc8YWxsX3VybHM+J10sXHJcblxyXG4gIG1haW4oKSB7XHJcbiAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBDb250ZW50IHNjcmlwdCBsb2FkZWQnKTtcclxuXHJcbiAgICBjb25zdCBkZXRlY3RlZElucHV0cyA9IG5ldyBXZWFrU2V0PEhUTUxJbnB1dEVsZW1lbnQ+KCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJGaWxlSW5wdXQoaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpIHtcclxuICAgICAgLy8gRG9uJ3QgcHJvY2VzcyB0aGUgc2FtZSBpbnB1dCB0d2ljZVxyXG4gICAgICBpZiAoZGV0ZWN0ZWRJbnB1dHMuaGFzKGlucHV0KSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGV0ZWN0ZWRJbnB1dHMuYWRkKGlucHV0KTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCdbRmlsZVRocm91Z2hdIFVwbG9hZCBmaWVsZCBkZXRlY3RlZCcsIHtcclxuICAgICAgICBhY2NlcHQ6IGlucHV0LmFjY2VwdCB8fCAnTm90IHNwZWNpZmllZCcsXHJcbiAgICAgICAgbXVsdGlwbGU6IGlucHV0Lm11bHRpcGxlLFxyXG4gICAgICAgIG5hbWU6IGlucHV0Lm5hbWUgfHwgJ05vdCBzcGVjaWZpZWQnLFxyXG4gICAgICAgIGlkOiBpbnB1dC5pZCB8fCAnTm90IHNwZWNpZmllZCcsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8xLkV4dHJhY3QgY29udGV4dFxyXG4gICAgICBjb25zdCBjb250ZXh0ID0gZXh0cmFjdFVwbG9hZENvbnRleHQoaW5wdXQpO1xyXG4gICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgY29udGV4dCcsIGNvbnRleHQpO1xyXG4gICAgICAvLzIuUGFyc2UgY29uc3RyYWludHNcclxuICAgICAgY29uc3QgY29uc3RyYWludHMgPSBwYXJzZUNvbnN0cmFpbnRzKGNvbnRleHQpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGNvbnN0cmFpbnRzJyxcclxuICAgICAgICBjb25zdHJhaW50c1xyXG4gICAgICApO1xyXG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZXZlbnQpID0+IHtcclxuICAgICAgICBpZiAoZXZlbnQuaXNUcnVzdGVkID09PSBmYWxzZSkge1xyXG4gIHJldHVybjtcclxufVxyXG4gICAgICAgIGNvbnN0IGZpbGUgPSBpbnB1dC5maWxlcz8uWzBdO1xyXG5cclxuICAgICAgICBpZiAoIWZpbGUpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IGluc3BlY3RGaWxlKGZpbGUpO1xyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAnW0ZpbGVUaHJvdWdoXSBTZWxlY3RlZCBmaWxlJyxcclxuICAgICAgICAgICAgZmlsZUluZm9cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICAvLzMuVmFsaWRhdGUgdGhlIGZpbGVcclxuICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUZpbGUoZmlsZUluZm8sIGNvbnN0cmFpbnRzKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAnW0ZpbGVUaHJvdWdoXSBWYWxpZGF0aW9uIHJlc3VsdCcsXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb25cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgLy80LkNyZWF0ZSB0cmFuc2Zvcm1hdGlvbiBwbGFuXHJcbiAgICAgICAgICBjb25zdCBwbGFuID0gY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuKGZpbGVJbmZvLCBjb25zdHJhaW50cyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1hdGlvbiBwbGFuJywgcGxhbik7XHJcbiAgICAgICBpZiAoT2JqZWN0LmtleXMocGxhbikubGVuZ3RoID4gMCkge1xyXG4gIGxldCB0cmFuc2Zvcm1lZEZpbGUgPSBmaWxlO1xyXG4gIGxldCBmaW5hbEZpbGUgPSBmaWxlO1xyXG4gIGxldCBmaW5hbEluZm8gPSBmaWxlSW5mbztcclxuICBsZXQgcHJvY2Vzc2luZ1N1Y2NlZWRlZCA9IHRydWU7XHJcblxyXG4gIHRyeSB7XHJcbiAgICB0cmFuc2Zvcm1lZEZpbGUgPVxyXG4gICAgICBhd2FpdCB0cmFuc2Zvcm1JbWFnZShmaWxlLCBwbGFuKTtcclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZEluZm8gPVxyXG4gICAgICBhd2FpdCBpbnNwZWN0RmlsZSh0cmFuc2Zvcm1lZEZpbGUpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAnW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1lZCBmaWxlJyxcclxuICAgICAgdHJhbnNmb3JtZWRJbmZvXHJcbiAgICApO1xyXG5cclxuICAgIGZpbmFsRmlsZSA9IHRyYW5zZm9ybWVkRmlsZTtcclxuICAgIGZpbmFsSW5mbyA9IHRyYW5zZm9ybWVkSW5mbztcclxuICB9XHJcbmNhdGNoIChlcnJvcikge1xyXG4gIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAnW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1hdGlvbiBmYWlsZWQnLFxyXG4gICAgZXJyb3JcclxuICApO1xyXG5cclxuICBwcm9jZXNzaW5nU3VjY2VlZGVkID0gZmFsc2U7XHJcblxyXG4gIGNvbnN0IG1lc3NhZ2U6IEZpbGVQcm9jZXNzaW5nRmFpbGVkTWVzc2FnZSA9IHtcclxuICAgIHR5cGU6ICdmaWxlLXByb2Nlc3NpbmctZmFpbGVkJyxcclxuICAgIG9yaWdpbmFsOiBmaWxlSW5mbyxcclxuICAgIGVycm9yOlxyXG4gICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yXHJcbiAgICAgICAgPyBlcnJvci5tZXNzYWdlXHJcbiAgICAgICAgOiAnVW5rbm93biB0cmFuc2Zvcm1hdGlvbiBlcnJvci4nLFxyXG4gIH07XHJcblxyXG4gIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlKTtcclxuXHJcbiAgcmV0dXJuO1xyXG59XHJcblxyXG4gIGlmIChwbGFuLmNvbXByZXNzKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBmaW5hbEZpbGUgPSBhd2FpdCBjb21wcmVzc0ltYWdlKFxyXG4gICAgICAgIHRyYW5zZm9ybWVkRmlsZSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBtaW5CeXRlczogcGxhbi5jb21wcmVzcy5taW5CeXRlcyxcclxuICAgICAgICAgIG1heEJ5dGVzOiBwbGFuLmNvbXByZXNzLm1heEJ5dGVzLFxyXG4gICAgICAgICAgZm9ybWF0OiBwbGFuLmNvbXByZXNzLmZvcm1hdCxcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgICBmaW5hbEluZm8gPVxyXG4gICAgICAgIGF3YWl0IGluc3BlY3RGaWxlKGZpbmFsRmlsZSk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAnW0ZpbGVUaHJvdWdoXSBDb21wcmVzc2VkIGZpbGUnLFxyXG4gICAgICAgIGZpbmFsSW5mb1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5jYXRjaCAoZXJyb3IpIHtcclxuICBjb25zb2xlLmVycm9yKFxyXG4gICAgJ1tGaWxlVGhyb3VnaF0gQ29tcHJlc3Npb24gZmFpbGVkJyxcclxuICAgIGVycm9yXHJcbiAgKTtcclxuXHJcbiAgcHJvY2Vzc2luZ1N1Y2NlZWRlZCA9IGZhbHNlO1xyXG5cclxuICBjb25zdCBtZXNzYWdlOiBGaWxlUHJvY2Vzc2luZ0ZhaWxlZE1lc3NhZ2UgPSB7XHJcbiAgICB0eXBlOiAnZmlsZS1wcm9jZXNzaW5nLWZhaWxlZCcsXHJcbiAgICBvcmlnaW5hbDogZmlsZUluZm8sXHJcbiAgICBlcnJvcjpcclxuICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxyXG4gICAgICAgID8gZXJyb3IubWVzc2FnZVxyXG4gICAgICAgIDogJ1Vua25vd24gY29tcHJlc3Npb24gZXJyb3IuJyxcclxuICB9O1xyXG5cclxuICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XHJcblxyXG4gIHJldHVybjtcclxufVxyXG4gIH1cclxuXHJcbiAgcmVwbGFjZUlucHV0RmlsZShpbnB1dCwgZmluYWxGaWxlKTtcclxuXHJcbiAgaW5wdXQuZGlzcGF0Y2hFdmVudChcclxuICAgIG5ldyBFdmVudCgnY2hhbmdlJywge1xyXG4gICAgICBidWJibGVzOiB0cnVlLFxyXG4gICAgfSlcclxuICApO1xyXG5cclxuICBjb25zb2xlLmxvZyhcclxuICAgICdbRmlsZVRocm91Z2hdIEZpbmFsIGZpbGUgaW5qZWN0ZWQnLFxyXG4gICAge1xyXG4gICAgICBuYW1lOiBmaW5hbEZpbGUubmFtZSxcclxuICAgICAgdHlwZTogZmluYWxGaWxlLnR5cGUsXHJcbiAgICAgIHNpemVCeXRlczogZmluYWxGaWxlLnNpemUsXHJcbiAgICB9XHJcbiAgKTtcclxuXHJcbmNvbnN0IG1lc3NhZ2U6IEZpbGVQcm9jZXNzZWRNZXNzYWdlID0ge1xyXG4gIHR5cGU6ICdmaWxlLXByb2Nlc3NlZCcsXHJcbiAgY2hhbmdlZDpcclxuICAgIGZpbGVJbmZvLm5hbWUgIT09IGZpbmFsSW5mby5uYW1lIHx8XHJcbiAgICBmaWxlSW5mby5taW1lVHlwZSAhPT0gZmluYWxJbmZvLm1pbWVUeXBlIHx8XHJcbiAgICBmaWxlSW5mby5zaXplQnl0ZXMgIT09IGZpbmFsSW5mby5zaXplQnl0ZXMgfHxcclxuICAgIGZpbGVJbmZvLndpZHRoICE9PSBmaW5hbEluZm8ud2lkdGggfHxcclxuICAgIGZpbGVJbmZvLmhlaWdodCAhPT0gZmluYWxJbmZvLmhlaWdodCxcclxuICBvcmlnaW5hbDogZmlsZUluZm8sXHJcbiAgZmluYWw6IGZpbmFsSW5mbyxcclxufTtcclxuXHJcbiAgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKG1lc3NhZ2UpO1xyXG59XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tGaWxlVGhyb3VnaF0gQ291bGQgbm90IGluc3BlY3QgZmlsZScsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlcGxhY2VJbnB1dEZpbGUoXHJcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXHJcbiAgZmlsZTogRmlsZVxyXG4pIHtcclxuICBjb25zdCBkYXRhVHJhbnNmZXIgPSBuZXcgRGF0YVRyYW5zZmVyKCk7XHJcblxyXG4gIGRhdGFUcmFuc2Zlci5pdGVtcy5hZGQoZmlsZSk7XHJcblxyXG4gIGlucHV0LmZpbGVzID0gZGF0YVRyYW5zZmVyLmZpbGVzO1xyXG59XHJcblxyXG4gICAgZnVuY3Rpb24gc2NhbkZvckZpbGVJbnB1dHMocm9vdDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KSB7XHJcbiAgICAgIGNvbnN0IGlucHV0cyA9XHJcbiAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xyXG5cclxuICAgICAgaW5wdXRzLmZvckVhY2gocmVnaXN0ZXJGaWxlSW5wdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNjYW4gaW5wdXRzIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgcGFnZVxyXG4gICAgc2NhbkZvckZpbGVJbnB1dHMoKTtcclxuXHJcbiAgICAvLyBXYXRjaCBmb3IgaW5wdXRzIGFkZGVkIGxhdGVyXHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcclxuICAgICAgZm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xyXG4gICAgICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBUaGUgYWRkZWQgZWxlbWVudCBpdHNlbGYgbWlnaHQgYmUgYSBmaWxlIGlucHV0XHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmXHJcbiAgICAgICAgICAgIG5vZGUudHlwZSA9PT0gJ2ZpbGUnXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgcmVnaXN0ZXJGaWxlSW5wdXQobm9kZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gT3IgaXQgbWlnaHQgY29udGFpbiBmaWxlIGlucHV0c1xyXG4gICAgICAgICAgc2NhbkZvckZpbGVJbnB1dHMobm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwge1xyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICAgIHN1YnRyZWU6IHRydWUsXHJcbiAgICB9KTtcclxuICB9LFxyXG59KTsiLCIvLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvZ2dlci50c1xuZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG5cdGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcblx0aWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSBtZXRob2QoYFt3eHRdICR7YXJncy5zaGlmdCgpfWAsIC4uLmFyZ3MpO1xuXHRlbHNlIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xufVxuLyoqIFdyYXBwZXIgYXJvdW5kIGBjb25zb2xlYCB3aXRoIGEgXCJbd3h0XVwiIHByZWZpeCAqL1xuY29uc3QgbG9nZ2VyID0ge1xuXHRkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuXHRsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG5cdHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuXHRlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBsb2dnZXIgfTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy50c1xudmFyIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgPSBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuXHRzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcblx0Y29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcblx0XHRzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcblx0XHR0aGlzLm5ld1VybCA9IG5ld1VybDtcblx0XHR0aGlzLm9sZFVybCA9IG9sZFVybDtcblx0fVxufTtcbi8qKlxuKiBSZXR1cm5zIGFuIGV2ZW50IG5hbWUgdW5pcXVlIHRvIHRoZSBleHRlbnNpb24gYW5kIGNvbnRlbnQgc2NyaXB0IHRoYXQnc1xuKiBydW5uaW5nLlxuKi9cbmZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcblx0cmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LCBnZXRVbmlxdWVFdmVudE5hbWUgfTtcbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLnRzXG5jb25zdCBzdXBwb3J0c05hdmlnYXRpb25BcGkgPSB0eXBlb2YgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG4vKipcbiogQ3JlYXRlIGEgdXRpbCB0aGF0IHdhdGNoZXMgZm9yIFVSTCBjaGFuZ2VzLCBkaXNwYXRjaGluZyB0aGUgY3VzdG9tIGV2ZW50IHdoZW5cbiogZGV0ZWN0ZWQuIFN0b3BzIHdhdGNoaW5nIHdoZW4gY29udGVudCBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuIFVzZXMgTmF2aWdhdGlvblxuKiBBUEkgd2hlbiBhdmFpbGFibGUsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuXHRsZXQgbGFzdFVybDtcblx0bGV0IHdhdGNoaW5nID0gZmFsc2U7XG5cdHJldHVybiB7IHJ1bigpIHtcblx0XHRpZiAod2F0Y2hpbmcpIHJldHVybjtcblx0XHR3YXRjaGluZyA9IHRydWU7XG5cdFx0bGFzdFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0aWYgKHN1cHBvcnRzTmF2aWdhdGlvbkFwaSkgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJuYXZpZ2F0ZVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwoZXZlbnQuZGVzdGluYXRpb24udXJsKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiA9PT0gbGFzdFVybC5ocmVmKSByZXR1cm47XG5cdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0fSwgeyBzaWduYWw6IGN0eC5zaWduYWwgfSk7XG5cdFx0ZWxzZSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiAhPT0gbGFzdFVybC5ocmVmKSB7XG5cdFx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdFx0fVxuXHRcdH0sIDFlMyk7XG5cdH0gfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC50c1xuLyoqXG4qIEltcGxlbWVudHNcbiogW2BBYm9ydENvbnRyb2xsZXJgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRDb250cm9sbGVyKS5cbiogVXNlZCB0byBkZXRlY3QgYW5kIHN0b3AgY29udGVudCBzY3JpcHQgY29kZSB3aGVuIHRoZSBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuXG4qXG4qIEl0IGFsc28gcHJvdmlkZXMgc2V2ZXJhbCB1dGlsaXRpZXMgbGlrZSBgY3R4LnNldFRpbWVvdXRgIGFuZFxuKiBgY3R4LnNldEludGVydmFsYCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIGNvbnRlbnQgc2NyaXB0cyBpbnN0ZWFkIG9mXG4qIGB3aW5kb3cuc2V0VGltZW91dGAgb3IgYHdpbmRvdy5zZXRJbnRlcnZhbGAuXG4qXG4qIFRvIGNyZWF0ZSBjb250ZXh0IGZvciB0ZXN0aW5nLCB5b3UgY2FuIHVzZSB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvcjpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfSBmcm9tICd3eHQvdXRpbHMvY29udGVudC1zY3JpcHRzLWNvbnRleHQnO1xuKlxuKiB0ZXN0KCdzdG9yYWdlIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZCcsICgpID0+IHtcbiogICBjb25zdCBjdHggPSBuZXcgQ29udGVudFNjcmlwdENvbnRleHQoJ3Rlc3QnKTtcbiogICBjb25zdCBpdGVtID0gc3RvcmFnZS5kZWZpbmVJdGVtKCdsb2NhbDpjb3VudCcsIHsgZGVmYXVsdFZhbHVlOiAwIH0pO1xuKiAgIGNvbnN0IHdhdGNoZXIgPSB2aS5mbigpO1xuKlxuKiAgIGNvbnN0IHVud2F0Y2ggPSBpdGVtLndhdGNoKHdhdGNoZXIpO1xuKiAgIGN0eC5vbkludmFsaWRhdGVkKHVud2F0Y2gpOyAvLyBMaXN0ZW4gZm9yIGludmFsaWRhdGUgaGVyZVxuKlxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFdpdGgoMSwgMCk7XG4qXG4qICAgY3R4Lm5vdGlmeUludmFsaWRhdGVkKCk7IC8vIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGludmFsaWRhdGUgdGhlIGNvbnRleHRcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDIpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qIH0pO1xuKiBgYGBcbiovXG52YXIgQ29udGVudFNjcmlwdENvbnRleHQgPSBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG5cdHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiKTtcblx0aWQ7XG5cdGFib3J0Q29udHJvbGxlcjtcblx0bG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuXHRjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuXHRcdHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblx0XHR0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0XHR0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG5cdFx0dGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcblx0fVxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG5cdH1cblx0YWJvcnQocmVhc29uKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG5cdH1cblx0Z2V0IGlzSW52YWxpZCgpIHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lPy5pZCA9PSBudWxsKSB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0cmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG5cdH1cblx0Z2V0IGlzVmFsaWQoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmlzSW52YWxpZDtcblx0fVxuXHQvKipcblx0KiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXNcblx0KiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcblx0KiAgIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG5cdCogICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuXHQqICAgfSk7XG5cdCogICAvLyAuLi5cblx0KiAgIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcblx0KlxuXHQqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cblx0Ki9cblx0b25JbnZhbGlkYXRlZChjYikge1xuXHRcdHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdFx0cmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdH1cblx0LyoqXG5cdCogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb25cblx0KiB0aGF0IHNob3VsZG4ndCBydW4gYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuXHQqICAgICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuXHQqXG5cdCogICAgIC8vIC4uLlxuXHQqICAgfTtcblx0Ki9cblx0YmxvY2soKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHt9KTtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2Vsc1xuXHQqIHRoZSByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGVcblx0KiByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsSWRsZUNhbGxiYWNrYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0sIG9wdGlvbnMpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0YWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG5cdFx0fVxuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4odHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsIGhhbmRsZXIsIHtcblx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRzaWduYWw6IHRoaXMuc2lnbmFsXG5cdFx0fSk7XG5cdH1cblx0LyoqXG5cdCogQGludGVybmFsXG5cdCogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG5cdCovXG5cdG5vdGlmeUludmFsaWRhdGVkKCkge1xuXHRcdHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuXHRcdGxvZ2dlci5kZWJ1ZyhgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGApO1xuXHR9XG5cdHN0b3BPbGRTY3JpcHRzKCkge1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgeyBkZXRhaWw6IHtcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSB9KSk7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnM/Lm5vU2NyaXB0U3RhcnRlZFBvc3RNZXNzYWdlKSB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDEyLDE1LDE2LDE3LDE4XSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VhQSxJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcs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QUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0lBQUMsQ0FBQyxHQUFFLElBQUUsSUFBSSxXQUFXO0tBQUM7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFHO0tBQUc7S0FBRztLQUFHO0tBQUc7S0FBRztLQUFHO0lBQUUsQ0FBQyxHQUFFLElBQUUsSUFBSSxXQUFXO0tBQUM7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7SUFBQyxDQUFDLEdBQUUsSUFBRSxJQUFJLFdBQVc7S0FBQztLQUFHO0tBQUc7S0FBRztLQUFFO0tBQUU7S0FBRTtLQUFFO0tBQUU7S0FBRztLQUFFO0tBQUc7S0FBRTtLQUFHO0tBQUU7S0FBRztLQUFFO0tBQUc7S0FBRTtJQUFFLENBQUMsR0FBRSxJQUFFLElBQUksTUFBTSxHQUFHO0lBQUUsRUFBRSxDQUFDO0lBQUUsTUFBTSxJQUFFLElBQUksTUFBTSxFQUFFO0lBQUUsRUFBRSxDQUFDO0lBQUUsTUFBTSxJQUFFLElBQUksTUFBTSxHQUFHO0lBQUUsRUFBRSxDQUFDO0lBQUUsTUFBTSxJQUFFLElBQUksTUFBTSxHQUFHO0lBQUUsRUFBRSxDQUFDO0lBQUUsTUFBTSxJQUFFLElBQUksTUFBTSxFQUFFO0lBQUUsRUFBRSxDQUFDO0lBQUUsTUFBTSxJQUFFLElBQUksTUFBTSxDQUFDO0lBQUUsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRTtLQUFDLEtBQUssY0FBWSxHQUFFLEtBQUssYUFBVyxHQUFFLEtBQUssYUFBVyxHQUFFLEtBQUssUUFBTSxHQUFFLEtBQUssYUFBVyxHQUFFLEtBQUssWUFBVSxLQUFHLEVBQUU7SUFBTTtJQUFDLElBQUksR0FBRSxHQUFFO0lBQUUsU0FBUyxFQUFFLEdBQUUsR0FBRTtLQUFDLEtBQUssV0FBUyxHQUFFLEtBQUssV0FBUyxHQUFFLEtBQUssWUFBVTtJQUFDO0lBQUMsRUFBRSxDQUFDO0lBQUUsTUFBTSxLQUFFLE1BQUcsSUFBRSxNQUFJLEVBQUUsS0FBRyxFQUFFLE9BQUssTUFBSSxLQUFJLEtBQUcsR0FBRSxNQUFJO0tBQUMsRUFBRSxZQUFZLEVBQUUsYUFBVyxNQUFJLEdBQUUsRUFBRSxZQUFZLEVBQUUsYUFBVyxNQUFJLElBQUU7SUFBRyxHQUFFLEtBQUcsR0FBRSxHQUFFLE1BQUk7S0FBQyxFQUFFLFdBQVMsS0FBRyxLQUFHLEVBQUUsVUFBUSxLQUFHLEVBQUUsV0FBUyxPQUFNLEVBQUUsR0FBRSxFQUFFLE1BQU0sR0FBRSxFQUFFLFNBQU8sS0FBRyxLQUFHLEVBQUUsVUFBUyxFQUFFLFlBQVUsSUFBRSxPQUFLLEVBQUUsVUFBUSxLQUFHLEVBQUUsV0FBUyxPQUFNLEVBQUUsWUFBVTtJQUFFLEdBQUUsS0FBRyxHQUFFLEdBQUUsTUFBSTtLQUFDLEVBQUUsR0FBRSxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsSUFBRSxFQUFFO0lBQUMsR0FBRSxLQUFHLEdBQUUsTUFBSTtLQUFDLElBQUksSUFBRTtLQUFFO01BQUcsS0FBRyxJQUFFLEdBQUUsT0FBSyxHQUFFLE1BQUk7WUFBUSxFQUFFLElBQUU7S0FBRyxPQUFPLE1BQUk7SUFBQyxHQUFFLEtBQUcsR0FBRSxHQUFFLE1BQUk7S0FBQyxNQUFNLElBQUUsSUFBSSxNQUFNLEVBQUU7S0FBRSxJQUFJLEdBQUUsR0FBRSxJQUFFO0tBQUUsS0FBSSxJQUFFLEdBQUUsS0FBRyxHQUFFLEtBQUksSUFBRSxJQUFFLEVBQUUsSUFBRSxNQUFJLEdBQUUsRUFBRSxLQUFHO0tBQUUsS0FBSSxJQUFFLEdBQUUsS0FBRyxHQUFFLEtBQUk7TUFBQyxJQUFJLElBQUUsRUFBRSxJQUFFLElBQUU7TUFBRyxNQUFJLE1BQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxFQUFFLEVBQUUsSUFBRyxDQUFDO0tBQUU7SUFBQyxHQUFFLEtBQUUsTUFBRztLQUFDLElBQUk7S0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLFVBQVUsSUFBRSxLQUFHO0tBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxVQUFVLElBQUUsS0FBRztLQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsSUFBRyxLQUFJLEVBQUUsUUFBUSxJQUFFLEtBQUc7S0FBRSxFQUFFLFVBQVUsT0FBSyxHQUFFLEVBQUUsVUFBUSxFQUFFLGFBQVcsR0FBRSxFQUFFLFdBQVMsRUFBRSxVQUFRO0lBQUMsR0FBRSxLQUFFLE1BQUc7S0FBQyxFQUFFLFdBQVMsSUFBRSxFQUFFLEdBQUUsRUFBRSxNQUFNLElBQUUsRUFBRSxXQUFTLE1BQUksRUFBRSxZQUFZLEVBQUUsYUFBVyxFQUFFLFNBQVEsRUFBRSxTQUFPLEdBQUUsRUFBRSxXQUFTO0lBQUMsR0FBRSxLQUFHLEdBQUUsR0FBRSxHQUFFLE1BQUk7S0FBQyxNQUFNLElBQUUsSUFBRSxHQUFFLElBQUUsSUFBRTtLQUFFLE9BQU8sRUFBRSxLQUFHLEVBQUUsTUFBSSxFQUFFLE9BQUssRUFBRSxNQUFJLEVBQUUsTUFBSSxFQUFFO0lBQUUsR0FBRSxLQUFHLEdBQUUsR0FBRSxNQUFJO0tBQUMsTUFBTSxJQUFFLEVBQUUsS0FBSztLQUFHLElBQUksSUFBRSxLQUFHO0tBQUUsT0FBSyxLQUFHLEVBQUUsYUFBVyxJQUFFLEVBQUUsWUFBVSxFQUFFLEdBQUUsRUFBRSxLQUFLLElBQUUsSUFBRyxFQUFFLEtBQUssSUFBRyxFQUFFLEtBQUssS0FBRyxLQUFJLENBQUMsRUFBRSxHQUFFLEdBQUUsRUFBRSxLQUFLLElBQUcsRUFBRSxLQUFLLEtBQUksRUFBRSxLQUFLLEtBQUcsRUFBRSxLQUFLLElBQUcsSUFBRSxHQUFFLE1BQUk7S0FBRSxFQUFFLEtBQUssS0FBRztJQUFDLEdBQUUsS0FBRyxHQUFFLEdBQUUsTUFBSTtLQUFDLElBQUksR0FBRSxHQUFFLEdBQUUsR0FBRSxJQUFFO0tBQUUsSUFBRyxNQUFJLEVBQUUsVUFBUztNQUFHLElBQUUsTUFBSSxFQUFFLFlBQVksRUFBRSxVQUFRLE1BQUssTUFBSSxNQUFJLEVBQUUsWUFBWSxFQUFFLFVBQVEsU0FBTyxHQUFFLElBQUUsRUFBRSxZQUFZLEVBQUUsVUFBUSxNQUFLLE1BQUksSUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEtBQUcsSUFBRSxFQUFFLElBQUcsRUFBRSxHQUFFLElBQUUsSUFBRSxHQUFFLENBQUMsR0FBRSxJQUFFLEVBQUUsSUFBRyxNQUFJLE1BQUksS0FBRyxFQUFFLElBQUcsRUFBRSxHQUFFLEdBQUUsQ0FBQyxJQUFHLEtBQUksSUFBRSxFQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsSUFBRSxFQUFFLElBQUcsTUFBSSxNQUFJLEtBQUcsRUFBRSxJQUFHLEVBQUUsR0FBRSxHQUFFLENBQUM7WUFBVSxJQUFFLEVBQUU7S0FBVSxFQUFFLEdBQUUsS0FBSSxDQUFDO0lBQUMsR0FBRSxLQUFHLEdBQUUsTUFBSTtLQUFDLE1BQU0sSUFBRSxFQUFFLFVBQVMsSUFBRSxFQUFFLFVBQVUsYUFBWSxJQUFFLEVBQUUsVUFBVSxXQUFVLElBQUUsRUFBRSxVQUFVO0tBQU0sSUFBSSxHQUFFLEdBQUUsR0FBRSxJQUFFO0tBQUcsS0FBSSxFQUFFLFdBQVMsR0FBRSxFQUFFLFdBQVMsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksTUFBSSxFQUFFLElBQUUsTUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVUsSUFBRSxHQUFFLEVBQUUsTUFBTSxLQUFHLEtBQUcsRUFBRSxJQUFFLElBQUUsS0FBRztLQUFFLE9BQUssRUFBRSxXQUFTLElBQUcsSUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVUsSUFBRSxJQUFFLEVBQUUsSUFBRSxHQUFFLEVBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxNQUFNLEtBQUcsR0FBRSxFQUFFLFdBQVUsTUFBSSxFQUFFLGNBQVksRUFBRSxJQUFFLElBQUU7S0FBSSxLQUFJLEVBQUUsV0FBUyxHQUFFLElBQUUsRUFBRSxZQUFVLEdBQUUsS0FBRyxHQUFFLEtBQUksRUFBRSxHQUFFLEdBQUUsQ0FBQztLQUFFLElBQUU7S0FBRTtNQUFHLElBQUUsRUFBRSxLQUFLLElBQUcsRUFBRSxLQUFLLEtBQUcsRUFBRSxLQUFLLEVBQUUsYUFBWSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsSUFBRSxFQUFFLEtBQUssSUFBRyxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVUsR0FBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVUsR0FBRSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLE1BQU0sTUFBSSxFQUFFLE1BQU0sTUFBSSxFQUFFLE1BQU0sS0FBRyxFQUFFLE1BQU0sS0FBRyxFQUFFLE1BQU0sTUFBSSxHQUFFLEVBQUUsSUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUUsS0FBRyxHQUFFLEVBQUUsS0FBSyxLQUFHLEtBQUksRUFBRSxHQUFFLEdBQUUsQ0FBQztZQUFRLEVBQUUsWUFBVTtLQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsWUFBVSxFQUFFLEtBQUssTUFBSyxHQUFFLE1BQUk7TUFBQyxNQUFNLElBQUUsRUFBRSxVQUFTLElBQUUsRUFBRSxVQUFTLElBQUUsRUFBRSxVQUFVLGFBQVksSUFBRSxFQUFFLFVBQVUsV0FBVSxJQUFFLEVBQUUsVUFBVSxZQUFXLElBQUUsRUFBRSxVQUFVLFlBQVcsSUFBRSxFQUFFLFVBQVU7TUFBVyxJQUFJLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLElBQUU7TUFBRSxLQUFJLElBQUUsR0FBRSxLQUFHLEdBQUUsS0FBSSxFQUFFLFNBQVMsS0FBRztNQUFFLEtBQUksRUFBRSxJQUFFLEVBQUUsS0FBSyxFQUFFLFlBQVUsS0FBRyxHQUFFLElBQUUsRUFBRSxXQUFTLEdBQUUsSUFBRSxLQUFJLEtBQUksSUFBRSxFQUFFLEtBQUssSUFBRyxJQUFFLEVBQUUsSUFBRSxFQUFFLElBQUUsSUFBRSxLQUFHLEtBQUcsR0FBRSxJQUFFLE1BQUksSUFBRSxHQUFFLE1BQUssRUFBRSxJQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsTUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFHLElBQUUsR0FBRSxLQUFHLE1BQUksSUFBRSxFQUFFLElBQUUsS0FBSSxJQUFFLEVBQUUsSUFBRSxJQUFHLEVBQUUsV0FBUyxLQUFHLElBQUUsSUFBRyxNQUFJLEVBQUUsY0FBWSxLQUFHLEVBQUUsSUFBRSxJQUFFLEtBQUc7TUFBSyxJQUFHLE1BQUksR0FBRTtPQUFDLEdBQUU7UUFBQyxLQUFJLElBQUUsSUFBRSxHQUFFLE1BQUksRUFBRSxTQUFTLEtBQUk7UUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFHLEVBQUUsU0FBUyxJQUFFLE1BQUksR0FBRSxFQUFFLFNBQVMsRUFBRSxJQUFHLEtBQUc7T0FBQyxTQUFPLElBQUU7T0FBRyxLQUFJLElBQUUsR0FBRSxNQUFJLEdBQUUsS0FBSSxLQUFJLElBQUUsRUFBRSxTQUFTLElBQUcsTUFBSSxJQUFHLElBQUUsRUFBRSxLQUFLLEVBQUUsSUFBRyxJQUFFLE1BQUksRUFBRSxJQUFFLElBQUUsT0FBSyxNQUFJLEVBQUUsWUFBVSxJQUFFLEVBQUUsSUFBRSxJQUFFLE1BQUksRUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLElBQUUsS0FBRyxJQUFHO01BQUk7S0FBQyxFQUFBLENBQUcsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEdBQUUsRUFBRSxRQUFRO0lBQUMsR0FBRSxLQUFHLEdBQUUsR0FBRSxNQUFJO0tBQUMsSUFBSSxHQUFFLEdBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRTtLQUFFLEtBQUksTUFBSSxNQUFJLElBQUUsS0FBSSxJQUFFLElBQUcsRUFBRSxLQUFHLElBQUUsS0FBRyxLQUFHLE9BQU0sSUFBRSxHQUFFLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsS0FBRyxJQUFFLEtBQUcsSUFBRyxFQUFFLElBQUUsS0FBRyxNQUFJLE1BQUksSUFBRSxJQUFFLEVBQUUsUUFBUSxJQUFFLE1BQUksSUFBRSxNQUFJLEtBQUcsTUFBSSxLQUFHLEVBQUUsUUFBUSxJQUFFLEVBQUUsSUFBRyxFQUFFLFFBQVEsR0FBRyxNQUFJLEtBQUcsS0FBRyxFQUFFLFFBQVEsR0FBRyxLQUFHLEVBQUUsUUFBUSxHQUFHLElBQUcsSUFBRSxHQUFFLElBQUUsR0FBRSxNQUFJLEtBQUcsSUFBRSxLQUFJLElBQUUsS0FBRyxNQUFJLEtBQUcsSUFBRSxHQUFFLElBQUUsTUFBSSxJQUFFLEdBQUUsSUFBRTtJQUFHLEdBQUUsS0FBRyxHQUFFLEdBQUUsTUFBSTtLQUFDLElBQUksR0FBRSxHQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUU7S0FBRSxLQUFJLE1BQUksTUFBSSxJQUFFLEtBQUksSUFBRSxJQUFHLElBQUUsR0FBRSxLQUFHLEdBQUUsS0FBSSxJQUFHLElBQUUsR0FBRSxJQUFFLEVBQUUsS0FBRyxJQUFFLEtBQUcsSUFBRyxFQUFFLEVBQUUsSUFBRSxLQUFHLE1BQUksSUFBRztNQUFDLElBQUcsSUFBRSxHQUFFO09BQUcsRUFBRSxHQUFFLEdBQUUsRUFBRSxPQUFPO2FBQVEsS0FBRyxFQUFFO1dBQVEsTUFBSSxLQUFHLE1BQUksTUFBSSxFQUFFLEdBQUUsR0FBRSxFQUFFLE9BQU8sR0FBRSxNQUFLLEVBQUUsR0FBRSxJQUFHLEVBQUUsT0FBTyxHQUFFLEVBQUUsR0FBRSxJQUFFLEdBQUUsQ0FBQyxLQUFHLEtBQUcsTUFBSSxFQUFFLEdBQUUsSUFBRyxFQUFFLE9BQU8sR0FBRSxFQUFFLEdBQUUsSUFBRSxHQUFFLENBQUMsTUFBSSxFQUFFLEdBQUUsSUFBRyxFQUFFLE9BQU8sR0FBRSxFQUFFLEdBQUUsSUFBRSxJQUFHLENBQUM7TUFBRyxJQUFFLEdBQUUsSUFBRSxHQUFFLE1BQUksS0FBRyxJQUFFLEtBQUksSUFBRSxLQUFHLE1BQUksS0FBRyxJQUFFLEdBQUUsSUFBRSxNQUFJLElBQUUsR0FBRSxJQUFFO0tBQUU7SUFBQztJQUFFLElBQUksSUFBRSxDQUFDO0lBQUUsTUFBTSxLQUFHLEdBQUUsR0FBRSxHQUFFLE1BQUk7S0FBQyxFQUFFLEdBQUUsS0FBRyxJQUFFLElBQUUsSUFBRyxDQUFDLEdBQUUsRUFBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxDQUFDLEdBQUUsS0FBRyxFQUFFLFlBQVksSUFBSSxFQUFFLE9BQU8sU0FBUyxHQUFFLElBQUUsQ0FBQyxHQUFFLEVBQUUsT0FBTyxHQUFFLEVBQUUsV0FBUztJQUFDO0lBQUUsT0FBTyxFQUFFLFlBQVMsTUFBRztLQUFDLGFBQVM7TUFBQyxJQUFJLEdBQUUsR0FBRSxHQUFFLEdBQUU7TUFBRSxNQUFNLElBQUUsSUFBSSxNQUFNLEVBQUU7TUFBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxJQUFHLEtBQUksS0FBSSxFQUFFLEtBQUcsR0FBRSxJQUFFLEdBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRyxLQUFJLEVBQUUsT0FBSztNQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsSUFBRyxLQUFJLEtBQUksRUFBRSxLQUFHLEdBQUUsSUFBRSxHQUFFLElBQUUsS0FBRyxFQUFFLElBQUcsS0FBSSxFQUFFLE9BQUs7TUFBRSxLQUFJLE1BQUksR0FBRSxJQUFFLEdBQUUsS0FBSSxLQUFJLEVBQUUsS0FBRyxLQUFHLEdBQUUsSUFBRSxHQUFFLElBQUUsS0FBRyxFQUFFLEtBQUcsR0FBRSxLQUFJLEVBQUUsTUFBSSxPQUFLO01BQUUsS0FBSSxJQUFFLEdBQUUsS0FBRyxHQUFFLEtBQUksRUFBRSxLQUFHO01BQUUsS0FBSSxJQUFFLEdBQUUsS0FBRyxNQUFLLEVBQUUsSUFBRSxJQUFFLEtBQUcsR0FBRSxLQUFJLEVBQUUsRUFBRTtNQUFHLE9BQUssS0FBRyxNQUFLLEVBQUUsSUFBRSxJQUFFLEtBQUcsR0FBRSxLQUFJLEVBQUUsRUFBRTtNQUFHLE9BQUssS0FBRyxNQUFLLEVBQUUsSUFBRSxJQUFFLEtBQUcsR0FBRSxLQUFJLEVBQUUsRUFBRTtNQUFHLE9BQUssS0FBRyxNQUFLLEVBQUUsSUFBRSxJQUFFLEtBQUcsR0FBRSxLQUFJLEVBQUUsRUFBRTtNQUFHLEtBQUksRUFBRSxHQUFFLEtBQUksQ0FBQyxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLEtBQUcsRUFBRSxHQUFFLENBQUM7TUFBRSxJQUFFLElBQUksRUFBRSxHQUFFLEdBQUUsS0FBSSxHQUFFLENBQUMsR0FBRSxJQUFFLElBQUksRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxJQUFFLElBQUksRUFBRSxJQUFJLE1BQU0sQ0FBQyxHQUFFLEdBQUUsR0FBRSxJQUFHLENBQUM7S0FBQyxFQUFBLENBQUcsR0FBRSxJQUFFLENBQUMsSUFBRyxFQUFFLFNBQU8sSUFBSSxFQUFFLEVBQUUsV0FBVSxDQUFDLEdBQUUsRUFBRSxTQUFPLElBQUksRUFBRSxFQUFFLFdBQVUsQ0FBQyxHQUFFLEVBQUUsVUFBUSxJQUFJLEVBQUUsRUFBRSxTQUFRLENBQUMsR0FBRSxFQUFFLFNBQU8sR0FBRSxFQUFFLFdBQVMsR0FBRSxFQUFFLENBQUM7SUFBQyxHQUFFLEVBQUUsbUJBQWlCLEdBQUUsRUFBRSxtQkFBaUIsR0FBRSxHQUFFLEdBQUUsTUFBSTtLQUFDLElBQUksR0FBRSxHQUFFLElBQUU7S0FBRSxFQUFFLFFBQU0sS0FBRyxNQUFJLEVBQUUsS0FBSyxjQUFZLEVBQUUsS0FBSyxjQUFXLE1BQUc7TUFBQyxJQUFJLEdBQUUsSUFBRTtNQUFXLEtBQUksSUFBRSxHQUFFLEtBQUcsSUFBRyxLQUFJLE9BQUssR0FBRSxJQUFHLElBQUUsS0FBRyxNQUFJLEVBQUUsVUFBVSxJQUFFLElBQUcsT0FBTztNQUFFLElBQUcsTUFBSSxFQUFFLFVBQVUsT0FBSyxNQUFJLEVBQUUsVUFBVSxPQUFLLE1BQUksRUFBRSxVQUFVLEtBQUksT0FBTztNQUFFLEtBQUksSUFBRSxJQUFHLElBQUUsR0FBRSxLQUFJLElBQUcsTUFBSSxFQUFFLFVBQVUsSUFBRSxJQUFHLE9BQU87TUFBRSxPQUFPO0tBQUMsRUFBQSxDQUFHLENBQUMsSUFBRyxFQUFFLEdBQUUsRUFBRSxNQUFNLEdBQUUsRUFBRSxHQUFFLEVBQUUsTUFBTSxHQUFFLE1BQUcsTUFBRztNQUFDLElBQUk7TUFBRSxLQUFJLEVBQUUsR0FBRSxFQUFFLFdBQVUsRUFBRSxPQUFPLFFBQVEsR0FBRSxFQUFFLEdBQUUsRUFBRSxXQUFVLEVBQUUsT0FBTyxRQUFRLEdBQUUsRUFBRSxHQUFFLEVBQUUsT0FBTyxHQUFFLElBQUUsSUFBRyxLQUFHLEtBQUcsTUFBSSxFQUFFLFFBQVEsSUFBRSxFQUFFLEtBQUcsSUFBRztNQUFLLE9BQU8sRUFBRSxXQUFTLEtBQUcsSUFBRSxLQUFHLElBQUUsSUFBRSxHQUFFO0tBQUMsRUFBQSxDQUFHLENBQUMsR0FBRSxJQUFFLEVBQUUsVUFBUSxJQUFFLE1BQUksR0FBRSxJQUFFLEVBQUUsYUFBVyxJQUFFLE1BQUksR0FBRSxLQUFHLE1BQUksSUFBRSxNQUFJLElBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxLQUFHLEtBQUcsT0FBSyxJQUFFLEVBQUUsR0FBRSxHQUFFLEdBQUUsQ0FBQyxJQUFFLE1BQUksRUFBRSxZQUFVLE1BQUksS0FBRyxFQUFFLEdBQUUsS0FBRyxJQUFFLElBQUUsSUFBRyxDQUFDLEdBQUUsRUFBRSxHQUFFLEdBQUUsQ0FBQyxNQUFJLEVBQUUsR0FBRSxLQUFHLElBQUUsSUFBRSxJQUFHLENBQUMsS0FBSSxHQUFFLEdBQUUsR0FBRSxNQUFJO01BQUMsSUFBSTtNQUFFLEtBQUksRUFBRSxHQUFFLElBQUUsS0FBSSxDQUFDLEdBQUUsRUFBRSxHQUFFLElBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLElBQUUsR0FBRSxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsR0FBRSxFQUFFLFFBQVEsSUFBRSxFQUFFLEtBQUcsSUFBRyxDQUFDO01BQUUsRUFBRSxHQUFFLEVBQUUsV0FBVSxJQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsRUFBRSxXQUFVLElBQUUsQ0FBQztLQUFDLEVBQUEsQ0FBRyxHQUFFLEVBQUUsT0FBTyxXQUFTLEdBQUUsRUFBRSxPQUFPLFdBQVMsR0FBRSxJQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsRUFBRSxXQUFVLEVBQUUsU0FBUyxJQUFHLEVBQUUsQ0FBQyxHQUFFLEtBQUcsRUFBRSxDQUFDO0lBQUMsR0FBRSxFQUFFLGFBQVcsR0FBRSxHQUFFLE9BQUssRUFBRSxZQUFZLEVBQUUsVUFBUSxFQUFFLGNBQVksR0FBRSxFQUFFLFlBQVksRUFBRSxVQUFRLEVBQUUsY0FBWSxLQUFHLEdBQUUsRUFBRSxZQUFZLEVBQUUsVUFBUSxFQUFFLGNBQVksR0FBRSxNQUFJLElBQUUsRUFBRSxVQUFVLElBQUUsRUFBRSxNQUFJLEVBQUUsV0FBVSxLQUFJLEVBQUUsVUFBVSxLQUFHLEVBQUUsS0FBRyxJQUFFLEdBQUcsSUFBRyxFQUFFLFVBQVUsSUFBRSxFQUFFLENBQUMsRUFBRSxLQUFJLEVBQUUsYUFBVyxFQUFFLFVBQVMsRUFBRSxhQUFVLE1BQUc7S0FBQyxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEtBQUksQ0FBQyxLQUFHLE1BQUc7TUFBQyxPQUFLLEVBQUUsWUFBVSxFQUFFLEdBQUUsRUFBRSxNQUFNLEdBQUUsRUFBRSxTQUFPLEdBQUUsRUFBRSxXQUFTLEtBQUcsRUFBRSxZQUFVLE1BQUksRUFBRSxZQUFZLEVBQUUsYUFBVyxNQUFJLEVBQUUsUUFBTyxFQUFFLFdBQVMsR0FBRSxFQUFFLFlBQVU7S0FBRSxFQUFBLENBQUcsQ0FBQztJQUFDLEdBQUU7R0FBQztHQUFDLFNBQVMsSUFBRztJQUFDLE9BQU8sSUFBRSxLQUFHLElBQUUsR0FBRSxJQUFFO0tBQUMsR0FBRTtLQUFrQixHQUFFO0tBQWEsR0FBRTtLQUFHLE1BQUs7S0FBYSxNQUFLO0tBQWUsTUFBSztLQUFhLE1BQUs7S0FBc0IsTUFBSztLQUFlLE1BQUs7SUFBc0I7R0FBRTtHQUFDLFNBQVMsSUFBRztJQUFDLE9BQU8sSUFBRSxLQUFHLElBQUUsR0FBRSxJQUFFO0tBQUMsWUFBVztLQUFFLGlCQUFnQjtLQUFFLGNBQWE7S0FBRSxjQUFhO0tBQUUsVUFBUztLQUFFLFNBQVE7S0FBRSxTQUFRO0tBQUUsTUFBSztLQUFFLGNBQWE7S0FBRSxhQUFZO0tBQUUsU0FBUTtLQUFHLGdCQUFlO0tBQUcsY0FBYTtLQUFHLGFBQVk7S0FBRyxhQUFZO0tBQUcsa0JBQWlCO0tBQUUsY0FBYTtLQUFFLG9CQUFtQjtLQUFFLHVCQUFzQjtLQUFHLFlBQVc7S0FBRSxnQkFBZTtLQUFFLE9BQU07S0FBRSxTQUFRO0tBQUUsb0JBQW1CO0tBQUUsVUFBUztLQUFFLFFBQU87S0FBRSxXQUFVO0tBQUUsWUFBVztJQUFDO0dBQUU7R0FBQyxTQUFTLElBQUc7SUFBQyxJQUFHLEdBQUUsT0FBTztJQUFFLElBQUU7SUFBRSxNQUFLLEVBQUMsVUFBUyxHQUFFLGtCQUFpQixHQUFFLGlCQUFnQixHQUFFLFdBQVUsR0FBRSxXQUFVLE1BQUcsRUFBRSxHQUFFLElBQUUsSUFBRSxLQUFHLElBQUUsR0FBRSxLQUFHLEdBQUUsR0FBRSxHQUFFLE1BQUk7S0FBQyxJQUFJLElBQUUsUUFBTSxHQUFFLElBQUUsTUFBSSxLQUFHLE9BQU0sSUFBRTtLQUFFLE9BQUssTUFBSSxJQUFHO01BQUMsSUFBRSxJQUFFLE1BQUksTUFBSSxHQUFFLEtBQUc7TUFBRTtPQUFHLElBQUUsSUFBRSxFQUFFLE9BQUssR0FBRSxJQUFFLElBQUUsSUFBRTthQUFRLEVBQUU7TUFBRyxLQUFHLE9BQU0sS0FBRztLQUFLO0tBQUMsT0FBTyxJQUFFLEtBQUc7SUFBRSxJQUFHLElBQUUsV0FBVTtLQUFDLElBQUcsR0FBRSxPQUFPO0tBQUUsSUFBRTtLQUFFLE1BQU0sSUFBRSxJQUFJLG1CQUFpQjtNQUFDLElBQUksR0FBRSxJQUFFLENBQUM7TUFBRSxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsS0FBSSxLQUFJO09BQUMsSUFBRTtPQUFFLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksSUFBRSxJQUFFLElBQUUsYUFBVyxNQUFJLElBQUUsTUFBSTtPQUFFLEVBQUUsS0FBRztNQUFDO01BQUMsT0FBTztLQUFDLEVBQUEsQ0FBRyxDQUFDO0tBQUUsT0FBTyxLQUFHLEdBQUUsR0FBRSxHQUFFLE1BQUk7TUFBQyxNQUFNLElBQUUsR0FBRSxJQUFFLElBQUU7TUFBRSxLQUFHO01BQUcsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxJQUFFLE1BQUksSUFBRSxFQUFFLE9BQUssSUFBRSxFQUFFO01BQUssT0FBTSxDQUFDO0tBQUM7SUFBQyxFQUFFLEdBQUUsSUFBRSxFQUFFLEdBQUUsRUFBQyxZQUFXLEdBQUUsaUJBQWdCLEdBQUUsY0FBYSxHQUFFLFVBQVMsR0FBRSxTQUFRLEdBQUUsTUFBSyxHQUFFLGNBQWEsR0FBRSxnQkFBZSxHQUFFLGNBQWEsR0FBRSxhQUFZLEdBQUUsdUJBQXNCLEdBQUUsWUFBVyxHQUFFLGdCQUFlLEdBQUUsT0FBTSxHQUFFLFNBQVEsR0FBRSxvQkFBbUIsR0FBRSxXQUFVLEdBQUUsWUFBVyxNQUFHLEVBQUUsR0FBRSxJQUFFLEtBQUksSUFBRSxLQUFJLElBQUUsSUFBRyxJQUFFLEtBQUksSUFBRSxLQUFJLEtBQUcsR0FBRSxPQUFLLEVBQUUsTUFBSSxFQUFFLElBQUcsSUFBRyxLQUFFLE1BQUcsSUFBRSxLQUFHLElBQUUsSUFBRSxJQUFFLElBQUcsS0FBRSxNQUFHO0tBQUMsSUFBSSxJQUFFLEVBQUU7S0FBTyxPQUFLLEVBQUUsS0FBRyxJQUFHLEVBQUUsS0FBRztJQUFDLEdBQUUsS0FBRSxNQUFHO0tBQUMsSUFBSSxHQUFFLEdBQUUsR0FBRSxJQUFFLEVBQUU7S0FBTyxJQUFFLEVBQUUsV0FBVSxJQUFFO0tBQUU7TUFBRyxJQUFFLEVBQUUsS0FBSyxFQUFFLElBQUcsRUFBRSxLQUFLLEtBQUcsS0FBRyxJQUFFLElBQUUsSUFBRTtZQUFRLEVBQUU7S0FBRyxJQUFFLEdBQUUsSUFBRTtLQUFFO01BQUcsSUFBRSxFQUFFLEtBQUssRUFBRSxJQUFHLEVBQUUsS0FBSyxLQUFHLEtBQUcsSUFBRSxJQUFFLElBQUU7WUFBUSxFQUFFO0lBQUU7SUFBRSxJQUFJLEtBQUcsR0FBRSxHQUFFLE9BQUssS0FBRyxFQUFFLGFBQVcsS0FBRyxFQUFFO0lBQVUsTUFBTSxLQUFFLE1BQUc7S0FBQyxNQUFNLElBQUUsRUFBRTtLQUFNLElBQUksSUFBRSxFQUFFO0tBQVEsSUFBRSxFQUFFLGNBQVksSUFBRSxFQUFFLFlBQVcsTUFBSSxNQUFJLEVBQUUsT0FBTyxJQUFJLEVBQUUsWUFBWSxTQUFTLEVBQUUsYUFBWSxFQUFFLGNBQVksQ0FBQyxHQUFFLEVBQUUsUUFBUSxHQUFFLEVBQUUsWUFBVSxHQUFFLEVBQUUsZUFBYSxHQUFFLEVBQUUsYUFBVyxHQUFFLEVBQUUsYUFBVyxHQUFFLEVBQUUsV0FBUyxHQUFFLE1BQUksRUFBRSxZQUFVLEVBQUUsY0FBWTtJQUFHLEdBQUUsS0FBRyxHQUFFLE1BQUk7S0FBQyxFQUFFLEdBQUUsRUFBRSxlQUFhLElBQUUsRUFBRSxjQUFZLElBQUcsRUFBRSxXQUFTLEVBQUUsYUFBWSxDQUFDLEdBQUUsRUFBRSxjQUFZLEVBQUUsVUFBUyxFQUFFLEVBQUUsSUFBSTtJQUFDLEdBQUUsS0FBRyxHQUFFLE1BQUk7S0FBQyxFQUFFLFlBQVksRUFBRSxhQUFXO0lBQUMsR0FBRSxLQUFHLEdBQUUsTUFBSTtLQUFDLEVBQUUsWUFBWSxFQUFFLGFBQVcsTUFBSSxJQUFFLEtBQUksRUFBRSxZQUFZLEVBQUUsYUFBVyxNQUFJO0lBQUMsR0FBRSxLQUFHLEdBQUUsR0FBRSxHQUFFLE1BQUk7S0FBQyxJQUFJLElBQUUsRUFBRTtLQUFTLE9BQU8sSUFBRSxNQUFJLElBQUUsSUFBRyxNQUFJLElBQUUsS0FBRyxFQUFFLFlBQVUsR0FBRSxFQUFFLElBQUksRUFBRSxNQUFNLFNBQVMsRUFBRSxTQUFRLEVBQUUsVUFBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLE1BQUksRUFBRSxNQUFNLE9BQUssRUFBRSxRQUFNLEVBQUUsRUFBRSxPQUFNLEdBQUUsR0FBRSxDQUFDLElBQUUsTUFBSSxFQUFFLE1BQU0sU0FBTyxFQUFFLFFBQU0sRUFBRSxFQUFFLE9BQU0sR0FBRSxHQUFFLENBQUMsSUFBRyxFQUFFLFdBQVMsR0FBRSxFQUFFLFlBQVUsR0FBRTtJQUFFLEdBQUUsS0FBRyxHQUFFLE1BQUk7S0FBQyxJQUFJLEdBQUUsR0FBRSxJQUFFLEVBQUUsa0JBQWlCLElBQUUsRUFBRSxVQUFTLElBQUUsRUFBRSxhQUFZLElBQUUsRUFBRTtLQUFXLE1BQU0sSUFBRSxFQUFFLFdBQVMsRUFBRSxTQUFPLElBQUUsRUFBRSxZQUFVLEVBQUUsU0FBTyxLQUFHLEdBQUUsSUFBRSxFQUFFLFFBQU8sSUFBRSxFQUFFLFFBQU8sSUFBRSxFQUFFLE1BQUssSUFBRSxFQUFFLFdBQVM7S0FBRSxJQUFJLElBQUUsRUFBRSxJQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRTtLQUFHLEVBQUUsZUFBYSxFQUFFLGVBQWEsTUFBSSxJQUFHLElBQUUsRUFBRSxjQUFZLElBQUUsRUFBRTtLQUFXO01BQUcsSUFBRyxJQUFFLEdBQUUsRUFBRSxJQUFFLE9BQUssS0FBRyxFQUFFLElBQUUsSUFBRSxPQUFLLEtBQUcsRUFBRSxPQUFLLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLElBQUUsSUFBRztPQUFDLEtBQUcsR0FBRTtPQUFJLFNBQUU7T0FBUSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxFQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsTUFBSSxJQUFFO09BQUcsSUFBRyxJQUFFLEtBQUcsSUFBRSxJQUFHLElBQUUsSUFBRSxHQUFFLElBQUUsR0FBRTtRQUFDLElBQUcsRUFBRSxjQUFZLEdBQUUsSUFBRSxHQUFFLEtBQUcsR0FBRTtRQUFNLElBQUUsRUFBRSxJQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRTtPQUFFO01BQUM7YUFBUyxJQUFFLEVBQUUsSUFBRSxNQUFJLEtBQUcsS0FBRyxFQUFFO0tBQUcsT0FBTyxLQUFHLEVBQUUsWUFBVSxJQUFFLEVBQUU7SUFBUyxHQUFFLEtBQUUsTUFBRztLQUFDLE1BQU0sSUFBRSxFQUFFO0tBQU8sSUFBSSxHQUFFLEdBQUU7S0FBRSxHQUFFO01BQUMsSUFBRyxJQUFFLEVBQUUsY0FBWSxFQUFFLFlBQVUsRUFBRSxVQUFTLEVBQUUsWUFBVSxLQUFHLElBQUUsT0FBSyxFQUFFLE9BQU8sSUFBSSxFQUFFLE9BQU8sU0FBUyxHQUFFLElBQUUsSUFBRSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUUsZUFBYSxHQUFFLEVBQUUsWUFBVSxHQUFFLEVBQUUsZUFBYSxHQUFFLEVBQUUsU0FBTyxFQUFFLGFBQVcsRUFBRSxTQUFPLEVBQUUsV0FBVSxFQUFFLENBQUMsR0FBRSxLQUFHLElBQUcsTUFBSSxFQUFFLEtBQUssVUFBUztNQUFNLElBQUcsSUFBRSxFQUFFLEVBQUUsTUFBSyxFQUFFLFFBQU8sRUFBRSxXQUFTLEVBQUUsV0FBVSxDQUFDLEdBQUUsRUFBRSxhQUFXLEdBQUUsRUFBRSxZQUFVLEVBQUUsVUFBUSxHQUFFLEtBQUksSUFBRSxFQUFFLFdBQVMsRUFBRSxRQUFPLEVBQUUsUUFBTSxFQUFFLE9BQU8sSUFBRyxFQUFFLFFBQU0sRUFBRSxHQUFFLEVBQUUsT0FBTSxFQUFFLE9BQU8sSUFBRSxFQUFFLEdBQUUsRUFBRSxXQUFTLEVBQUUsUUFBTSxFQUFFLEdBQUUsRUFBRSxPQUFNLEVBQUUsT0FBTyxJQUFFLElBQUUsRUFBRSxHQUFFLEVBQUUsS0FBSyxJQUFFLEVBQUUsVUFBUSxFQUFFLEtBQUssRUFBRSxRQUFPLEVBQUUsS0FBSyxFQUFFLFNBQU8sR0FBRSxLQUFJLEVBQUUsVUFBUyxFQUFFLEVBQUUsWUFBVSxFQUFFLFNBQU87S0FBTSxTQUFPLEVBQUUsWUFBVSxLQUFHLE1BQUksRUFBRSxLQUFLO0lBQVMsR0FBRSxLQUFHLEdBQUUsTUFBSTtLQUFDLElBQUksR0FBRSxHQUFFLEdBQUUsSUFBRSxFQUFFLG1CQUFpQixJQUFFLEVBQUUsU0FBTyxFQUFFLFNBQU8sRUFBRSxtQkFBaUIsR0FBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLEtBQUs7S0FBUyxHQUFFO01BQUMsSUFBRyxJQUFFLE9BQU0sSUFBRSxFQUFFLFdBQVMsTUFBSSxHQUFFLEVBQUUsS0FBSyxZQUFVLEdBQUU7TUFBTSxJQUFHLElBQUUsRUFBRSxLQUFLLFlBQVUsR0FBRSxJQUFFLEVBQUUsV0FBUyxFQUFFLGFBQVksSUFBRSxJQUFFLEVBQUUsS0FBSyxhQUFXLElBQUUsSUFBRSxFQUFFLEtBQUssV0FBVSxJQUFFLE1BQUksSUFBRSxJQUFHLElBQUUsTUFBSSxNQUFJLEtBQUcsTUFBSSxLQUFHLE1BQUksS0FBRyxNQUFJLElBQUUsRUFBRSxLQUFLLFdBQVU7TUFBTSxJQUFFLE1BQUksS0FBRyxNQUFJLElBQUUsRUFBRSxLQUFLLFdBQVMsSUFBRSxHQUFFLEVBQUUsR0FBRSxHQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsWUFBWSxFQUFFLFVBQVEsS0FBRyxHQUFFLEVBQUUsWUFBWSxFQUFFLFVBQVEsS0FBRyxLQUFHLEdBQUUsRUFBRSxZQUFZLEVBQUUsVUFBUSxLQUFHLENBQUMsR0FBRSxFQUFFLFlBQVksRUFBRSxVQUFRLEtBQUcsQ0FBQyxLQUFHLEdBQUUsRUFBRSxFQUFFLElBQUksR0FBRSxNQUFJLElBQUUsTUFBSSxJQUFFLElBQUcsRUFBRSxLQUFLLE9BQU8sSUFBSSxFQUFFLE9BQU8sU0FBUyxFQUFFLGFBQVksRUFBRSxjQUFZLENBQUMsR0FBRSxFQUFFLEtBQUssUUFBUSxHQUFFLEVBQUUsS0FBSyxZQUFVLEdBQUUsRUFBRSxLQUFLLGFBQVcsR0FBRSxFQUFFLEtBQUssYUFBVyxHQUFFLEVBQUUsZUFBYSxHQUFFLEtBQUcsSUFBRyxNQUFJLEVBQUUsRUFBRSxNQUFLLEVBQUUsS0FBSyxRQUFPLEVBQUUsS0FBSyxVQUFTLENBQUMsR0FBRSxFQUFFLEtBQUssWUFBVSxHQUFFLEVBQUUsS0FBSyxhQUFXLEdBQUUsRUFBRSxLQUFLLGFBQVc7S0FBRSxTQUFPLE1BQUk7S0FBRyxPQUFPLEtBQUcsRUFBRSxLQUFLLFVBQVMsTUFBSSxLQUFHLEVBQUUsVUFBUSxFQUFFLFVBQVEsR0FBRSxFQUFFLE9BQU8sSUFBSSxFQUFFLEtBQUssTUFBTSxTQUFTLEVBQUUsS0FBSyxVQUFRLEVBQUUsUUFBTyxFQUFFLEtBQUssT0FBTyxHQUFFLENBQUMsR0FBRSxFQUFFLFdBQVMsRUFBRSxRQUFPLEVBQUUsU0FBTyxFQUFFLGFBQVcsRUFBRSxjQUFZLEVBQUUsWUFBVSxNQUFJLEVBQUUsWUFBVSxFQUFFLFFBQU8sRUFBRSxPQUFPLElBQUksRUFBRSxPQUFPLFNBQVMsRUFBRSxRQUFPLEVBQUUsU0FBTyxFQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsRUFBRSxVQUFRLEtBQUcsRUFBRSxXQUFVLEVBQUUsU0FBTyxFQUFFLGFBQVcsRUFBRSxTQUFPLEVBQUUsWUFBVyxFQUFFLE9BQU8sSUFBSSxFQUFFLEtBQUssTUFBTSxTQUFTLEVBQUUsS0FBSyxVQUFRLEdBQUUsRUFBRSxLQUFLLE9BQU8sR0FBRSxFQUFFLFFBQVEsR0FBRSxFQUFFLFlBQVUsR0FBRSxFQUFFLFVBQVEsSUFBRSxFQUFFLFNBQU8sRUFBRSxTQUFPLEVBQUUsU0FBTyxFQUFFLFNBQU8sSUFBRyxFQUFFLGNBQVksRUFBRSxXQUFVLEVBQUUsYUFBVyxFQUFFLGFBQVcsRUFBRSxhQUFXLEVBQUUsV0FBVSxJQUFFLElBQUUsTUFBSSxLQUFHLE1BQUksS0FBRyxNQUFJLEVBQUUsS0FBSyxZQUFVLEVBQUUsYUFBVyxFQUFFLGNBQVksS0FBRyxJQUFFLEVBQUUsY0FBWSxFQUFFLFVBQVMsRUFBRSxLQUFLLFdBQVMsS0FB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RyxFQUFFLFdBQVMsR0FBRSxNQUFJO0tBQUMsSUFBRyxHQUFHLENBQUMsS0FBRyxJQUFFLEtBQUcsSUFBRSxHQUFFLE9BQU8sSUFBRSxFQUFFLEdBQUUsQ0FBQyxJQUFFO0tBQUUsTUFBTSxJQUFFLEVBQUU7S0FBTSxJQUFHLENBQUMsRUFBRSxVQUFRLE1BQUksRUFBRSxZQUFVLENBQUMsRUFBRSxTQUFPLEVBQUUsV0FBUyxLQUFHLE1BQUksR0FBRSxPQUFPLEVBQUUsR0FBRSxNQUFJLEVBQUUsWUFBVSxJQUFFLENBQUM7S0FBRSxNQUFNLElBQUUsRUFBRTtLQUFXLElBQUcsRUFBRSxhQUFXLEdBQUUsTUFBSSxFQUFFLFNBQVk7VUFBQSxFQUFFLENBQUMsR0FBRSxNQUFJLEVBQUUsV0FBVSxPQUFPLEVBQUUsYUFBVyxJQUFHO0tBQUEsT0FBTyxJQUFHLE1BQUksRUFBRSxZQUFVLEVBQUUsQ0FBQyxLQUFHLEVBQUUsQ0FBQyxLQUFHLE1BQUksR0FBRSxPQUFPLEVBQUUsR0FBRSxDQUFDO0tBQUUsSUFBRyxFQUFFLFdBQVMsS0FBRyxNQUFJLEVBQUUsVUFBUyxPQUFPLEVBQUUsR0FBRSxDQUFDO0tBQUUsSUFBRyxFQUFFLFdBQVMsS0FBRyxNQUFJLEVBQUUsU0FBTyxFQUFFLFNBQU8sSUFBRyxFQUFFLFdBQVMsR0FBRTtNQUFDLElBQUksSUFBRSxLQUFHLEVBQUUsU0FBTyxLQUFHLE1BQUksR0FBRSxJQUFFO01BQUcsSUFBRyxJQUFFLEVBQUUsWUFBVSxLQUFHLEVBQUUsUUFBTSxJQUFFLElBQUUsRUFBRSxRQUFNLElBQUUsSUFBRSxNQUFJLEVBQUUsUUFBTSxJQUFFLEdBQUUsS0FBRyxLQUFHLEdBQUUsTUFBSSxFQUFFLGFBQVcsS0FBRyxLQUFJLEtBQUcsS0FBRyxJQUFFLElBQUcsRUFBRSxHQUFFLENBQUMsR0FBRSxNQUFJLEVBQUUsYUFBVyxFQUFFLEdBQUUsRUFBRSxVQUFRLEVBQUUsR0FBRSxFQUFFLEdBQUUsUUFBTSxFQUFFLEtBQUssSUFBRyxFQUFFLFFBQU0sR0FBRSxFQUFFLFNBQU8sR0FBRSxFQUFFLENBQUMsR0FBRSxNQUFJLEVBQUUsU0FBUSxPQUFPLEVBQUUsYUFBVyxJQUFHO0tBQUM7S0FBQyxJQUFHLE9BQUssRUFBRSxRQUFVO1VBQUEsRUFBRSxRQUFNLEdBQUUsRUFBRSxHQUFFLEVBQUUsR0FBRSxFQUFFLEdBQUUsR0FBRyxHQUFFLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxRQUFPLEVBQUUsSUFBRyxFQUFFLE9BQU8sT0FBSyxJQUFFLE1BQUksRUFBRSxPQUFPLE9BQUssSUFBRSxNQUFJLEVBQUUsT0FBTyxRQUFNLElBQUUsTUFBSSxFQUFFLE9BQU8sT0FBSyxJQUFFLE1BQUksRUFBRSxPQUFPLFVBQVEsS0FBRyxFQUFFLEdBQUUsRUFBRSxHQUFFLE1BQUksRUFBRSxPQUFPLElBQUksR0FBRSxFQUFFLEdBQUUsRUFBRSxPQUFPLFFBQU0sSUFBRSxHQUFHLEdBQUUsRUFBRSxHQUFFLEVBQUUsT0FBTyxRQUFNLEtBQUcsR0FBRyxHQUFFLEVBQUUsR0FBRSxFQUFFLE9BQU8sUUFBTSxLQUFHLEdBQUcsR0FBRSxFQUFFLEdBQUUsTUFBSSxFQUFFLFFBQU0sSUFBRSxFQUFFLFlBQVUsS0FBRyxFQUFFLFFBQU0sSUFBRSxJQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsTUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFFLEVBQUUsT0FBTyxTQUFPLEVBQUUsT0FBTyxNQUFNLFdBQVMsRUFBRSxHQUFFLE1BQUksRUFBRSxPQUFPLE1BQU0sTUFBTSxHQUFFLEVBQUUsR0FBRSxFQUFFLE9BQU8sTUFBTSxVQUFRLElBQUUsR0FBRyxJQUFHLEVBQUUsT0FBTyxTQUFPLEVBQUUsUUFBTSxFQUFFLEVBQUUsT0FBTSxFQUFFLGFBQVksRUFBRSxTQUFRLENBQUMsSUFBRyxFQUFFLFVBQVEsR0FBRSxFQUFFLFNBQU87V0FBUSxJQUFHLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsR0FB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QUFFLEtBQUssWUFBVSxJQUFFLEtBQUcsRUFBRSxhQUFXLEVBQUUsR0FBRSxDQUFDLENBQUMsR0FBRSxNQUFJLEVBQUUsS0FBSyxhQUFXLElBQUU7TUFBQyxFQUFBLENBQUcsR0FBRSxDQUFDLElBQUUsRUFBRSxhQUFXLE1BQUksR0FBRSxNQUFJO09BQUMsSUFBSSxHQUFFLEdBQUUsR0FBRTtPQUFFLE1BQU0sSUFBRSxFQUFFO09BQU8sU0FBTztRQUFDLElBQUcsRUFBRSxhQUFXLEdBQUU7U0FBQyxJQUFHLEVBQUUsQ0FBQyxHQUFFLEVBQUUsYUFBVyxLQUFHLE1BQUksR0FBRSxPQUFPO1NBQUUsSUFBRyxNQUFJLEVBQUUsV0FBVTtRQUFLO1FBQUMsSUFBRyxFQUFFLGVBQWEsR0FBRSxFQUFFLGFBQVcsS0FBRyxFQUFFLFdBQVMsTUFBSSxJQUFFLEVBQUUsV0FBUyxHQUFFLElBQUUsRUFBRSxJQUFHLE1BQUksRUFBRSxFQUFFLE1BQUksTUFBSSxFQUFFLEVBQUUsTUFBSSxNQUFJLEVBQUUsRUFBRSxLQUFJO1NBQUMsSUFBRSxFQUFFLFdBQVM7U0FBRSxXQUFFO09BQVEsTUFBSSxFQUFFLEVBQUUsTUFBSSxNQUFJLEVBQUUsRUFBRSxNQUFJLE1BQUksRUFBRSxFQUFFLE1BQUksTUFBSSxFQUFFLEVBQUUsTUFBSSxNQUFJLEVBQUUsRUFBRSxNQUFJLE1BQUksRUFBRSxFQUFFLE1BQUksTUFBSSxFQUFFLEVBQUUsTUFBSSxNQUFJLEVBQUUsRUFBRSxNQUFJLElBQUU7U0FBRyxFQUFFLGVBQWEsS0FBRyxJQUFFLElBQUcsRUFBRSxlQUFhLEVBQUUsY0FBWSxFQUFFLGVBQWEsRUFBRTtRQUFVO1FBQUMsSUFBRyxFQUFFLGdCQUFjLEtBQUcsSUFBRSxFQUFFLEdBQUUsR0FBRSxFQUFFLGVBQWEsQ0FBQyxHQUFFLEVBQUUsYUFBVyxFQUFFLGNBQWEsRUFBRSxZQUFVLEVBQUUsY0FBYSxFQUFFLGVBQWEsTUFBSSxJQUFFLEVBQUUsR0FBRSxHQUFFLEVBQUUsT0FBTyxFQUFFLFNBQVMsR0FBRSxFQUFFLGFBQVksRUFBRSxhQUFZLE1BQUksRUFBRSxHQUFFLENBQUMsQ0FBQyxHQUFFLE1BQUksRUFBRSxLQUFLLFlBQVcsT0FBTztPQUFDO09BQUMsT0FBTyxFQUFFLFNBQU8sR0FBRSxNQUFJLEtBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxHQUFFLE1BQUksRUFBRSxLQUFLLFlBQVUsSUFBRSxLQUFHLEVBQUUsYUFBVyxFQUFFLEdBQUUsQ0FBQyxDQUFDLEdBQUUsTUFBSSxFQUFFLEtBQUssYUFBVyxJQUFFO01BQUMsRUFBQSxDQUFHLEdBQUUsQ0FBQyxJQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFFLENBQUM7TUFBRSxJQUFHLE1BQUksS0FBRyxNQUFJLE1BQUksRUFBRSxTQUFPLElBQUcsTUFBSSxLQUFHLE1BQUksR0FBRSxPQUFPLE1BQUksRUFBRSxjQUFZLEVBQUUsYUFBVyxLQUFJO01BQUUsSUFBRyxNQUFJLE1BQUksTUFBSSxJQUFFLEVBQUUsQ0FBQyxJQUFFLE1BQUksTUFBSSxFQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsQ0FBQyxHQUFFLE1BQUksTUFBSSxFQUFFLEVBQUUsSUFBSSxHQUFFLE1BQUksRUFBRSxjQUFZLEVBQUUsV0FBUyxHQUFFLEVBQUUsY0FBWSxHQUFFLEVBQUUsU0FBTyxNQUFLLEVBQUUsQ0FBQyxHQUFFLE1BQUksRUFBRSxZQUFXLE9BQU8sRUFBRSxhQUFXLElBQUc7S0FBQztLQUFDLE9BQU8sTUFBSSxJQUFFLElBQUUsRUFBRSxRQUFNLElBQUUsS0FBRyxNQUFJLEVBQUUsUUFBTSxFQUFFLEdBQUUsTUFBSSxFQUFFLEtBQUssR0FBRSxFQUFFLEdBQUUsRUFBRSxTQUFPLElBQUUsR0FBRyxHQUFFLEVBQUUsR0FBRSxFQUFFLFNBQU8sS0FBRyxHQUFHLEdBQUUsRUFBRSxHQUFFLEVBQUUsU0FBTyxLQUFHLEdBQUcsR0FBRSxFQUFFLEdBQUUsTUFBSSxFQUFFLFFBQVEsR0FBRSxFQUFFLEdBQUUsRUFBRSxZQUFVLElBQUUsR0FBRyxHQUFFLEVBQUUsR0FBRSxFQUFFLFlBQVUsS0FBRyxHQUFHLEdBQUUsRUFBRSxHQUFFLEVBQUUsWUFBVSxLQUFHLEdBQUcsTUFBSSxFQUFFLEdBQUUsRUFBRSxVQUFRLEVBQUUsR0FBRSxFQUFFLEdBQUUsUUFBTSxFQUFFLEtBQUssSUFBRyxFQUFFLENBQUMsR0FBRSxFQUFFLE9BQUssTUFBSSxFQUFFLE9BQUssQ0FBQyxFQUFFLE9BQU0sTUFBSSxFQUFFLFVBQVEsSUFBRTtJQUFFLEdBQUUsRUFBRSxjQUFXLE1BQUc7S0FBQyxJQUFHLEdBQUcsQ0FBQyxHQUFFLE9BQU87S0FBRSxNQUFNLElBQUUsRUFBRSxNQUFNO0tBQU8sT0FBTyxFQUFFLFFBQU0sTUFBSyxNQUFJLElBQUUsRUFBRSxHQUFFLENBQUMsSUFBRTtJQUFDLEdBQUUsRUFBRSx3QkFBc0IsR0FBRSxNQUFJO0tBQUMsSUFBSSxJQUFFLEVBQUU7S0FBTyxJQUFHLEdBQUcsQ0FBQyxHQUFFLE9BQU87S0FBRSxNQUFNLElBQUUsRUFBRSxPQUFNLElBQUUsRUFBRTtLQUFLLElBQUcsTUFBSSxLQUFHLE1BQUksS0FBRyxFQUFFLFdBQVMsS0FBRyxFQUFFLFdBQVUsT0FBTztLQUFFLElBQUcsTUFBSSxNQUFJLEVBQUUsUUFBTSxFQUFFLEVBQUUsT0FBTSxHQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsT0FBSyxHQUFFLEtBQUcsRUFBRSxRQUFPO01BQUMsTUFBSSxNQUFJLEVBQUUsRUFBRSxJQUFJLEdBQUUsRUFBRSxXQUFTLEdBQUUsRUFBRSxjQUFZLEdBQUUsRUFBRSxTQUFPO01BQUcsSUFBSSxJQUFFLElBQUksV0FBVyxFQUFFLE1BQU07TUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLElBQUUsRUFBRSxRQUFPLENBQUMsR0FBRSxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUUsRUFBRTtLQUFNO0tBQUMsTUFBTSxJQUFFLEVBQUUsVUFBUyxJQUFFLEVBQUUsU0FBUSxJQUFFLEVBQUU7S0FBTSxLQUFJLEVBQUUsV0FBUyxHQUFFLEVBQUUsVUFBUSxHQUFFLEVBQUUsUUFBTSxHQUFFLEVBQUUsQ0FBQyxHQUFFLEVBQUUsYUFBVyxJQUFHO01BQUMsSUFBSSxJQUFFLEVBQUUsVUFBUyxJQUFFLEVBQUUsWUFBVTtNQUFFO09BQUcsRUFBRSxRQUFNLEVBQUUsR0FBRSxFQUFFLE9BQU0sRUFBRSxPQUFPLElBQUUsSUFBRSxFQUFFLEdBQUUsRUFBRSxLQUFLLElBQUUsRUFBRSxVQUFRLEVBQUUsS0FBSyxFQUFFLFFBQU8sRUFBRSxLQUFLLEVBQUUsU0FBTyxHQUFFO2FBQVUsRUFBRTtNQUFHLEVBQUUsV0FBUyxHQUFFLEVBQUUsWUFBVSxHQUFFLEVBQUUsQ0FBQztLQUFDO0tBQUMsT0FBTyxFQUFFLFlBQVUsRUFBRSxXQUFVLEVBQUUsY0FBWSxFQUFFLFVBQVMsRUFBRSxTQUFPLEVBQUUsV0FBVSxFQUFFLFlBQVUsR0FBRSxFQUFFLGVBQWEsRUFBRSxjQUFZLEdBQUUsRUFBRSxrQkFBZ0IsR0FBRSxFQUFFLFVBQVEsR0FBRSxFQUFFLFFBQU0sR0FBRSxFQUFFLFdBQVMsR0FBRSxFQUFFLE9BQUssR0FBRTtJQUFDLEdBQUUsRUFBRSxjQUFZLHNDQUFxQztHQUFDO0dBQUMsSUFBSSxHQUFFLElBQUUsQ0FBQztHQUFFLElBQUksR0FBRSxHQUFFLEdBQUUsR0FBRSxJQUFFLENBQUM7R0FBRSxTQUFTLElBQUc7SUFBQyxJQUFHLEdBQUUsT0FBTztJQUFFLElBQUU7SUFBRSxJQUFJLElBQUUsQ0FBQztJQUFFLElBQUc7S0FBQyxPQUFPLGFBQWEsTUFBTSxzQkFBSyxJQUFJLFdBQVcsQ0FBQyxDQUFDO0lBQUMsU0FBTyxHQUFFO0tBQUMsSUFBRSxDQUFDO0lBQUM7SUFBQyxNQUFNLG9CQUFFLElBQUksV0FBVyxHQUFHO0lBQUUsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEtBQUksS0FBSSxFQUFFLEtBQUcsS0FBRyxNQUFJLElBQUUsS0FBRyxNQUFJLElBQUUsS0FBRyxNQUFJLElBQUUsS0FBRyxNQUFJLElBQUUsS0FBRyxNQUFJLElBQUU7SUFBRSxFQUFFLE9BQUssRUFBRSxPQUFLLEdBQUUsRUFBRSxjQUFXLE1BQUc7S0FBQyxJQUFHLGNBQVksT0FBTyxlQUFhLFlBQVksVUFBVSxRQUFPLE9BQU8sSUFBSSxZQUFVLENBQUMsQ0FBRSxPQUFPLENBQUM7S0FBRSxJQUFJLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxJQUFFO0tBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksSUFBRSxFQUFFLFdBQVcsQ0FBQyxHQUFFLFVBQVEsUUFBTSxNQUFJLElBQUUsSUFBRSxNQUFJLElBQUUsRUFBRSxXQUFXLElBQUUsQ0FBQyxHQUFFLFVBQVEsUUFBTSxPQUFLLElBQUUsU0FBTyxJQUFFLFNBQU8sT0FBSyxJQUFFLFFBQU8sT0FBTSxLQUFHLElBQUUsTUFBSSxJQUFFLElBQUUsT0FBSyxJQUFFLElBQUUsUUFBTSxJQUFFO0tBQUUsS0FBSSxJQUFFLElBQUksV0FBVyxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxJQUFFLEVBQUUsV0FBVyxDQUFDLEdBQUUsVUFBUSxRQUFNLE1BQUksSUFBRSxJQUFFLE1BQUksSUFBRSxFQUFFLFdBQVcsSUFBRSxDQUFDLEdBQUUsVUFBUSxRQUFNLE9BQUssSUFBRSxTQUFPLElBQUUsU0FBTyxPQUFLLElBQUUsUUFBTyxPQUFNLElBQUUsTUFBSSxFQUFFLE9BQUssSUFBRSxJQUFFLFFBQU0sRUFBRSxPQUFLLE1BQUksTUFBSSxHQUFFLEVBQUUsT0FBSyxNQUFJLEtBQUcsS0FBRyxJQUFFLFNBQU8sRUFBRSxPQUFLLE1BQUksTUFBSSxJQUFHLEVBQUUsT0FBSyxNQUFJLE1BQUksSUFBRSxJQUFHLEVBQUUsT0FBSyxNQUFJLEtBQUcsTUFBSSxFQUFFLE9BQUssTUFBSSxNQUFJLElBQUcsRUFBRSxPQUFLLE1BQUksTUFBSSxLQUFHLElBQUcsRUFBRSxPQUFLLE1BQUksTUFBSSxJQUFFLElBQUcsRUFBRSxPQUFLLE1BQUksS0FBRztLQUFHLE9BQU87SUFBQztJQUFFLE9BQU8sRUFBRSxjQUFZLEdBQUUsTUFBSTtLQUFDLE1BQU0sSUFBRSxLQUFHLEVBQUU7S0FBTyxJQUFHLGNBQVksT0FBTyxlQUFhLFlBQVksVUFBVSxRQUFPLE9BQU8sSUFBSSxZQUFVLENBQUMsQ0FBRSxPQUFPLEVBQUUsU0FBUyxHQUFFLENBQUMsQ0FBQztLQUFFLElBQUksR0FBRTtLQUFFLE1BQU0sSUFBRSxJQUFJLE1BQU0sSUFBRSxDQUFDO0tBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsSUFBRztNQUFDLElBQUksSUFBRSxFQUFFO01BQUssSUFBRyxJQUFFLEtBQUk7T0FBQyxFQUFFLE9BQUs7T0FBRTtNQUFRO01BQUMsSUFBSSxJQUFFLEVBQUU7TUFBRyxJQUFHLElBQUUsR0FBRSxFQUFFLE9BQUssT0FBTSxLQUFHLElBQUU7V0FBTTtPQUFDLEtBQUksS0FBRyxNQUFJLElBQUUsS0FBRyxNQUFJLElBQUUsS0FBRyxHQUFFLElBQUUsS0FBRyxJQUFFLElBQUcsSUFBRSxLQUFHLElBQUUsS0FBRyxFQUFFLE1BQUs7T0FBSSxJQUFFLElBQUUsRUFBRSxPQUFLLFFBQU0sSUFBRSxRQUFNLEVBQUUsT0FBSyxLQUFHLEtBQUcsT0FBTSxFQUFFLE9BQUssUUFBTSxLQUFHLEtBQUcsTUFBSyxFQUFFLE9BQUssUUFBTSxPQUFLO01BQUU7S0FBQztLQUFDLFNBQVEsR0FBRSxNQUFJO01BQUMsSUFBRyxJQUFFLFNBQU8sRUFBRSxZQUFVLEdBQUUsT0FBTyxPQUFPLGFBQWEsTUFBTSxNQUFLLEVBQUUsV0FBUyxJQUFFLElBQUUsRUFBRSxTQUFTLEdBQUUsQ0FBQyxDQUFDO01BQUUsSUFBSSxJQUFFO01BQUcsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxLQUFHLE9BQU8sYUFBYSxFQUFFLEVBQUU7TUFBRSxPQUFPO0tBQUMsRUFBQSxDQUFHLEdBQUUsQ0FBQztJQUFDLEdBQUUsRUFBRSxjQUFZLEdBQUUsTUFBSTtLQUFDLENBQUMsSUFBRSxLQUFHLEVBQUUsVUFBUSxFQUFFLFdBQVMsSUFBRSxFQUFFO0tBQVEsSUFBSSxJQUFFLElB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TyxTQUFTLEdBQUUsRUFBRSxRQUFRLENBQUMsR0FBRSxFQUFFLFlBQVU7VUFBTTtNQUFDLElBQUcsSUFBRSxFQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsTUFBSSxHQUFFLE9BQU8sRUFBRSxXQUFTLEtBQUcsS0FBSyxPQUFPLEVBQUUsT0FBTyxTQUFTLEdBQUUsRUFBRSxRQUFRLENBQUMsR0FBRSxJQUFFLEVBQUUsV0FBVyxLQUFLLElBQUksR0FBRSxLQUFLLE1BQU0sQ0FBQyxHQUFFLEtBQUssUUFBTSxDQUFDLEdBQUUsTUFBSTtNQUFFLElBQUcsTUFBSSxFQUFFLFdBQWM7V0FBQSxJQUFFLEtBQUcsRUFBRSxXQUFTLEdBQUUsS0FBSyxPQUFPLEVBQUUsT0FBTyxTQUFTLEdBQUUsRUFBRSxRQUFRLENBQUMsR0FBRSxFQUFFLFlBQVU7WUFBTyxJQUFHLE1BQUksRUFBRSxVQUFTO01BQUEsT0FBVyxLQUFLLE9BQU8sRUFBRSxNQUFNO0tBQUM7S0FBQyxPQUFNLENBQUM7SUFBQyxHQUFFLEVBQUUsVUFBVSxTQUFPLFNBQVMsR0FBRTtLQUFDLEtBQUssT0FBTyxLQUFLLENBQUM7SUFBQyxHQUFFLEVBQUUsVUFBVSxRQUFNLFNBQVMsR0FBRTtLQUFDLE1BQUksTUFBSSxLQUFLLFNBQU8sRUFBRSxjQUFjLEtBQUssTUFBTSxJQUFHLEtBQUssU0FBTyxDQUFDLEdBQUUsS0FBSyxNQUFJLEdBQUUsS0FBSyxNQUFJLEtBQUssS0FBSztJQUFHLEdBQUUsRUFBRSxVQUFRLEdBQUUsRUFBRSxVQUFRLEdBQUUsRUFBRSxhQUFXLFNBQVMsR0FBRSxHQUFFO0tBQUMsT0FBTSxDQUFDLElBQUUsS0FBRyxDQUFDLEVBQUEsQ0FBRyxNQUFJLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQztJQUFDLEdBQUUsRUFBRSxPQUFLLFNBQVMsR0FBRSxHQUFFO0tBQUMsT0FBTSxDQUFDLElBQUUsS0FBRyxDQUFDLEVBQUEsQ0FBRyxPQUFLLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQztJQUFDLEdBQUUsRUFBRSxZQUFVLEVBQUUsR0FBRTtHQUFDLEVBQWUsQ0FBQyxDQUFDLFFBQU8sR0FBRSxJQUFFLFdBQVU7SUFBQyxJQUFJLElBQUU7S0FBQyxVQUFTLFNBQVMsR0FBRSxHQUFFO01BQUMsT0FBSyxLQUFHLEVBQUUsS0FBSTtNQUFJLE9BQU87S0FBQztLQUFFLFlBQVcsU0FBUyxHQUFFLEdBQUU7TUFBQyxPQUFPLEVBQUUsTUFBSSxJQUFFLEVBQUUsSUFBRTtLQUFFO0tBQUUsYUFBWSxTQUFTLEdBQUUsR0FBRSxHQUFFO01BQUMsRUFBRSxLQUFHLEtBQUcsSUFBRSxLQUFJLEVBQUUsSUFBRSxLQUFHLE1BQUk7S0FBQztLQUFFLFVBQVMsU0FBUyxHQUFFLEdBQUU7TUFBQyxPQUFPLFdBQVMsRUFBRSxNQUFJLEVBQUUsSUFBRSxNQUFJLEtBQUcsRUFBRSxJQUFFLE1BQUksSUFBRSxFQUFFLElBQUU7S0FBRztLQUFFLFdBQVUsU0FBUyxHQUFFLEdBQUUsR0FBRTtNQUFDLEVBQUUsS0FBRyxLQUFHLEtBQUcsS0FBSSxFQUFFLElBQUUsS0FBRyxLQUFHLEtBQUcsS0FBSSxFQUFFLElBQUUsS0FBRyxLQUFHLElBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxNQUFJO0tBQUM7S0FBRSxXQUFVLFNBQVMsR0FBRSxHQUFFLEdBQUU7TUFBQyxLQUFJLElBQUksSUFBRSxJQUFHLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxLQUFHLE9BQU8sYUFBYSxFQUFFLElBQUUsRUFBRTtNQUFFLE9BQU87S0FBQztLQUFFLFlBQVcsU0FBUyxHQUFFLEdBQUUsR0FBRTtNQUFDLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLFdBQVcsQ0FBQztLQUFDO0tBQUUsV0FBVSxTQUFTLEdBQUUsR0FBRSxHQUFFO01BQUMsS0FBSSxJQUFJLElBQUUsQ0FBQyxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEtBQUssRUFBRSxJQUFFLEVBQUU7TUFBRSxPQUFPO0tBQUM7S0FBRSxLQUFJLFNBQVMsR0FBRTtNQUFDLE9BQU8sRUFBRSxTQUFPLElBQUUsTUFBSSxJQUFFO0tBQUM7S0FBRSxVQUFTLFNBQVMsR0FBRSxHQUFFLEdBQUU7TUFBQyxLQUFJLElBQUksR0FBRSxJQUFFLElBQUcsSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEtBQUcsTUFBSSxFQUFFLElBQUksRUFBRSxJQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztNQUFFLElBQUc7T0FBQyxJQUFFLG1CQUFtQixDQUFDO01BQUMsU0FBTyxHQUFFO09BQUMsT0FBTyxFQUFFLFVBQVUsR0FBRSxHQUFFLENBQUM7TUFBQztNQUFDLE9BQU87S0FBQztJQUFDO0lBQUUsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxJQUFJLElBQUUsSUFBRSxHQUFFLElBQUUsRUFBRSxDQUFDLEdBQUUsSUFBRSxLQUFLLEtBQUssSUFBRSxJQUFFLENBQUMsR0FBRSxJQUFFLElBQUksV0FBVyxJQUFFLENBQUMsR0FBRSxJQUFFLElBQUksWUFBWSxFQUFFLE1BQU0sR0FBRSxJQUFFLEVBQUUsT0FBTSxJQUFFLEVBQUUsT0FBTSxJQUFFLEVBQUU7S0FBVyxJQUFHLEtBQUcsR0FBRTtNQUFDLElBQUksSUFBRSxLQUFHO01BQUUsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsS0FBRyxFQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO01BQUcsSUFBRyxNQUFJLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxLQUFHLEVBQUUsS0FBRztLQUFFLE9BQU0sSUFBRyxLQUFHLEdBQUU7TUFBQyxJQUFJLElBQUUsRUFBRSxLQUFLO01BQUssSUFBRyxRQUFNLEdBQUU7T0FBQyxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtRQUFDLElBQUksSUFBRSxJQUFFO1FBQUUsRUFBRSxLQUFHLE9BQUssS0FBRyxFQUFFLElBQUUsTUFBSSxLQUFHLEVBQUUsSUFBRSxNQUFJLElBQUUsRUFBRTtPQUFFO09BQUMsSUFBRyxNQUFJLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7UUFBQyxJQUFFLElBQUU7UUFBRSxFQUFFLEtBQUcsT0FBSyxLQUFHLEVBQUUsSUFBRSxNQUFJLEtBQUcsRUFBRSxJQUFFLE1BQUksSUFBRSxFQUFFO09BQUU7TUFBQyxPQUFLO09BQUMsSUFBSSxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUU7T0FBRyxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtRQUFDLElBQUksSUFBRSxLQUFHO1FBQUUsSUFBRSxJQUFFO1FBQUUsRUFBRSxLQUFHLE9BQUssS0FBRyxFQUFFLElBQUUsTUFBSSxLQUFHLEVBQUUsSUFBRSxNQUFJLElBQUUsRUFBRSxJQUFHLEVBQUUsTUFBSSxLQUFHLEVBQUUsSUFBRSxNQUFJLEtBQUcsRUFBRSxJQUFFLE1BQUksTUFBSSxFQUFFLElBQUUsS0FBRztPQUFFO09BQUMsSUFBRyxNQUFJLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7UUFBQyxJQUFFLEtBQUcsR0FBRSxJQUFFLElBQUU7UUFBRSxFQUFFLEtBQUcsT0FBSyxLQUFHLEVBQUUsSUFBRSxNQUFJLEtBQUcsRUFBRSxJQUFFLE1BQUksSUFBRSxFQUFFLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBRyxLQUFHLEVBQUUsR0FBRSxJQUFFLENBQUMsS0FBRyxLQUFHLEVBQUUsR0FBRSxJQUFFLENBQUMsS0FBRyxNQUFJLEVBQUUsSUFBRSxLQUFHO09BQUU7TUFBQztLQUFDLE9BQU0sSUFBRyxLQUFHLEdBQUU7TUFBQyxJQUFJLElBQUUsRUFBRSxLQUFLLE1BQUssSUFBRSxFQUFFLEtBQUssTUFBSyxJQUFFLElBQUUsRUFBRSxTQUFPO01BQUUsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtPQUFDLElBQUksSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFO09BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7UUFBQyxJQUFFLElBQUUsS0FBRztRQUFFLElBQUksSUFBRSxLQUFHLElBQUUsRUFBRSxLQUFHLEtBQUcsT0FBSyxLQUFHLElBQUUsS0FBRztRQUFHLEVBQUUsS0FBRyxFQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsSUFBRSxJQUFFLEVBQUUsS0FBRztPQUFHO01BQUM7TUFBQyxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxLQUFJLElBQUUsSUFBRSxHQUFFLElBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtPQUFDLElBQUUsSUFBRSxLQUFHLEdBQUUsSUFBRSxLQUFHLElBQUUsRUFBRSxLQUFHLEtBQUcsT0FBSyxNQUFJLElBQUUsTUFBSSxLQUFHO09BQUcsRUFBRSxLQUFHLEVBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxJQUFFLElBQUUsRUFBRSxLQUFHO01BQUc7TUFBQyxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxLQUFJLElBQUUsSUFBRSxHQUFFLElBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtPQUFDLElBQUUsSUFBRSxLQUFHLEdBQUUsSUFBRSxLQUFHLElBQUUsRUFBRSxLQUFHLEtBQUcsT0FBSyxNQUFJLElBQUUsTUFBSSxLQUFHO09BQUksRUFBRSxLQUFHLEVBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxJQUFFLElBQUUsRUFBRSxLQUFHO01BQUc7TUFBQyxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtPQUFDLElBQUk7T0FBRSxJQUFFLEtBQUcsR0FBRSxJQUFFLEtBQUcsSUFBRSxFQUFFO09BQUksRUFBRSxLQUFHLEVBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxJQUFFLElBQUUsRUFBRSxLQUFHO01BQUc7S0FBQyxPQUFNLElBQUcsS0FBRyxHQUFFO01BQUMsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7T0FBQyxJQUFFLEtBQUc7T0FBRSxJQUFJLElBQUUsRUFBRSxJQUFFLEtBQUc7T0FBRyxFQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsS0FBRyxHQUFFLEVBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO01BQUU7TUFBQyxJQUFHLE1BQUksR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtPQUFDLElBQUk7T0FBRSxJQUFFLEtBQUcsR0FBRSxJQUFFLEVBQUUsSUFBRSxLQUFHO09BQUcsRUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsS0FBRyxHQUFFLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRTtNQUFFO0tBQUMsT0FBTSxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsRUFBRSxLQUFLLE9BQUssRUFBRSxLQUFLLE9BQUssSUFBRyxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7TUFBQyxJQUFJLElBQUUsSUFBRSxHQUFFLElBQUUsSUFBRTtNQUFFLElBQUcsS0FBRyxHQUFFLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7T0FBQyxJQUFJLEtBQUcsSUFBRSxPQUFLLEVBQUUsS0FBRyxNQUFJLFFBQU0sS0FBRyxJQUFFLEtBQUcsT0FBSyxNQUFJLElBQUUsSUFBRTtPQUFJLEVBQUUsSUFBRSxLQUFHLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxJQUFFO01BQUM7V0FBTSxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtPQUFDLEtBQUcsSUFBRSxNQUFJLEVBQUUsS0FBRyxNQUFJLFFBQU0sTUFBSSxJQUFFLE1BQUksS0FBRyxPQUFLLEtBQUcsSUFBRSxJQUFFO09BQUksRUFBRSxJQUFFLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLElBQUU7TUFBQztXQUFNLElBQUcsS0FBRyxHQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO09BQUMsS0FBRyxJQUFFLE1BQUksRUFBRSxLQUFHLE1BQUksUUFBTSxNQUFJLElBQUUsTUFBSSxLQUFHLFFBQU0sS0FBRyxJQUFFLElBQUU7T0FBSSxFQUFFLElBQUUsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLEtBQUcsSUFBRTtNQUFDO1dBQU0sSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7T0FBQyxLQUFHLElBQUUsRUFBRSxJQUFFLE9BQUssSUFBRSxJQUFFO09BQUksRUFBRSxJQUFFLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLElBQUU7TUFBQztXQUFNLElBQUcsTUFBSSxHQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO09BQUMsSUFBRSxFQUFFLEtBQUcsS0FBRyxLQUFJLElBQUUsRUFBRSxHQUFFLEtBQUcsS0FBRyxFQUFFLEtBQUcsSUFBRSxJQUFFO09BQUksRUFBRSxJQUFFLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLElBQUU7TUFBQztLQUFDO0tBQUMsT0FBTztJQUFDO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxJQUFJLElBQUUsRUFBRSxDQUFDLEdBQUUsSUFBRSxLQUFLLEtBQUssSUFBRSxJQUFFLENBQUMsR0FBRSxJQUFFLElBQUksWUFBWSxJQUFFLElBQUUsRUFBRSxhQUFXLENBQUM7S0FBRSxPQUFPLElBQUUsRUFBRSxLQUFLLE9BQUssRUFBRSxHQUFFLENBQUMsSUFBRSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEtBQUcsRUFBRSxZQUFVLElBQUUsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsSUFBRSxLQUFHLEVBQUUsY0FBWSxJQUFFLFNBQVMsR0FBRSxHQUFFO01BQUMsSUFBSSxJQUFFLEVBQUUsT0FBTSxJQUFFLEVBQUUsUUFBTyxJQUFFLEVBQUUsQ0FBQyxHQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsS0FBSyxLQUFLLElBQUUsSUFBRSxDQUFDLEdBQUUsSUFBRSxJQUFJLFdBQVcsSUFBRSxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUU7T0FBQztPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtNQUFDLEdBQUUsSUFBRTtPQUFDO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO01BQUMsR0FBRSxJQUFFO09BQUM7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7TUFBQyxHQUFFLElBQUU7T0FBQztPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtNQUFDLEdBQUUsSUFBRTtNQUFFLE9BQUssSUFBRSxJQUFHO09BQUMsS0FBSSxJQUFJLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLElBQUcsSUFBRSxJQUFHLEtBQUcsR0FBRTtPQUFJLEtBQUksSUFBSSxJQUFFLEVBQUUsSUFBRyxJQUFFLElBQUcsS0FBRyxHQUFFO09BQUksSUFBSSxJQUFFLEtBQUssS0FBSyxJQUFFLElBQUUsQ0FBQztPQUFFLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxDQUFDO09BQUUsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsSUFBRyxJQUFFLElBQUc7UUFBQyxLQUFJLElBQUksSUFBRSxFQUFFLElBQUcsSUFBRSxJQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsSUFBRztTQUFDLElBQUk7U0FBRSxJQUFHLEtBQUcsR0FBRSxLQUFHLElBQUUsRUFBRSxLQUFHLE9BQUssS0FBRyxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsS0FBRyxLQUFHLE9BQUssS0FBRyxLQUFHLElBQUU7U0FBRyxJQUFHLEtBQUcsR0FBRSxLQUFHLElBQUUsRUFBRSxLQUFHLE9BQUssS0FBRyxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsS0FBRyxLQUFHLE9BQUssS0FBRyxNQUFJLElBQUUsTUFBSTtTQUFHLElBQUcsS0FBRyxHQUFFLEtBQUcsSUFBRSxFQUFFLEtBQUcsT0FBSyxLQUFHLElBQUUsS0FBRyxJQUFHLEVBQUUsSUFBRSxLQUFHLEtBQUcsT0FBSyxLQUFHLE1BQUksSUFBRSxNQUFJO1NBQUcsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFJLElBQUUsSUFBRSxJQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsR0FBRyxLQUFHLEtBQUc7U0FBRyxLQUFHLEdBQUUsS0FBRztRQUFDO1FBQUMsS0FBSSxLQUFHO09BQUM7T0FBQyxJQUFFLEtBQUcsTUFBSSxLQUFHLEtBQUcsSUFBRSxLQUFJLEtBQUc7TUFBQztNQUFDLE9BQU87S0FBQyxFQUFFLEdBQUUsQ0FBQyxJQUFHO0lBQUM7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFO0tBQUMsT0FBTyxFQUFFLElBQUksV0FBVyxFQUFFLFFBQU8sR0FBRSxFQUFFLFNBQU8sQ0FBQyxHQUFFLENBQUM7SUFBQztJQUFDLElBQUksSUFBRSxXQUFVO0tBQUMsSUFBSSxHQUFFLEdBQUUsS0FBRyxJQUFFLGFBQVksSUFBRSxhQUFZO01BQUMsR0FBRSxJQUFJLEVBQUUsRUFBRTtNQUFFLEdBQUUsSUFBSSxFQUFFLEVBQUU7TUFBRSxHQUFFO09BQUM7T0FBRztPQUFHO09BQUc7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUc7T0FBRTtPQUFHO09BQUU7T0FBRztPQUFFO09BQUc7T0FBRTtPQUFHO09BQUU7TUFBRTtNQUFFLEdBQUU7T0FBQztPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBSTtPQUFJO09BQUk7T0FBSTtPQUFJO09BQUk7T0FBSTtPQUFJO01BQUc7TUFBRSxHQUFFO09BQUM7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtNQUFDO01BQUUsR0FBRSxJQUFJLEVBQUUsRUFBRTtNQUFFLEdBQUU7T0FBQztPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBSTtPQUFJO09BQUk7T0FBSTtPQUFJO09BQUk7T0FBSztPQUFLO09BQUs7T0FBSztPQUFLO09BQUs7T0FBSztPQUFNO09BQU07T0FBTTtPQUFNO01BQUs7TUFBRSxHQUFFO09BQUM7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFFO09BQUU7T0FBRTtPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRTtNQUFDO01BQUUsR0FBRSxJQUFJLEVBQUUsRUFBRTtNQUFFLEdBQUUsSUFBSSxFQUFFLEdBQUc7TUFBRSxHQUFFLENBQUM7TUFBRSxHQUFFLElBQUksRUFBRSxFQUFFO01BQUUsR0FBRSxDQUFDO01BQUUsR0FBRSxJQUFJLEVBQUUsS0FBSztNQUFFLEdBQUUsQ0FBQztNQUFFLEdBQUUsQ0FBQztNQUFFLEdBQUUsSUFBSSxFQUFFLEtBQUs7TUFBRSxHQUFFLENBQUM7TUFBRSxHQUFFLElBQUksRUFBRSxHQUFHO01BQUUsR0FBRSxDQUFDO01BQUUsR0FBRSxJQUFJLEVBQUUsS0FBSztNQUFFLEdBQUUsSUFBSSxFQUFFLEdBQUc7TUFBRSxHQUFFLElBQUksRUFBRSxFQUFFO01BQUUsR0FBRSxJQUFJLEVBQUUsRUFBRTtNQUFFLEdBQUUsSUFBSSxFQUFFLElBQUk7TUFBRSxHQUFFLElBQUksRUFBRSxLQUFLO01BQUUsR0FBRSxJQUFJLEVBQUUsS0FBSztLQUFDO0tBQUcsU0FBUyxFQUFFLEdBQUUsR0FBRTtNQUFDLEtBQUksSUFBSSxHQUFFLEdBQUUsR0FBRSxHQUFFLElBQUUsRUFBRSxRQUFPLElBQUUsRUFBRSxHQUFFLElBQUUsR0FBRSxLQUFHLEdBQUUsS0FBSSxFQUFFLEtBQUc7TUFBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsRUFBRSxHQUFHO01BQUcsSUFBSSxJQUFFLEVBQUU7TUFBRSxLQUFJLElBQUUsR0FBRSxFQUFFLEtBQUcsR0FBRSxJQUFFLEdBQUUsS0FBRyxHQUFFLEtBQUksSUFBRSxJQUFFLEVBQUUsSUFBRSxNQUFJLEdBQUUsRUFBRSxLQUFHO01BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUcsR0FBRSxNQUFJLElBQUUsRUFBRSxJQUFFLFFBQU0sRUFBRSxLQUFHLEVBQUUsSUFBRyxFQUFFLEVBQUU7S0FBRztLQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRTtNQUFDLEtBQUksSUFBSSxJQUFFLEVBQUUsUUFBTyxJQUFFLEVBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUcsR0FBRSxJQUFHLEtBQUcsRUFBRSxJQUFFLElBQUcsS0FBSSxJQUFJLElBQUUsS0FBRyxHQUFFLElBQUUsRUFBRSxJQUFFLElBQUcsSUFBRSxLQUFHLElBQUUsR0FBRSxJQUFFLElBQUUsR0FBRSxJQUFFLEVBQUUsTUFBSSxHQUFFLElBQUUsS0FBRyxLQUFHLElBQUcsS0FBRyxJQUFJLEVBQUUsRUFBRSxPQUFLLEtBQUcsS0FBRyxHQUFFO0tBQUk7S0FBQyxTQUFTLEVBQUUsR0FBRSxHQUFFO01BQUMsS0FBSSxJQUFJLElBQUUsRUFBRSxHQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxLQUFHLEdBQUU7T0FBQyxJQUFJLElBQUUsRUFBRSxNQUFJLElBQUUsRUFBRSxJQUFFO09BQUcsRUFBRSxLQUFHLEVBQUUsT0FBSztNQUFDO0tBQUM7S0FBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7TUFBQyxRQUFPLEVBQUUsTUFBSSxLQUFHLEVBQUUsS0FBRyxNQUFJLE9BQUssUUFBTSxJQUFFLE1BQUksS0FBRyxLQUFHO0tBQUM7S0FBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7TUFBQyxRQUFPLEVBQUUsTUFBSSxLQUFHLEVBQUUsS0FBRyxNQUFJLE9BQUssSUFBRSxFQUFFLEtBQUcsTUFBSSxPQUFLLFNBQU8sSUFBRSxNQUFJLEtBQUcsS0FBRztLQUFDO0tBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRTtNQUFDLFFBQU8sRUFBRSxNQUFJLEtBQUcsRUFBRSxLQUFHLE1BQUksT0FBSyxJQUFFLEVBQUUsS0FBRyxNQUFJLE9BQUssU0FBTyxJQUFFO0tBQUU7S0FBQyxTQUFTLEVBQUUsR0FBRSxHQUFFO01BQUMsSUFBSSxJQUFFLEVBQUU7TUFBTyxJQUFHLEtBQUcsR0FBRSxPQUFPO01BQUUsSUFBSSxJQUFFLElBQUksV0FBVyxLQUFLLElBQUksS0FBRyxHQUFFLENBQUMsQ0FBQztNQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUUsQ0FBQyxHQUFFO0tBQUM7S0FBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7TUFBQyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsSUFBRztPQUFDLElBQUksSUFBRSxFQUFFLEVBQUUsR0FBRSxDQUFDLElBQUU7T0FBRyxLQUFHLEtBQUc7T0FBRSxJQUFJLElBQUUsTUFBSTtPQUFFLElBQUcsS0FBRyxJQUFHLEVBQUUsS0FBRyxHQUFFO1lBQVE7UUFBQyxJQUFJLElBQUUsR0FBRSxJQUFFO1FBQUUsTUFBSSxLQUFHLElBQUUsSUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsS0FBRyxHQUFFLElBQUUsRUFBRSxJQUFFLE1BQUksTUFBSSxLQUFHLElBQUUsSUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsS0FBRyxLQUFHLE1BQUksTUFBSSxJQUFFLEtBQUcsRUFBRSxHQUFFLEdBQUUsQ0FBQyxHQUFFLEtBQUc7UUFBRyxLQUFJLElBQUksSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFHLEVBQUUsS0FBRyxHQUFFO09BQUc7TUFBQztNQUFDLE9BQU87S0FBQztLQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO01BQUMsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLFdBQVMsR0FBRSxJQUFFLElBQUc7T0FBQyxJQUFJLElBQUUsRUFBRSxJQUFFO09BQUcsRUFBRSxLQUFHLEtBQUcsR0FBRSxFQUFFLEtBQUcsS0FBRyxNQUFJLEdBQUUsSUFBRSxNQUFJLElBQUUsSUFBRztNQUFHO01BQUMsT0FBSyxJQUFFLElBQUcsRUFBRSxLQUFHLEtBQUcsR0FBRSxFQUFFLEtBQUcsS0FBRyxNQUFJLEdBQUU7TUFBSSxPQUFPO0tBQUM7S0FBQyxPQUFPLFdBQVU7TUFBQyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsT0FBTSxLQUFJO09BQUMsSUFBSSxJQUFFO09BQUUsS0FBRyxjQUFZLEtBQUcsY0FBWSxLQUFHLGNBQVksS0FBRyxhQUFXLE9BQUssS0FBRyxhQUFXLE1BQUksUUFBTSxLQUFHLFlBQVUsTUFBSSxRQUFNLEtBQUcsWUFBVSxNQUFJLFFBQU0sS0FBRyxXQUFTLE1BQUksR0FBRSxFQUFFLEVBQUUsTUFBSSxNQUFJLEtBQUcsS0FBRyxRQUFNO01BQUU7TUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7T0FBQyxPQUFLLEtBQUcsTUFBSyxFQUFFLEtBQUssR0FBRSxDQUFDO01BQUM7TUFBQyxLQUFJLElBQUUsR0FBRSxJQUFFLElBQUcsS0FBSSxFQUFFLEVBQUUsS0FBRyxFQUFFLEVBQUUsTUFBSSxJQUFFLEVBQUUsRUFBRSxJQUFHLEVBQUUsRUFBRSxLQUFHLEVBQUUsRUFBRSxNQUFJLElBQUUsRUFBRSxFQUFFO01BQUcsRUFBRSxFQUFFLEdBQUUsS0FBSSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsS0FBSSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsSUFBRyxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsRUFBRSxHQUFFLEdBQUUsRUFBRSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsRUFBRSxHQUFFLElBQUcsQ0FBQyxHQUFFLEVBQUUsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEVBQUUsR0FBRSxHQUFFLEVBQUUsQ0FBQyxHQUFFLEVBQUUsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEVBQUUsR0FBRSxJQUFHLENBQUMsR0FBRSxFQUFFLEVBQUUsR0FBRSxLQUFJLENBQUMsR0FBRSxFQUFFLEVBQUUsR0FBRSxJQUFHLENBQUMsR0FBRSxFQUFFLEVBQUUsR0FBRSxLQUFJLENBQUM7S0FBQyxFQUFFLEdBQUUsU0FBUyxHQUFFLEdBQUU7TUFBQyxJQUFJLEdBQUUsR0FBRSxJQUFFLFlBQVcsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFO01BQUUsSUFBRyxLQUFHLEVBQUUsTUFBSSxLQUFHLEVBQUUsSUFBRyxPQUFPLEtBQUcsSUFBSSxFQUFFLENBQUM7TUFBRSxJQUFJLElBQUUsUUFBTTtNQUFFLEtBQUksTUFBSSxJQUFFLElBQUksRUFBRSxFQUFFLFdBQVMsS0FBRyxDQUFDLElBQUcsS0FBRyxJQUFHLElBQUcsSUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsSUFBRSxFQUFFLEdBQUUsSUFBRSxHQUFFLENBQUMsR0FBRSxLQUFHLEdBQUUsS0FBRyxHQUFFO09BQUMsSUFBRyxNQUFJLElBQUUsRUFBRSxHQUFFLEtBQUcsS0FBRyxHQUFHLElBQUcsS0FBRyxNQUFJLElBQUUsRUFBRSxHQUFFLElBQUUsRUFBRSxHQUFFLElBQUUsS0FBSSxJQUFFLEtBQUksS0FBRyxHQUFFO1FBQUMsSUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLElBQUUsS0FBSSxJQUFFLEVBQUUsR0FBRSxJQUFFLEdBQUUsQ0FBQyxJQUFFLEdBQUUsSUFBRSxFQUFFLEdBQUUsSUFBRSxJQUFHLENBQUMsSUFBRSxHQUFFLEtBQUc7UUFBRyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLElBQUcsS0FBRyxHQUFFLEVBQUUsRUFBRSxLQUFHLEdBQUUsRUFBRSxFQUFFLElBQUUsS0FBRztRQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO1NBQUMsSUFBSSxJQUFFLEVBQUUsR0FBRSxJQUFFLElBQUUsR0FBRSxDQUFDO1NBQUUsRUFBRSxFQUFFLEtBQUcsRUFBRSxFQUFFLE1BQUksTUFBSSxHQUFFLElBQUUsTUFBSSxJQUFFO1FBQUU7UUFBQyxLQUFHLElBQUUsR0FBRSxFQUFFLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsR0FBRSxFQUFFLENBQUMsR0FBRSxJQUFFLEVBQUUsR0FBRSxJQUFFLEVBQUUsR0FBRSxJQUFFLEVBQUUsRUFBRSxJQUFHLEtBQUcsS0FBRyxHQUFFLElBQUUsR0FBRSxHQUFFLEdBQUUsRUFBRSxDQUFDO1FBQUUsSUFBSSxJQUFFLEVBQUUsRUFBRSxHQUFFLEdBQUUsR0FBRSxFQUFFLENBQUM7UUFBRSxLQUFHLEtBQUcsS0FBRztRQUFFLElBQUksSUFBRSxFQUFFLEVBQUUsR0FBRSxHQUFFLEdBQUUsRUFBRSxDQUFDO1FBQUUsS0FBRyxLQUFHLEtBQUcsR0FBRSxFQUFFLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsRUFBRSxHQUFFLEdBQUUsQ0FBQztPQUFDO09BQUMsU0FBTztRQUFDLElBQUksSUFBRSxFQUFFLEVBQUUsR0FBRSxDQUFDLElBQUU7UUFBRyxLQUFHLEtBQUc7UUFBRSxJQUFJLElBQUUsTUFBSTtRQUFFLElBQUcsTUFBSSxLQUFHLEdBQUUsRUFBRSxPQUFLO2FBQU07U0FBQyxJQUFHLE9BQUssR0FBRTtTQUFNLElBQUksSUFBRSxJQUFFLElBQUU7U0FBSSxJQUFHLElBQUUsS0FBSTtVQUFDLElBQUksSUFBRSxFQUFFLEVBQUUsSUFBRTtVQUFLLElBQUUsS0FBRyxNQUFJLEtBQUcsRUFBRSxHQUFFLEdBQUUsSUFBRSxDQUFDLEdBQUUsS0FBRyxJQUFFO1NBQUM7U0FBQyxJQUFJLElBQUUsRUFBRSxFQUFFLEdBQUUsQ0FBQyxJQUFFO1NBQUcsS0FBRyxLQUFHO1NBQUUsSUFBSSxJQUFFLE1BQUksR0FBRSxJQUFFLEVBQUUsRUFBRSxJQUFHLEtBQUcsTUFBSSxLQUFHLEVBQUUsR0FBRSxHQUFFLEtBQUcsQ0FBQztTQUFFLEtBQUksS0FBRyxLQUFHLEdBQUUsTUFBSSxJQUFFLEVBQUUsR0FBRSxLQUFHLEtBQUcsR0FBRyxJQUFHLElBQUUsSUFBRyxFQUFFLEtBQUcsRUFBRSxNQUFJLElBQUcsRUFBRSxLQUFHLEVBQUUsTUFBSSxJQUFHLEVBQUUsS0FBRyxFQUFFLE1BQUksSUFBRyxFQUFFLEtBQUcsRUFBRSxNQUFJO1NBQUcsSUFBRTtRQUFDO09BQUM7TUFBQyxPQUFLO09BQUMsSUFBRSxNQUFJLEtBQUcsS0FBRyxJQUFFO09BQUksSUFBSSxJQUFFLEtBQUcsTUFBSSxJQUFHLElBQUUsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLE1BQUk7T0FBRSxNQUFJLElBQUUsRUFBRSxHQUFFLElBQUUsQ0FBQyxJQUFHLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxRQUFPLEVBQUUsYUFBVyxHQUFFLENBQUMsR0FBRSxDQUFDLEdBQUUsSUFBRSxJQUFFLEtBQUcsR0FBRSxLQUFHO01BQUM7TUFBQyxPQUFPLEVBQUUsVUFBUSxJQUFFLElBQUUsRUFBRSxNQUFNLEdBQUUsQ0FBQztLQUFDO0lBQUMsRUFBRTtJQUFFLFNBQVMsRUFBRSxHQUFFO0tBQUMsT0FBTTtNQUFDO01BQUU7TUFBSztNQUFFO01BQUU7TUFBRTtNQUFLO0tBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBTyxFQUFFO0lBQUs7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsSUFBSSxJQUFFLEVBQUUsQ0FBQyxHQUFFLElBQUUsS0FBSyxLQUFLLElBQUUsSUFBRSxDQUFDO0tBQUUsSUFBRSxLQUFLLEtBQUssSUFBRSxDQUFDO0tBQUUsSUFBSSxHQUFFLEdBQUUsSUFBRSxFQUFFLElBQUcsSUFBRTtLQUFFLElBQUcsSUFBRSxNQUFJLEVBQUUsS0FBRztNQUFDO01BQUU7TUFBRTtLQUFDLENBQUMsQ0FBQyxJQUFFLEtBQUksS0FBRyxHQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRSxNQUFJLEVBQUUsSUFBRSxJQUFFLE9BQUssS0FBRztLQUFJLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksSUFBRyxJQUFFLEdBQUUsTUFBSSxJQUFFLEdBQUcsS0FBRyxJQUFFLElBQUUsSUFBRSxLQUFHLElBQUUsS0FBRyxLQUFJLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO1VBQVEsSUFBRyxLQUFHLEdBQUU7TUFBQyxPQUFLLElBQUUsR0FBRSxLQUFJLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRTtNQUFHLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUU7S0FBRSxPQUFNLElBQUcsS0FBRyxHQUFFLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUU7VUFBUSxJQUFHLEtBQUcsR0FBRTtNQUFDLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLE1BQUksRUFBRSxJQUFFLElBQUUsT0FBSztNQUFHLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLE1BQUksRUFBRSxJQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRSxPQUFLO0tBQUUsT0FBSztNQUFDLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxHQUFFLEVBQUUsSUFBRSxJQUFFLElBQUcsQ0FBQztNQUFFLE9BQUssSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRSxFQUFFLElBQUUsSUFBRSxJQUFHLEVBQUUsSUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLElBQUUsSUFBRSxFQUFFO0tBQUM7S0FBQyxPQUFPO0lBQUM7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxJQUFJLElBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFO0tBQUUsT0FBTyxJQUFFLEtBQUcsSUFBRSxLQUFHLElBQUUsS0FBRyxJQUFFLElBQUUsSUFBRSxJQUFFLEtBQUcsSUFBRSxJQUFFLElBQUU7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRTtLQUFDLEVBQUUsUUFBTSxFQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsS0FBRyxHQUFFLEVBQUUsU0FBTyxFQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsS0FBRyxHQUFFLEVBQUUsUUFBTSxFQUFFLElBQUcsS0FBSSxFQUFFLFFBQU0sRUFBRSxJQUFHLEtBQUksRUFBRSxXQUFTLEVBQUUsSUFBRyxLQUFJLEVBQUUsU0FBTyxFQUFFLElBQUcsS0FBSSxFQUFFLFlBQVUsRUFBRSxJQUFHO0lBQUc7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxLQUFJLElBQUksSUFBRSxLQUFLLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBRSxLQUFLLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxJQUFHLEtBQUcsS0FBRyxLQUFHLEtBQUcsSUFBRSxJQUFFLElBQUUsS0FBRyxHQUFFLEtBQUcsSUFBRSxLQUFHLElBQUUsSUFBRSxLQUFHLE1BQUksS0FBRyxDQUFDLElBQUUsS0FBRyxJQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsSUFBRSxJQUFFLEtBQUcsSUFBRyxLQUFHLEdBQUUsRUFBRSxLQUFHLEVBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUU7VUFBUSxJQUFHLEtBQUcsR0FBRTtNQUFDLElBQUksSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLEtBQUcsR0FBRSxJQUFFLEVBQUUsSUFBRSxLQUFHLEdBQUUsSUFBRSxFQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsRUFBRSxJQUFFLE1BQUksSUFBRSxNQUFLLElBQUUsRUFBRSxLQUFHLEdBQUUsSUFBRSxFQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsRUFBRSxJQUFFLEtBQUcsR0FBRSxJQUFFLElBQUUsR0FBRSxJQUFFLElBQUUsSUFBRSxHQUFFLElBQUUsS0FBRyxJQUFFLElBQUUsSUFBRTtNQUFFLEVBQUUsSUFBRSxLQUFHLE1BQUksR0FBRSxFQUFFLElBQUUsTUFBSSxJQUFFLElBQUUsS0FBRyxHQUFFLEVBQUUsSUFBRSxNQUFJLElBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLE1BQUksSUFBRSxJQUFFLEtBQUc7S0FBQyxPQUFNLElBQUcsS0FBRyxHQUFFO01BQUMsSUFBRSxFQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFLElBQUcsSUFBRSxFQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFO01BQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLEVBQUUsS0FBRyxHQUFFLEVBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsS0FBRyxNQUFJLEVBQUUsS0FBRyxHQUFFLEVBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsS0FBRztLQUFFLE9BQU0sSUFBRyxLQUFHLEdBQUU7TUFBQyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFLElBQUcsSUFBRSxFQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFLElBQUcsSUFBRSxFQUFFLElBQUU7TUFBRyxJQUFHLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxLQUFHLEtBQUcsR0FBRTtNQUFTLElBQUcsSUFBRSxPQUFLLElBQUUsSUFBRyxPQUFNLENBQUM7S0FBQztLQUFDLE9BQU0sQ0FBQztJQUFDO0lBQUMsT0FBTTtLQUFDLFFBQU8sU0FBUyxHQUFFO01BQUMsS0FBSSxJQUFJLEdBQUUsSUFBRSxJQUFJLFdBQVcsQ0FBQyxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLFlBQVcsSUFBRSxFQUFFLFVBQVMsSUFBRTtPQUFDLE1BQUssQ0FBQztPQUFFLFFBQU8sQ0FBQztNQUFDLEdBQUUsSUFBRSxJQUFJLFdBQVcsRUFBRSxNQUFNLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFO09BQUM7T0FBSTtPQUFHO09BQUc7T0FBRztPQUFHO09BQUc7T0FBRztNQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLElBQUcsRUFBRSxNQUFJLEVBQUUsSUFBRyxNQUFLO01BQStCLE9BQUssSUFBRSxFQUFFLFNBQVE7T0FBQyxJQUFJLElBQUUsRUFBRSxTQUFTLEdBQUUsQ0FBQztPQUFFLEtBQUc7T0FBRSxJQUFJLElBQUUsRUFBRSxVQUFVLEdBQUUsR0FBRSxDQUFDO09BQUUsSUFBRyxLQUFHLEdBQUUsVUFBUSxHQUFFLEVBQUUsR0FBRSxHQUFFLENBQUM7WUFBTyxJQUFHLFVBQVEsR0FBRTtRQUFDLEtBQUksSUFBSSxJQUFFLEdBQUUsS0FBRyxFQUFFLEtBQUk7UUFBSSxFQUFFLFVBQVUsR0FBRSxHQUFFLElBQUUsQ0FBQyxHQUFFLEVBQUUsSUFBRTtRQUFHLElBQUksSUFBRSxFQUFFLE1BQU0sSUFBRSxHQUFFLElBQUUsQ0FBQyxHQUFFLElBQUU7UUFBSyxJQUFHO1NBQUMsSUFBRSxFQUFFLENBQUM7UUFBQyxTQUFPLEdBQUU7U0FBQyxJQUFFLEVBQUUsQ0FBQztRQUFDO1FBQUMsRUFBRSxLQUFLLEtBQUc7T0FBQyxPQUFNLElBQUcsVUFBUSxHQUFFLEVBQUUsS0FBSyxLQUFHLEVBQUUsTUFBTSxHQUFFLElBQUUsQ0FBQztZQUFPLElBQUcsVUFBUSxHQUFFO1FBQUMsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO1FBQUcsS0FBRztPQUFDLE9BQU0sSUFBRyxVQUFRLEdBQUUsRUFBRSxLQUFLLEtBQUc7UUFBQyxZQUFXLEVBQUUsR0FBRSxDQUFDO1FBQUUsV0FBVSxFQUFFLEdBQUUsSUFBRSxDQUFDO09BQUMsR0FBRSxJQUFFLElBQUksV0FBVyxFQUFFLE1BQU07WUFBTyxJQUFHLFVBQVEsR0FBRTtRQUFDLElBQUk7UUFBRSxJQUFHLEtBQUcsR0FBRSxDQUFDLElBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxTQUFPLEdBQUEsQ0FBSSxPQUFLLEVBQUUsR0FBRSxFQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsRUFBRSxLQUFLLE9BQU0sRUFBRSxLQUFLLE1BQU0sR0FBRSxJQUFFO1FBQUUsSUFBSSxJQUFFO1NBQUMsR0FBRSxFQUFFLEdBQUUsSUFBRSxFQUFFO1NBQUUsR0FBRSxFQUFFLEdBQUUsSUFBRSxFQUFFO1NBQUUsT0FBTSxFQUFFLEdBQUUsSUFBRSxDQUFDO1NBQUUsUUFBTyxFQUFFLEdBQUUsSUFBRSxDQUFDO1FBQUMsR0FBRSxJQUFFLEVBQUUsR0FBRSxJQUFFLEVBQUU7UUFBRSxJQUFFLEVBQUUsR0FBRSxJQUFFLEVBQUUsS0FBRyxLQUFHLElBQUUsTUFBSTtRQUFHLElBQUksSUFBRTtTQUFDLE1BQUs7U0FBRSxPQUFNLEtBQUssTUFBTSxNQUFJLENBQUM7U0FBRSxTQUFRLEVBQUUsSUFBRTtTQUFJLE9BQU0sRUFBRSxJQUFFO1FBQUc7UUFBRSxFQUFFLE9BQU8sS0FBSyxDQUFDO09BQUMsT0FBTSxJQUFHLFVBQVEsR0FBRTtRQUFDLEtBQUksSUFBRSxHQUFFLElBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLElBQUU7UUFBRyxLQUFHLElBQUU7T0FBQyxPQUFNLElBQUcsVUFBUSxHQUFFLEVBQUUsS0FBSyxLQUFHO1FBQUMsRUFBRSxTQUFTLEdBQUUsQ0FBQztRQUFFLEVBQUUsU0FBUyxHQUFFLElBQUUsQ0FBQztRQUFFLEVBQUUsSUFBRTtPQUFFO1lBQU8sSUFBRyxVQUFRLEdBQUU7UUFBQyxFQUFFLEtBQUssS0FBRyxDQUFDO1FBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxHQUFFLElBQUUsSUFBRSxDQUFDLENBQUM7T0FBQyxPQUFNLElBQUcsVUFBUSxLQUFHLFVBQVEsR0FBRTtRQUFDLEVBQVEsS0FBSyxPQUFLLEVBQUUsS0FBSyxLQUFHLENBQUM7UUFBRyxJQUFJLElBQUUsRUFBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLElBQUUsRUFBRSxVQUFVLEdBQUUsR0FBRSxJQUFFLENBQUMsR0FBRSxJQUFFLElBQUUsSUFBRSxJQUFFO1FBQUUsSUFBRyxVQUFRLEdBQUUsSUFBRSxFQUFFLFVBQVUsR0FBRSxJQUFFLEdBQUUsQ0FBQzthQUFNO1NBQUMsSUFBSSxJQUFFLEVBQUUsRUFBRSxNQUFNLElBQUUsR0FBRSxJQUFFLElBQUUsQ0FBQyxDQUFDO1NBQUUsSUFBRSxFQUFFLFNBQVMsR0FBRSxHQUFFLEVBQUUsTUFBTTtRQUFDO1FBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFHO09BQUMsT0FBTSxJQUFHLFVBQVEsR0FBRTtRQUFDLEVBQVEsS0FBSyxPQUFLLEVBQUUsS0FBSyxLQUFHLENBQUM7UUFBRyxJQUFFLEdBQUUsSUFBRTtRQUFFLElBQUUsRUFBRSxTQUFTLEdBQUUsQ0FBQztRQUFFLElBQUUsRUFBRSxVQUFVLEdBQUUsR0FBRSxJQUFFLENBQUM7UUFBRSxJQUFJLElBQUUsRUFBRSxJQUFFLElBQUU7UUFBRyxFQUFFLElBQUUsSUFBRyxLQUFHLEdBQUUsSUFBRSxFQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBRSxVQUFVLEdBQUUsR0FBRSxJQUFFLENBQUMsR0FBRSxJQUFFLElBQUUsR0FBRSxJQUFFLEVBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFFLFNBQVMsR0FBRSxHQUFFLElBQUUsQ0FBQztRQUFFLElBQUk7UUFBRSxJQUFFLE1BQUksSUFBRSxJQUFFLEtBQUc7UUFBRyxJQUFHLEtBQUcsR0FBRSxJQUFFLEVBQUUsU0FBUyxHQUFFLEdBQUUsQ0FBQzthQUFNO1NBQUMsSUFBRSxFQUFFLEVBQUUsTUFBTSxHQUFFLElBQUUsQ0FBQyxDQUFDO1NBQUUsSUFBRSxFQUFFLFNBQVMsR0FBRSxHQUFFLEVBQUUsTUFBTTtRQUFDO1FBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFHO09BQUMsT0FBTSxJQUFHLFVBQVEsR0FBRSxFQUFFLEtBQUssS0FBRyxFQUFFLFVBQVUsR0FBRSxHQUFFLENBQUM7WUFBTyxJQUFHLFVBQVEsR0FBRTtRQUFDLElBQUksSUFBRSxFQUFFLEtBQUssS0FBSyxTQUFPO1FBQUUsRUFBRSxLQUFLLEtBQUcsQ0FBQztRQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUUsSUFBRSxJQUFFLENBQUMsQ0FBQztPQUFDLE9BQU0sSUFBRyxVQUFRLEdBQUUsS0FBRyxFQUFFLFFBQU0sRUFBRSxLQUFLLEtBQUcsRUFBRSxVQUFVLEdBQUUsR0FBRSxDQUFDLElBQUUsS0FBRyxFQUFFLFFBQU0sRUFBRSxLQUFLLEtBQUcsRUFBRSxHQUFFLENBQUMsSUFBRSxLQUFHLEVBQUUsVUFBUSxFQUFFLEtBQUssS0FBRztRQUFDLEVBQUUsR0FBRSxDQUFDO1FBQUUsRUFBRSxHQUFFLElBQUUsQ0FBQztRQUFFLEVBQUUsR0FBRSxJQUFFLENBQUM7T0FBQztZQUFRLElBQUcsVUFBUSxHQUFFLEVBQUUsS0FBSyxLQUFHLEVBQUUsU0FBUyxHQUFFLENBQUMsSUFBRTtZQUFTLElBQUcsVUFBUSxHQUFFLEVBQUUsS0FBSyxLQUFHLEVBQUU7WUFBUSxJQUFHLFVBQVEsR0FBRSxLQUFHLEVBQUUsU0FBTyxLQUFHLEVBQUUsUUFBTSxFQUFFLEtBQUssS0FBRyxDQUFDLEVBQUUsR0FBRSxDQUFDLENBQUMsSUFBRSxLQUFHLEVBQUUsU0FBTyxLQUFHLEVBQUUsUUFBTSxFQUFFLEtBQUssS0FBRztRQUFDLEVBQUUsR0FBRSxDQUFDO1FBQUUsRUFBRSxHQUFFLElBQUUsQ0FBQztRQUFFLEVBQUUsR0FBRSxJQUFFLENBQUM7T0FBQyxJQUFFLEtBQUcsRUFBRSxVQUFRLEVBQUUsS0FBSyxLQUFHLEVBQUU7WUFBUyxJQUFHLFVBQVEsR0FBRTtPQUFNLEtBQUcsR0FBRSxFQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsS0FBRztNQUFDO01BQUMsT0FBTyxLQUFHLE1BQUksQ0FBQyxJQUFFLEVBQUUsT0FBTyxFQUFFLE9BQU8sU0FBTyxHQUFBLENBQUksT0FBSyxFQUFFLEdBQUUsRUFBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLEVBQUUsS0FBSyxPQUFNLEVBQUUsS0FBSyxNQUFNLElBQUcsRUFBRSxPQUFLLEVBQUUsR0FBRSxHQUFFLEVBQUUsT0FBTSxFQUFFLE1BQU0sR0FBRSxPQUFPLEVBQUUsVUFBUyxPQUFPLEVBQUUsV0FBVSxPQUFPLEVBQUUsUUFBTztLQUFDO0tBQUUsU0FBUSxTQUFTLEdBQUU7TUFBQyxJQUFJLElBQUUsRUFBRSxPQUFNLElBQUUsRUFBRTtNQUFPLElBQUcsUUFBTSxFQUFFLEtBQUssTUFBSyxPQUFNLENBQUMsRUFBRSxFQUFFLE1BQUssR0FBRSxHQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07TUFBRSxJQUFJLElBQUUsQ0FBQztNQUFFLEVBQVEsT0FBTyxFQUFFLENBQUMsU0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLE9BQUssRUFBRTtNQUFNLEtBQUksSUFBSSxJQUFFLElBQUUsSUFBRSxHQUFFLElBQUUsSUFBSSxXQUFXLENBQUMsR0FBRSxJQUFFLElBQUksV0FBVyxDQUFDLEdBQUUsSUFBRSxJQUFJLFdBQVcsQ0FBQyxHQUFFLElBQUUsR0FBRSxJQUFFLEVBQUUsT0FBTyxRQUFPLEtBQUk7T0FBQyxJQUFJLElBQUUsRUFBRSxPQUFPLElBQUcsSUFBRSxFQUFFLEtBQUssR0FBRSxJQUFFLEVBQUUsS0FBSyxHQUFFLElBQUUsRUFBRSxLQUFLLE9BQU0sSUFBRSxFQUFFLEtBQUssUUFBTyxJQUFFLEVBQUUsRUFBRSxNQUFLLEdBQUUsR0FBRSxDQUFDO09BQUUsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEtBQUcsRUFBRTtPQUFHLElBQUcsS0FBRyxFQUFFLFFBQU0sRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsQ0FBQyxJQUFFLEtBQUcsRUFBRSxTQUFPLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEtBQUssRUFBRSxPQUFPLE1BQU0sQ0FBQyxDQUFDLEdBQUUsS0FBRyxFQUFFO1lBQWMsSUFBRyxLQUFHLEVBQUUsU0FBUSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxDQUFDO1lBQU8sSUFBRyxLQUFHLEVBQUUsU0FBUSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEtBQUcsRUFBRTtNQUFFO01BQUMsT0FBTztLQUFDO0tBQUUsUUFBTztLQUFFLFdBQVU7S0FBRSxNQUFLO0lBQUM7R0FBQyxFQUFFO0dBQUUsT0FBTyxXQUFVO0lBQUMsSUFBSSxJQUFFLEVBQUUsV0FBVSxJQUFFLEVBQUUsTUFBSyxJQUFFLEVBQUUsUUFBTyxJQUFFO0tBQUMsT0FBTSxXQUFVO01BQUMsS0FBSSxJQUFJLG9CQUFFLElBQUksWUFBWSxHQUFHLEdBQUUsSUFBRSxHQUFFLElBQUUsS0FBSSxLQUFJO09BQUMsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksSUFBRSxJQUFFLElBQUUsYUFBVyxNQUFJLElBQUUsT0FBSztPQUFFLEVBQUUsS0FBRztNQUFDO01BQUMsT0FBTztLQUFDLEVBQUU7S0FBRSxRQUFPLFNBQVMsR0FBRSxHQUFFLEdBQUUsR0FBRTtNQUFDLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksSUFBRSxFQUFFLE1BQU0sT0FBSyxJQUFFLEVBQUUsSUFBRSxPQUFLLE1BQUk7TUFBRSxPQUFPO0tBQUM7S0FBRSxLQUFJLFNBQVMsR0FBRSxHQUFFLEdBQUU7TUFBQyxPQUFPLGFBQVcsRUFBRSxPQUFPLFlBQVcsR0FBRSxHQUFFLENBQUM7S0FBQztJQUFDO0lBQUUsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxFQUFFLE1BQUksRUFBRSxLQUFHLEtBQUcsR0FBRSxFQUFFLElBQUUsTUFBSSxFQUFFLEtBQUcsS0FBRyxHQUFFLEVBQUUsSUFBRSxNQUFJLEVBQUUsS0FBRyxLQUFHLEdBQUUsRUFBRSxJQUFFLE1BQUksRUFBRSxLQUFHLEtBQUc7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFO0tBQUMsT0FBTyxLQUFLLElBQUksR0FBRSxLQUFLLElBQUksS0FBSSxDQUFDLENBQUM7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUU7S0FBQyxJQUFJLElBQUUsRUFBRSxLQUFHLEVBQUUsSUFBRyxJQUFFLEVBQUUsS0FBRyxFQUFFLElBQUcsSUFBRSxFQUFFLEtBQUcsRUFBRSxJQUFHLElBQUUsRUFBRSxLQUFHLEVBQUU7S0FBRyxPQUFPLElBQUUsSUFBRSxJQUFFLElBQUUsSUFBRSxJQUFFLElBQUU7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsTUFBWTtLQUFHLEtBQUksSUFBSSxJQUFFLEVBQUUsUUFBTyxJQUFFLENBQUMsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7TUFBQyxJQUFJLElBQUUsRUFBRTtNQUFHLEVBQUUsS0FBSztPQUFDLE1BQUksSUFBRTtPQUFJLE1BQUksSUFBRTtPQUFJLE1BQUksS0FBRztPQUFJLE1BQUksS0FBRztNQUFHLENBQUM7S0FBQztLQUFDLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEtBQUksSUFBSSxJQUFFLFlBQVcsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSTtNQUFDLElBQUksSUFBRSxFQUFFLEVBQUUsSUFBRyxFQUFFLEVBQUU7TUFBRSxLQUFHLEtBQUcsSUFBRSxNQUFJLElBQUUsR0FBRSxJQUFFO0tBQUU7S0FBQyxJQUFJLElBQUUsSUFBSSxZQUFZLEVBQUUsTUFBTSxHQUFFLElBQUUsSUFBSSxXQUFXLElBQUUsSUFBRSxDQUFDLEdBQUUsSUFBRTtNQUFDO01BQUU7TUFBRTtNQUFFO01BQUc7TUFBRztNQUFFO01BQUc7TUFBRTtNQUFFO01BQUc7TUFBRTtNQUFFO01BQUc7TUFBRTtNQUFHO0tBQUM7S0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxLQUFJLEVBQUUsS0FBRyxRQUFNLEVBQUUsS0FBRyxNQUFJLEtBQUc7S0FBSSxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7TUFBQyxJQUFJO01BQUUsSUFBRSxLQUFHLElBQUUsSUFBRTtNQUFHLElBQUcsS0FBRyxHQUFFLElBQUU7T0FBQyxFQUFFLEVBQUUsS0FBRyxFQUFFLEVBQUU7T0FBRSxFQUFFLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRSxFQUFFO09BQUUsRUFBRSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsRUFBRTtPQUFFLEVBQUUsRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLEVBQUU7TUFBQztXQUFNO09BQUMsSUFBRSxFQUFFLEtBQUcsSUFBRSxNQUFJLElBQUU7T0FBSSxJQUFFO1FBQUMsRUFBRSxFQUFFLEtBQUcsQ0FBQztRQUFFLEVBQUUsRUFBRSxJQUFFLEtBQUcsQ0FBQztRQUFFLEVBQUUsRUFBRSxJQUFFLEtBQUcsQ0FBQztRQUFFLEVBQUUsRUFBRSxJQUFFLEtBQUcsQ0FBQztPQUFDO01BQUM7TUFBQyxJQUFFO01BQUUsSUFBSSxJQUFFO01BQVMsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7T0FBQyxJQUFJLElBQUUsRUFBRSxHQUFFLEVBQUUsRUFBRTtPQUFFLElBQUUsTUFBSSxJQUFFLEdBQUUsSUFBRTtNQUFFO01BQUMsSUFBSSxJQUFFLEVBQUUsSUFBRyxJQUFFO09BQUMsRUFBRSxLQUFHLEVBQUU7T0FBRyxFQUFFLEtBQUcsRUFBRTtPQUFHLEVBQUUsS0FBRyxFQUFFO09BQUcsRUFBRSxLQUFHLEVBQUU7TUFBRTtNQUFFLEtBQUcsTUFBSSxLQUFHLElBQUUsS0FBRyxFQUFFLEdBQUUsR0FBRSxJQUFFLEdBQUUsQ0FBQyxHQUFFLEtBQUcsSUFBRSxNQUFJLEtBQUcsS0FBRyxFQUFFLEdBQUUsR0FBRSxJQUFFLElBQUUsSUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsR0FBRSxJQUFFLElBQUUsR0FBRSxDQUFDLEdBQUUsS0FBRyxJQUFFLEtBQUcsRUFBRSxHQUFFLEdBQUUsSUFBRSxJQUFFLElBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxLQUFHLEtBQUcsR0FBRSxFQUFFLEtBQUcsS0FBRyxFQUFFO0tBQUU7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxNQUFZLENBQUM7S0FBRyxJQUFJLEdBQUUsSUFBRSxFQUFFLEtBQUksSUFBRSxFQUFFLFdBQVUsSUFBRSxFQUFFLGFBQVksSUFBRSxFQUFFLFlBQVcsSUFBRSxHQUFFLElBQUUsRUFBRSxPQUFPLFNBQU8sR0FBRSxJQUFFLENBQUMsR0FBRSxJQUFFLE1BQUksSUFBRSxLQUFHO0tBQUcsSUFBRyxRQUFNLEVBQUUsU0FBTyxLQUFHLEtBQUksUUFBTSxFQUFFLFNBQU8sS0FBRyxLQUFJLFFBQU0sRUFBRSxTQUFPLEtBQUcsTUFBSSxJQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQSxDQUFHLFNBQU8sSUFBRyxLQUFHLEVBQUUsT0FBTTtNQUFDLEtBQUksSUFBSSxJQUFFLEVBQUUsS0FBSyxRQUFPLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEtBQUssT0FBSyxNQUFJLFFBQU0sSUFBRSxDQUFDO01BQUcsS0FBRyxJQUFFLElBQUUsSUFBRSxLQUFHLElBQUUsSUFBRSxJQUFFLElBQUUsSUFBRTtLQUFFO0tBQUMsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsT0FBTyxRQUFPLEtBQUssTUFBSSxLQUFHLEtBQUksTUFBSSxJQUFFLEVBQUUsT0FBTyxHQUFBLENBQUksS0FBSyxTQUFPLElBQUcsS0FBRyxNQUFJLEtBQUc7S0FBRyxLQUFHO0tBQUcsSUFBSSxJQUFFLElBQUksV0FBVyxDQUFDLEdBQUUsSUFBRTtNQUFDO01BQUk7TUFBRztNQUFHO01BQUc7TUFBRztNQUFHO01BQUc7S0FBRTtLQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsS0FBRyxFQUFFO0tBQUcsSUFBRyxFQUFFLEdBQUUsR0FBRSxFQUFFLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxNQUFNLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxDQUFDLEdBQUUsRUFBRSxLQUFHLEtBQUcsRUFBRSxPQUFNLEVBQUUsRUFBRSxLQUFHLEVBQUUsT0FBTSxFQUFFLEVBQUUsS0FBRyxHQUFFLEVBQUUsRUFBRSxLQUFHLEdBQUUsRUFBRSxFQUFFLEtBQUcsR0FBRSxFQUFFLEdBQUUsRUFBRSxHQUFFLEVBQUUsR0FBRSxJQUFFLElBQUcsRUFBRSxDQUFDLEdBQUUsS0FBRyxHQUFFLFFBQU0sRUFBRSxTQUFPLEVBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLE1BQU0sR0FBRSxFQUFFLEtBQUcsS0FBRyxFQUFFLE1BQUssRUFBRSxHQUFFLEVBQUUsR0FBRSxFQUFFLEdBQUUsSUFBRSxHQUFFLENBQUMsQ0FBQyxHQUFFLEtBQUcsSUFBRyxRQUFNLEVBQUUsTUFBSztNQUFDLElBQUksSUFBRSxLQUFHLEVBQUU7TUFBTyxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxNQUFNLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxhQUFhLEdBQUUsS0FBRyxJQUFHLEtBQUcsR0FBRSxFQUFFLElBQUksR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEtBQUcsRUFBRSxRQUFPLEVBQUUsR0FBRSxLQUFHLElBQUUsSUFBRyxJQUFFLENBQUMsQ0FBQyxHQUFFLEtBQUc7S0FBQztLQUFDLElBQUcsUUFBTSxFQUFFLFNBQU8sRUFBRSxHQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxLQUFHLEdBQUUsTUFBTSxHQUFFLEVBQUUsR0FBRSxLQUFHLEdBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUUsRUFBRSxLQUFHLEtBQUcsRUFBRSxLQUFLLElBQUcsRUFBRSxHQUFFLEVBQUUsR0FBRSxFQUFFLEdBQUUsSUFBRSxJQUFHLEVBQUUsQ0FBQyxHQUFFLEtBQUcsSUFBRyxNQUFJLEVBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLE1BQU0sR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsT0FBTyxNQUFNLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxRQUFNLEVBQUUsT0FBSyxFQUFFLE9BQUssQ0FBQyxHQUFFLEVBQUUsR0FBRSxLQUFHLEdBQUUsRUFBRSxHQUFFLElBQUUsSUFBRyxFQUFFLENBQUMsR0FBRSxLQUFHLElBQUcsS0FBRyxFQUFFLE9BQU07TUFBQyxFQUFFLEdBQUUsR0FBRSxLQUFHLElBQUUsRUFBRSxLQUFLLE9BQU8sR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLE1BQU0sR0FBRSxLQUFHO01BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7T0FBQyxJQUFJLElBQUUsSUFBRSxHQUFFLElBQUUsRUFBRSxLQUFLLElBQUcsSUFBRSxNQUFJLEdBQUUsSUFBRSxNQUFJLElBQUUsS0FBSSxJQUFFLE1BQUksS0FBRztPQUFJLEVBQUUsSUFBRSxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLElBQUUsS0FBRztNQUFDO01BQUMsSUFBRyxFQUFFLEdBQUUsS0FBRyxJQUFFLEdBQUUsRUFBRSxHQUFFLElBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFLENBQUMsQ0FBQyxHQUFFLEtBQUcsR0FBRSxHQUFFO09BQUMsRUFBRSxHQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxLQUFHLEdBQUUsTUFBTSxHQUFFLEtBQUc7T0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLEtBQUssT0FBSyxLQUFHO09BQUksRUFBRSxHQUFFLEtBQUcsR0FBRSxFQUFFLEdBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxDQUFDLENBQUMsR0FBRSxLQUFHO01BQUM7S0FBQztLQUFDLElBQUksSUFBRTtLQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsRUFBRSxPQUFPLFFBQU8sS0FBSTtNQUFDLElBQUksSUFBRSxFQUFFLE9BQU87TUFBRyxNQUFJLEVBQUUsR0FBRSxHQUFFLEVBQUUsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLE1BQU0sR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEdBQUcsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsS0FBSyxLQUFLLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxFQUFFLEtBQUssTUFBTSxHQUFFLEVBQUUsR0FBRSxLQUFHLEdBQUUsRUFBRSxLQUFLLENBQUMsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxFQUFFLEVBQUUsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEdBQUcsR0FBRSxFQUFFLEtBQUcsS0FBRyxFQUFFLFNBQVEsRUFBRSxFQUFFLEtBQUcsRUFBRSxPQUFNLEVBQUUsR0FBRSxFQUFFLEdBQUUsRUFBRSxHQUFFLElBQUUsSUFBRyxFQUFFLENBQUMsR0FBRSxLQUFHO01BQUcsSUFBSSxJQUFFLEVBQUU7TUFBSyxFQUFFLEdBQUUsSUFBRyxJQUFFLEVBQUUsV0FBUyxLQUFHLElBQUUsSUFBRSxFQUFFO01BQUUsSUFBSSxJQUFFLEtBQUc7TUFBRSxFQUFFLEdBQUUsR0FBRSxLQUFHLElBQUUsU0FBTyxNQUFNLEdBQUUsS0FBRyxHQUFFLEtBQUcsTUFBSSxFQUFFLEdBQUUsR0FBRSxHQUFHLEdBQUUsS0FBRyxJQUFHLEVBQUUsSUFBSSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsS0FBRyxHQUFFLEVBQUUsR0FBRSxHQUFFLElBQUUsQ0FBQyxDQUFDLEdBQUUsS0FBRztLQUFDO0tBQUMsT0FBTyxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxNQUFNLEdBQUUsRUFBRSxHQUFFLEtBQUcsR0FBRSxFQUFFLEdBQUUsSUFBRSxHQUFFLENBQUMsQ0FBQyxHQUFFLEtBQUcsR0FBRSxFQUFFO0lBQU07SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsRUFBRSxPQUFPLFFBQU8sS0FBSTtNQUFDLElBQUksSUFBRSxFQUFFLE9BQU87TUFBRyxFQUFFLEtBQUs7TUFBTSxJQUFJLElBQUUsRUFBRSxLQUFLLFFBQU8sSUFBRSxJQUFJLFdBQVcsSUFBRSxFQUFFLE1BQUksQ0FBQztNQUFFLEVBQUUsT0FBSyxFQUFFLEVBQUUsS0FBSSxHQUFFLEVBQUUsS0FBSSxFQUFFLEtBQUksR0FBRSxHQUFFLENBQUM7S0FBQztJQUFDO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRTtLQUFDLEtBQUksSUFBSSxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRyxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxLQUFJLElBQUksSUFBRSxJQUFJLFdBQVcsRUFBRSxFQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFHLEdBQUUsS0FBRyxFQUFFLElBQUU7S0FBRyxJQUFJLElBQUUsT0FBSyxHQUFFLElBQUUsU0FBUyxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRTtNQUFDLEtBQUksSUFBSSxJQUFFLENBQUMsR0FBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSTtPQUFDLElBQUksR0FBRSxJQUFFLElBQUksV0FBVyxFQUFFLEVBQUUsR0FBRSxJQUFFLElBQUksWUFBWSxFQUFFLE1BQU0sR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxJQUFFLElBQUU7T0FBRSxJQUFHLEtBQUcsR0FBRTtRQUFDLEtBQUksSUFBSSxJQUFFLEtBQUcsS0FBRyxLQUFHLEtBQUcsS0FBRyxFQUFFLElBQUUsRUFBRSxDQUFDLFVBQVEsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO1NBQUMsS0FBSSxJQUFJLElBQUUsSUFBSSxXQUFXLEVBQUUsSUFBRSxJQUFFLEVBQUUsR0FBRSxJQUFFLElBQUksWUFBWSxFQUFFLElBQUUsSUFBRSxFQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLElBQUcsSUFBRSxJQUFHLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFLLEVBQUUsSUFBRSxJQUFFLElBQUUsTUFBSSxFQUFFLE9BQUssSUFBRSxNQUFJLElBQUUsSUFBRyxJQUFFLE1BQUksSUFBRSxJQUFHLElBQUUsTUFBSSxJQUFFLElBQUcsSUFBRSxNQUFJLElBQUU7U0FBSSxNQUFJLE1BQUksSUFBRSxJQUFFLElBQUUsSUFBRSxJQUFHLE1BQUksSUFBRSxDQUFDLEtBQUcsS0FBSSxJQUFFLENBQUMsS0FBRztTQUFLLElBQUksS0FBRyxJQUFFLElBQUUsTUFBSSxJQUFFLElBQUU7U0FBRyxJQUFFLE1BQUksSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFLElBQUU7UUFBRTtRQUFDLElBQUUsSUFBSSxXQUFXLEVBQUUsSUFBRSxJQUFFLEVBQUU7UUFBRSxLQUFHLE1BQUksRUFBRSxJQUFFLEVBQUUsQ0FBQyxVQUFRLElBQUcsSUFBRSxJQUFJLFdBQVcsSUFBRSxJQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxDQUFDLEdBQUUsQ0FBQyxHQUFFLE1BQUksSUFBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxDQUFDLEdBQUUsQ0FBQyxJQUFFLElBQUUsS0FBRyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7U0FBQyxHQUFFO1NBQUUsR0FBRTtTQUFFLE9BQU07U0FBRSxRQUFPO1FBQUMsQ0FBQyxJQUFFLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsQ0FBQyxHQUFFLENBQUMsR0FBRSxDQUFDO09BQUMsT0FBTSxJQUFFLEVBQUUsTUFBTSxDQUFDO09BQUUsRUFBRSxLQUFLO1FBQUMsTUFBSztTQUFDLEdBQUU7U0FBRSxHQUFFO1NBQUUsT0FBTTtTQUFFLFFBQU87UUFBQztRQUFFLEtBQUk7UUFBRSxPQUFNO1FBQUUsU0FBUTtPQUFDLENBQUM7TUFBQztNQUFDLElBQUcsR0FBTTtZQUFBLElBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxLQUFLLElBQUcsTUFBSSxJQUFFLEVBQUUsR0FBQSxDQUFJLE9BQU07UUFBQyxJQUFJLElBQUUsRUFBRSxNQUFLLElBQUUsRUFBRSxJQUFFLEVBQUUsQ0FBQyxNQUFLLElBQUUsS0FBSyxJQUFJLEVBQUUsR0FBRSxFQUFFLENBQUMsR0FBRSxJQUFFLEtBQUssSUFBSSxFQUFFLEdBQUUsRUFBRSxDQUFDLEdBQUUsSUFBRTtTQUFDLEdBQUU7U0FBRSxHQUFFO1NBQUUsT0FBTSxLQUFLLElBQUksRUFBRSxJQUFFLEVBQUUsT0FBTSxFQUFFLElBQUUsRUFBRSxLQUFLLElBQUU7U0FBRSxRQUFPLEtBQUssSUFBSSxFQUFFLElBQUUsRUFBRSxRQUFPLEVBQUUsSUFBRSxFQUFFLE1BQU0sSUFBRTtRQUFDO1FBQUUsRUFBRSxJQUFFLEVBQUUsQ0FBQyxVQUFRLEdBQUUsSUFBRSxLQUFHLEtBQUcsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLElBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUM7T0FBQzs7TUFBRSxJQUFHLEtBQUcsRUFBRSxRQUFPLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSTtPQUFDLElBQUk7T0FBRSxDQUFDLElBQUUsRUFBRSxHQUFBLENBQUksS0FBSyxRQUFNLEVBQUUsS0FBSztNQUFNO01BQUMsT0FBTztLQUFDLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxJQUFFLENBQUMsR0FBRSxJQUFFLENBQUMsR0FBRSxJQUFFLENBQUM7S0FBRSxJQUFHLEtBQUcsR0FBRTtNQUFDLElBQUksSUFBRSxDQUFDO01BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFNO01BQUUsSUFBeVMsSUFBRSxFQUFyUyxTQUFTLEdBQUU7T0FBQyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxLQUFJLEtBQUcsRUFBRSxFQUFFLENBQUM7T0FBVyxJQUFJLElBQUUsSUFBSSxXQUFXLENBQUMsR0FBRSxJQUFFO09BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSTtRQUFDLEtBQUksSUFBSSxJQUFFLElBQUksV0FBVyxFQUFFLEVBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUcsR0FBRTtTQUFDLElBQUksSUFBRSxFQUFFLElBQUcsSUFBRSxFQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFO1NBQUcsS0FBRyxNQUFJLElBQUUsSUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLEtBQUcsR0FBRSxFQUFFLElBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxJQUFFLElBQUUsS0FBRyxHQUFFLEVBQUUsSUFBRSxJQUFFLEtBQUc7UUFBQztRQUFDLEtBQUc7T0FBQztPQUFDLE9BQU8sRUFBRTtNQUFNLEVBQUUsQ0FBTyxHQUFFLENBQUM7TUFBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsS0FBSyxRQUFPLEtBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJO01BQUUsSUFBSSxJQUFFO01BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSTtPQUFDLElBQUksS0FBRyxJQUFFLEVBQUUsR0FBQSxDQUFJLElBQUksUUFBTyxJQUFFLElBQUksV0FBVyxFQUFFLEtBQUssUUFBTyxLQUFHLEdBQUUsS0FBRyxDQUFDO09BQUUsRUFBRSxLQUFLLENBQUM7T0FBRSxJQUFJLElBQUUsSUFBSSxXQUFXLEVBQUUsTUFBSyxHQUFFLENBQUM7T0FBRSxLQUFHLEVBQUUsRUFBRSxLQUFJLEVBQUUsS0FBSyxPQUFNLEVBQUUsS0FBSyxRQUFPLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFFLEtBQUc7TUFBQztLQUFDLE9BQU0sS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSTtNQUFDLElBQUksSUFBRSxFQUFFLElBQUcsSUFBRSxJQUFJLFlBQVksRUFBRSxJQUFJLE1BQU0sR0FBRSxJQUFFLEVBQUUsS0FBSztNQUFNLElBQUUsRUFBRSxRQUFPLElBQUUsSUFBSSxXQUFXLENBQUM7TUFBRSxFQUFFLEtBQUssQ0FBQztNQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO09BQUMsSUFBSSxJQUFFLEVBQUU7T0FBRyxJQUFHLEtBQUcsS0FBRyxLQUFHLEVBQUUsSUFBRSxJQUFHLEVBQUUsS0FBRyxFQUFFLElBQUU7WUFBUSxJQUFHLElBQUUsS0FBRyxLQUFHLEVBQUUsSUFBRSxJQUFHLEVBQUUsS0FBRyxFQUFFLElBQUU7WUFBTztRQUFDLElBQUksSUFBRSxFQUFFO1FBQUcsSUFBRyxRQUFNLE1BQUksRUFBRSxLQUFHLElBQUUsRUFBRSxRQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUUsRUFBRSxVQUFRLE1BQUs7UUFBTSxFQUFFLEtBQUc7T0FBQztNQUFDO0tBQUM7S0FBQyxJQUFJLElBQUUsRUFBRTtLQUFPLEtBQUcsT0FBSyxLQUFHLE1BQUksSUFBRSxLQUFHLElBQUUsSUFBRSxLQUFHLElBQUUsSUFBRSxLQUFHLEtBQUcsSUFBRSxHQUFFLElBQUUsS0FBSyxJQUFJLEdBQUUsQ0FBQztLQUFHLEtBQUksSUFBRSxHQUFFLElBQUUsRUFBRSxRQUFPLEtBQUk7TUFBQyxDQUFDLElBQUUsRUFBRSxHQUFBLENBQUksS0FBSyxHQUFFLEVBQUUsS0FBSztNQUFFLElBQUUsRUFBRSxLQUFLO01BQU0sSUFBSSxJQUFFLEVBQUUsS0FBSyxRQUFPLElBQUUsRUFBRTtNQUFJLElBQUksWUFBWSxFQUFFLE1BQU07TUFBRSxJQUFJLElBQUUsSUFBRSxHQUFFLElBQUU7TUFBRSxJQUFHLEtBQUcsT0FBSyxLQUFHLEdBQUU7T0FBQyxJQUFFLEtBQUssS0FBSyxJQUFFLElBQUUsQ0FBQztPQUFFLEtBQUksSUFBSSxJQUFFLElBQUksV0FBVyxJQUFFLENBQUMsR0FBRSxJQUFFLEVBQUUsSUFBRyxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUk7UUFBQyxJQUFFLElBQUU7UUFBRSxJQUFJLElBQUUsSUFBRTtRQUFFLElBQUcsS0FBRyxHQUFFLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO2FBQVEsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxLQUFHLEtBQUcsT0FBSyxFQUFFLElBQUUsTUFBSSxJQUFFLEtBQUcsSUFBRTthQUFRLElBQUcsS0FBRyxHQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsS0FBRyxLQUFHLE9BQUssRUFBRSxJQUFFLE1BQUksSUFBRSxLQUFHLElBQUU7YUFBUSxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEtBQUcsS0FBRyxPQUFLLEVBQUUsSUFBRSxNQUFJLElBQUUsS0FBRyxJQUFFO09BQUU7T0FBQyxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUU7TUFBQyxPQUFNLElBQUcsS0FBRyxLQUFHLEtBQUcsRUFBRSxRQUFPO09BQUMsSUFBRSxJQUFJLFdBQVcsSUFBRSxJQUFFLENBQUM7T0FBRSxJQUFJLElBQUUsSUFBRTtPQUFFLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO1FBQUMsSUFBSSxJQUFFLElBQUUsR0FBRSxJQUFFLElBQUU7UUFBRSxFQUFFLEtBQUcsRUFBRSxJQUFHLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRSxJQUFHLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRTtPQUFFO09BQUMsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxJQUFFO01BQUM7TUFBQyxFQUFFLE1BQUksR0FBRSxFQUFFLE1BQUksR0FBRSxFQUFFLE1BQUk7S0FBQztLQUFDLE9BQU07TUFBQyxPQUFNO01BQUUsT0FBTTtNQUFFLE1BQUs7TUFBRSxRQUFPO0tBQUM7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsS0FBSSxJQUFJLElBQUUsWUFBVyxJQUFFLGFBQVksSUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFFLEVBQUUsR0FBRSxJQUFFLElBQUksRUFBRSxFQUFFLElBQUUsRUFBRSxHQUFFLElBQUUsSUFBRSxJQUFFLEVBQUUsU0FBTyxJQUFJLEVBQUUsRUFBRSxJQUFFLEVBQUUsSUFBRSxNQUFLLElBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFFLElBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxJQUFHLElBQUUsSUFBRyxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsRUFBRSxPQUFNLEtBQUk7TUFBQyxJQUFJLElBQUUsRUFBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLElBQUUsR0FBRSxJQUFFLElBQUUsSUFBRSxHQUFFLElBQUUsRUFBRTtNQUFHLEtBQUcsS0FBRyxLQUFHLEVBQUUsSUFBRSxFQUFFLENBQUMsV0FBUyxFQUFFLE1BQUksTUFBSSxRQUFNLEtBQUcsS0FBRyxFQUFFLElBQUUsSUFBRSxRQUFNLElBQUUsTUFBSSxJQUFFLElBQUcsSUFBRSxNQUFJLElBQUUsSUFBRyxJQUFFLE1BQUksSUFBRSxJQUFHLElBQUUsTUFBSSxJQUFFO0tBQUc7S0FBQyxNQUFJLE1BQUksSUFBRSxJQUFFLElBQUUsSUFBRSxJQUFHLE1BQUksSUFBRSxDQUFDLEtBQUcsS0FBSSxJQUFFLENBQUMsS0FBRyxNQUFLLElBQUU7TUFBQyxHQUFFO01BQUUsR0FBRTtNQUFFLE9BQU0sSUFBRSxJQUFFO01BQUUsUUFBTyxJQUFFLElBQUU7S0FBQztLQUFFLElBQUksSUFBRSxFQUFFO0tBQUcsRUFBRSxPQUFLLEdBQUUsRUFBRSxRQUFNLEdBQUUsRUFBRSxNQUFJLElBQUksV0FBVyxFQUFFLFFBQU0sRUFBRSxTQUFPLENBQUMsR0FBRSxLQUFHLEVBQUUsSUFBRSxFQUFFLENBQUMsV0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEVBQUUsS0FBSSxFQUFFLE9BQU0sRUFBRSxRQUFPLENBQUMsRUFBRSxHQUFFLENBQUMsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLEVBQUUsS0FBSSxDQUFDLEtBQUcsRUFBRSxHQUFFLEdBQUUsR0FBRSxFQUFFLEtBQUksRUFBRSxPQUFNLEVBQUUsUUFBTyxDQUFDLEVBQUUsR0FBRSxDQUFDLEVBQUUsR0FBRSxDQUFDO0lBQUM7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEVBQUUsT0FBTSxFQUFFLFFBQU8sQ0FBQyxFQUFFLEdBQUUsQ0FBQyxFQUFFLEdBQUUsQ0FBQztJQUFDO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxJQUFJLEdBQUUsSUFBRSxDQUFDLEdBQUUsSUFBRTtNQUFDO01BQUU7TUFBRTtNQUFFO01BQUU7S0FBQztLQUFFLE1BQUksSUFBRSxJQUFFLENBQUMsQ0FBQyxLQUFHLElBQUUsSUFBRSxPQUFLLEtBQUcsT0FBSyxJQUFFLENBQUMsQ0FBQyxJQUFHLE1BQUksSUFBRSxFQUFDLE9BQU0sRUFBQztLQUFHLEtBQUksSUFBSSxJQUFFLEVBQUUsU0FBTyxPQUFLLFFBQU0sT0FBTyxPQUFLLE9BQU8sT0FBSyxHQUFFLElBQUUsR0FBRSxJQUFFLEVBQUUsUUFBTyxLQUFJO01BQUMsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxFQUFFLEVBQUU7TUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEdBQUUsQ0FBQyxDQUFDO0tBQUM7S0FBQyxJQUFJLEdBQUUsSUFBRTtLQUFJLEtBQUksSUFBRSxHQUFFLElBQUUsRUFBRSxRQUFPLEtBQUksRUFBRSxFQUFFLENBQUMsU0FBTyxNQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsRUFBRSxDQUFDO0tBQVEsT0FBTyxFQUFFO0lBQUU7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxJQUFJLElBQUUsSUFBRSxHQUFFLElBQUUsSUFBRTtLQUFFLElBQUcsRUFBRSxLQUFHLEdBQUUsS0FBSSxLQUFHLEdBQUUsSUFBRyxJQUFFLEtBQUksS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUU7VUFBUSxFQUFFLElBQUksSUFBSSxXQUFXLEVBQUUsUUFBTyxHQUFFLENBQUMsR0FBRSxDQUFDO1VBQU8sSUFBRyxLQUFHLEdBQUU7TUFBQyxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUU7TUFBRyxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsSUFBRSxLQUFHLE1BQUk7S0FBRyxPQUFNLElBQUcsS0FBRyxHQUFFO01BQUMsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO01BQUcsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFO01BQUcsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLE1BQUksRUFBRSxJQUFFLElBQUUsTUFBSSxLQUFHLE1BQUk7TUFBSSxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsS0FBRyxFQUFFLEVBQUUsSUFBRSxJQUFFLElBQUcsR0FBRSxDQUFDLElBQUUsTUFBSTtLQUFHLE9BQUs7TUFBQyxJQUFHLEtBQUcsR0FBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsS0FBRyxNQUFJLEVBQUUsSUFBRSxJQUFFLEtBQUc7TUFBSSxJQUFHLEtBQUcsR0FBRTtPQUFDLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRSxLQUFHLE9BQUssRUFBRSxJQUFFLElBQUUsTUFBSSxLQUFHO09BQUksS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFFLEtBQUcsRUFBRSxJQUFFLEtBQUcsT0FBSyxFQUFFLElBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRSxJQUFFLE1BQUksS0FBRztNQUFHO01BQUMsSUFBRyxLQUFHLEdBQUU7T0FBQyxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLElBQUUsS0FBRyxFQUFFLElBQUUsS0FBRyxNQUFJLEVBQUUsR0FBRSxFQUFFLElBQUUsSUFBRSxJQUFHLENBQUMsSUFBRTtPQUFJLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsSUFBRSxLQUFHLEVBQUUsSUFBRSxLQUFHLE1BQUksRUFBRSxFQUFFLElBQUUsSUFBRSxJQUFHLEVBQUUsSUFBRSxJQUFFLElBQUcsRUFBRSxJQUFFLElBQUUsSUFBRSxFQUFFLElBQUU7TUFBRztLQUFDO0lBQUM7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxLQUFJLElBQUksSUFBRSxJQUFJLFdBQVcsQ0FBQyxHQUFFLElBQUUsRUFBRSxNQUFNLENBQUMsR0FBRSxJQUFFLElBQUksWUFBWSxFQUFFLE1BQU0sR0FBRSxJQUFFLEVBQUUsR0FBRSxDQUFDLEdBQUUsSUFBRSxFQUFFLElBQUcsSUFBRSxFQUFFLElBQUcsSUFBRSxFQUFFLFFBQU8sSUFBRSxJQUFJLFlBQVksQ0FBQyxHQUFFLElBQUUsSUFBSSxXQUFXLEVBQUUsTUFBTSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxFQUFFLEtBQUcsRUFBRSxFQUFFLENBQUMsSUFBSTtLQUFLLElBQUksR0FBRSxJQUFFLEVBQUUsUUFBTyxJQUFFLElBQUksV0FBVyxLQUFHLENBQUM7S0FBRSxJQUFHLEtBQUcsSUFBRyxFQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLEdBQUUsQ0FBQztVQUFPLElBQUcsRUFBRSxTQUFPLE1BQUssS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUcsR0FBRyxJQUFFLEVBQUUsR0FBRSxJQUFFLEVBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFLElBQUksR0FBRSxFQUFFLEtBQUcsS0FBRyxFQUFFLEtBQUksRUFBRSxLQUFHLEtBQUcsRUFBRSxJQUFJO1VBQVUsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUcsR0FBRTtNQUFDLElBQUksSUFBRSxFQUFFLE1BQUksSUFBRSxNQUFLLElBQUUsRUFBRSxJQUFFLE1BQUksSUFBRSxNQUFLLElBQUUsRUFBRSxJQUFFLE1BQUksSUFBRSxNQUFLLElBQUUsRUFBRSxJQUFFLE1BQUksSUFBRTtNQUFLLEtBQUksSUFBRSxHQUFFLEVBQUUsT0FBTSxJQUFFLEVBQUUsRUFBRSxLQUFJLEdBQUUsR0FBRSxHQUFFLENBQUMsS0FBRyxJQUFFLEVBQUUsT0FBSyxFQUFFO01BQU0sRUFBRSxLQUFHLEtBQUcsRUFBRSxLQUFJLEVBQUUsS0FBRyxLQUFHLEVBQUUsSUFBSTtLQUFJO0tBQUMsSUFBRyxLQUFHLEVBQUUsU0FBTyxJQUFFLEtBQUk7TUFBQyxJQUFJLElBQUU7TUFBSSxLQUFJLElBQUUsR0FBRSxJQUFFLElBQUcsS0FBSTtPQUFDLElBQUksSUFBRSxFQUFFLEdBQUUsR0FBRSxDQUFDO09BQUUsSUFBRyxJQUFFLElBQUUsTUFBSztPQUFNLElBQUU7TUFBQztNQUFDLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBSyxFQUFFO01BQUcsRUFBRSxHQUFFLEdBQUUsQ0FBQztLQUFDO0tBQUMsT0FBTTtNQUFDLE1BQUssRUFBRTtNQUFPLE1BQUs7TUFBRSxNQUFLO0tBQUM7SUFBQztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRTtLQUFDLEtBQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxFQUFFLEtBQUcsRUFBRSxFQUFFO0lBQUc7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxPQUFPLFNBQVMsR0FBRSxHQUFFLEdBQUU7TUFBQyxLQUFJLElBQUksSUFBRSxFQUFFLFdBQVMsR0FBRSxJQUFFLElBQUksWUFBWSxJQUFFLENBQUMsR0FBRSxJQUFFLElBQUksWUFBWSxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUUsRUFBRSxRQUFPLEtBQUcsR0FBRTtPQUFDLElBQUksSUFBRSxFQUFFLE1BQUksSUFBRyxJQUFFLElBQUU7T0FBRSxFQUFFLEVBQUUsSUFBRyxFQUFFLE1BQUksRUFBRSxJQUFHLEVBQUUsSUFBRSxNQUFJLEVBQUUsSUFBRSxJQUFHLEVBQUUsSUFBRSxNQUFJLEVBQUUsSUFBRSxJQUFHLEVBQUUsSUFBRSxNQUFJLEVBQUUsSUFBRTtNQUFFO01BQUMsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxFQUFFLEtBQUcsS0FBSyxNQUFNLEVBQUUsS0FBRyxFQUFFLE1BQUksRUFBRTtLQUFDLEVBQUUsR0FBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsR0FBRSxDQUFDO0lBQUM7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsRUFBRSxXQUFTLEdBQUUsSUFBRSxDQUFDLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO01BQUMsS0FBSSxJQUFJLElBQUUsRUFBRSxJQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFLElBQUcsSUFBRSxFQUFFLElBQUUsSUFBRyxJQUFFLEdBQUUsSUFBRSxLQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBSSxJQUFHLEtBQUcsR0FBRTtPQUFDLElBQUksSUFBRSxJQUFFO09BQUUsQ0FBQyxLQUFHLElBQUUsSUFBRSxFQUFFLE1BQUksS0FBRyxJQUFFLElBQUUsRUFBRSxJQUFFLE1BQUksS0FBRyxJQUFFLElBQUUsRUFBRSxJQUFFLE1BQUksS0FBRyxJQUFFLElBQUUsRUFBRSxJQUFFLE1BQUksS0FBRyxNQUFJLElBQUUsR0FBRSxJQUFFO01BQUU7TUFBQyxFQUFFLEtBQUcsS0FBRyxLQUFLLEtBQUssQ0FBQyxHQUFFLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRTtLQUFFO0tBQUMsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBRyxHQUFFO01BQUMsSUFBSSxHQUFFLEdBQUUsR0FBRSxHQUFFO01BQUUsSUFBRSxFQUFFLElBQUcsSUFBRSxFQUFFLElBQUUsSUFBRyxJQUFFLEVBQUUsSUFBRSxJQUFHLElBQUUsRUFBRSxJQUFFO01BQUcsS0FBSSxLQUFHLElBQUUsSUFBRSxFQUFFLElBQUUsS0FBRyxJQUFFLEVBQUUsTUFBSSxRQUFNLEtBQUcsSUFBRSxJQUFFLEVBQUUsSUFBRSxNQUFJLEtBQUcsSUFBRSxJQUFFLEVBQUUsSUFBRSxNQUFJLEtBQUcsSUFBRSxJQUFFLEVBQUUsSUFBRSxNQUFJLEtBQUcsRUFBRSxJQUFHLEtBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFJO09BQUMsSUFBSTtPQUFFLEtBQUksS0FBRyxJQUFFLElBQUUsRUFBRSxJQUFFLElBQUUsTUFBSSxLQUFHLElBQUUsSUFBRSxFQUFFLElBQUUsTUFBSSxLQUFHLElBQUUsSUFBRSxFQUFFLElBQUUsTUFBSSxLQUFHLElBQUUsSUFBRSxFQUFFLElBQUUsTUFBSSxLQUFHLE1BQUksSUFBRSxJQUFHLElBQUUsS0FBRyxFQUFFLEtBQUk7TUFBSztNQUFDLEVBQUUsTUFBSSxLQUFHLEdBQUUsS0FBRztLQUFDO0tBQUMsT0FBTyxLQUFHLEVBQUUsV0FBUztJQUFFO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsTUFBWTtLQUFNLElBQUksSUFBRSxJQUFJLFlBQVksRUFBRSxNQUFNLEdBQUUsSUFBRTtNQUFDLElBQUc7TUFBRSxJQUFHLEVBQUU7TUFBTyxLQUFJO01BQUssS0FBSTtNQUFLLE1BQUs7TUFBRSxNQUFLO01BQUssT0FBTTtLQUFJO0tBQUUsRUFBRSxNQUFJLEVBQUUsR0FBRSxFQUFFLElBQUcsRUFBRSxFQUFFLEdBQUUsRUFBRSxNQUFJLEVBQUUsRUFBRSxHQUFHO0tBQUUsS0FBSSxJQUFJLElBQUUsQ0FBQyxDQUFDLEdBQUUsRUFBRSxTQUFPLElBQUc7TUFBQyxLQUFJLElBQUksSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUUsTUFBSSxJQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRSxJQUFFO01BQUcsSUFBRyxJQUFFLEdBQUU7TUFBTSxJQUFJLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxHQUFFLEdBQUUsRUFBRSxJQUFHLEVBQUUsSUFBRyxFQUFFLElBQUksR0FBRSxFQUFFLElBQUksTUFBTTtNQUFFLElBQUcsRUFBRSxNQUFJLEtBQUcsRUFBRSxNQUFJLEdBQUUsRUFBRSxJQUFJLElBQUU7V0FBTTtPQUFDLElBQUksSUFBRTtRQUFDLElBQUcsRUFBRTtRQUFHLElBQUc7UUFBRSxLQUFJO1FBQUssS0FBSTtRQUFLLE1BQUs7UUFBRSxNQUFLO1FBQUssT0FBTTtPQUFJO09BQUUsRUFBRSxNQUFJLEVBQUUsR0FBRSxFQUFFLElBQUcsRUFBRSxFQUFFLEdBQUUsRUFBRSxNQUFJLEVBQUUsRUFBRSxHQUFHO09BQUUsSUFBSSxJQUFFO1FBQUMsSUFBRztRQUFFLElBQUcsRUFBRTtRQUFHLEtBQUk7UUFBSyxLQUFJO1FBQUssTUFBSztRQUFFLE1BQUs7UUFBSyxPQUFNO09BQUk7T0FBRSxFQUFFLE1BQUk7UUFBQyxHQUFFLENBQUM7UUFBRSxHQUFFLENBQUM7UUFBRSxHQUFFLEVBQUUsSUFBSSxJQUFFLEVBQUUsSUFBSTtPQUFDO09BQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxJQUFHLEtBQUksRUFBRSxJQUFJLEVBQUUsS0FBRyxFQUFFLElBQUksRUFBRSxLQUFHLEVBQUUsSUFBSSxFQUFFO09BQUcsS0FBSSxJQUFFLEdBQUUsSUFBRSxHQUFFLEtBQUksRUFBRSxJQUFJLEVBQUUsS0FBRyxFQUFFLElBQUksRUFBRSxLQUFHLEVBQUUsSUFBSSxFQUFFO09BQUcsRUFBRSxNQUFJLEVBQUUsRUFBRSxHQUFHLEdBQUUsRUFBRSxPQUFLLEdBQUUsRUFBRSxRQUFNLEdBQUUsRUFBRSxLQUFHLEdBQUUsRUFBRSxLQUFLLENBQUM7TUFBQztLQUFDO0tBQUMsRUFBRSxNQUFNLFNBQVMsR0FBRSxHQUFFO01BQUMsT0FBTyxFQUFFLElBQUksSUFBRSxFQUFFLElBQUk7S0FBQyxFQUFFO0tBQUUsS0FBSSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sS0FBSSxFQUFFLEVBQUUsQ0FBQyxNQUFJO0tBQUUsT0FBTSxDQUFDLEdBQUUsQ0FBQztJQUFDO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRTtLQUFDLElBQUcsUUFBTSxFQUFFLE1BQUssT0FBTyxFQUFFLE9BQUssU0FBUyxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7TUFBQyxJQUFJLElBQUUsSUFBRSxFQUFFLElBQUcsSUFBRSxJQUFFLEVBQUUsSUFBRyxJQUFFLElBQUUsRUFBRSxJQUFHLElBQUUsSUFBRSxFQUFFO01BQUcsT0FBTyxJQUFFLElBQUUsSUFBRSxJQUFFLElBQUUsSUFBRSxJQUFFO0tBQUMsRUFBRSxFQUFFLElBQUksR0FBRSxHQUFFLEdBQUUsR0FBRSxDQUFDLEdBQUU7S0FBRSxJQUFJLElBQUUsRUFBRSxFQUFFLEtBQUksR0FBRSxHQUFFLEdBQUUsQ0FBQyxHQUFFLElBQUUsRUFBRSxNQUFLLElBQUUsRUFBRTtLQUFNLElBQUUsTUFBSSxJQUFFLEVBQUUsT0FBTSxJQUFFLEVBQUU7S0FBTSxJQUFJLElBQUUsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUM7S0FBRSxJQUFHLEVBQUUsUUFBTSxJQUFFLEdBQUUsT0FBTztLQUFFLElBQUksSUFBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsQ0FBQztLQUFFLE9BQU8sRUFBRSxPQUFLLEVBQUUsT0FBSyxJQUFFO0lBQUM7SUFBQyxTQUFTLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsSUFBSSxJQUFFLEVBQUU7S0FBRSxPQUFPLEVBQUUsS0FBRyxJQUFFLEVBQUUsS0FBRyxJQUFFLEVBQUUsS0FBRyxJQUFFLEVBQUUsS0FBRyxJQUFFLEVBQUU7SUFBRztJQUFDLFNBQVMsRUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRTtLQUFDLEtBQUksS0FBRyxHQUFFLElBQUUsSUFBRztNQUFDLE9BQUssRUFBRSxHQUFFLEdBQUUsQ0FBQyxLQUFHLElBQUcsS0FBRztNQUFFLE9BQUssRUFBRSxHQUFFLEdBQUUsQ0FBQyxJQUFFLElBQUcsS0FBRztNQUFFLElBQUcsS0FBRyxHQUFFO01BQU0sSUFBSSxJQUFFLEVBQUUsS0FBRztNQUFHLEVBQUUsS0FBRyxLQUFHLEVBQUUsS0FBRyxJQUFHLEVBQUUsS0FBRyxLQUFHLEdBQUUsS0FBRyxHQUFFLEtBQUc7S0FBQztLQUFDLE9BQUssRUFBRSxHQUFFLEdBQUUsQ0FBQyxJQUFFLElBQUcsS0FBRztLQUFFLE9BQU8sSUFBRTtJQUFDO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsT0FBTyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsSUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFLElBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxJQUFFLEtBQUcsRUFBRTtJQUFFO0lBQUMsU0FBUyxFQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsS0FBSSxJQUFJLElBQUU7TUFBQztNQUFFO01BQUU7TUFBRTtNQUFFO01BQUU7TUFBRTtNQUFFO01BQUU7TUFBRTtNQUFFO01BQUU7TUFBRTtNQUFFO01BQUU7TUFBRTtLQUFDLEdBQUUsSUFBRTtNQUFDO01BQUU7TUFBRTtNQUFFO0tBQUMsR0FBRSxJQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsS0FBRyxHQUFFO01BQUMsSUFBSSxJQUFFLEVBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFLE1BQUssSUFBRSxFQUFFLElBQUUsTUFBSSxJQUFFO01BQUssRUFBRSxNQUFJLEdBQUUsRUFBRSxNQUFJLEdBQUUsRUFBRSxNQUFJLEdBQUUsRUFBRSxNQUFJLEdBQUUsRUFBRSxNQUFJLElBQUUsR0FBRSxFQUFFLE1BQUksSUFBRSxHQUFFLEVBQUUsTUFBSSxJQUFFLEdBQUUsRUFBRSxNQUFJLElBQUUsR0FBRSxFQUFFLE1BQUksSUFBRSxHQUFFLEVBQUUsTUFBSSxJQUFFLEdBQUUsRUFBRSxNQUFJLElBQUUsR0FBRSxFQUFFLE9BQUssSUFBRSxHQUFFLEVBQUUsT0FBSyxJQUFFLEdBQUUsRUFBRSxPQUFLLElBQUU7S0FBQztLQUFDLE9BQU8sRUFBRSxLQUFHLEVBQUUsSUFBRyxFQUFFLEtBQUcsRUFBRSxJQUFHLEVBQUUsS0FBRyxFQUFFLElBQUcsRUFBRSxNQUFJLEVBQUUsSUFBRyxFQUFFLE1BQUksRUFBRSxJQUFHLEVBQUUsTUFBSSxFQUFFLEtBQUk7TUFBQyxHQUFFO01BQUUsR0FBRTtNQUFFLEdBQUU7S0FBQztJQUFDO0lBQUMsU0FBUyxFQUFFLEdBQUU7S0FBQyxJQUFJLElBQUUsRUFBRSxHQUFFLElBQUUsRUFBRSxHQUFFLElBQUUsRUFBRSxHQUFFLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsRUFBRSxJQUFHLElBQUUsS0FBRyxJQUFFLElBQUUsSUFBRSxHQUFFLElBQUU7TUFBQyxFQUFFLEtBQUcsSUFBRSxJQUFFO01BQUUsRUFBRSxLQUFHLElBQUUsSUFBRTtNQUFFLEVBQUUsS0FBRyxJQUFFLElBQUU7TUFBRSxFQUFFLEtBQUcsSUFBRSxJQUFFO01BQUUsRUFBRSxLQUFHLElBQUUsSUFBRTtNQUFFLEVBQUUsS0FBRyxJQUFFLElBQUU7TUFBRSxFQUFFLEtBQUcsSUFBRSxJQUFFO01BQUUsRUFBRSxLQUFHLElBQUUsSUFBRTtNQUFFLEVBQUUsS0FBRyxJQUFFLElBQUU7TUFBRSxFQUFFLEtBQUcsSUFBRSxJQUFFO01BQUUsRUFBRSxNQUFJLElBQUUsSUFBRTtNQUFFLEVBQUUsTUFBSSxJQUFFLElBQUU7TUFBRSxFQUFFLE1BQUksSUFBRSxJQUFFO01BQUUsRUFBRSxNQUFJLElBQUUsSUFBRTtNQUFFLEVBQUUsTUFBSSxJQUFFLElBQUU7TUFBRSxFQUFFLE1BQUksSUFBRSxJQUFFO0tBQUMsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUU7TUFBQyxLQUFLLE9BQU87TUFBRSxLQUFLLE9BQU87TUFBRSxLQUFLLE9BQU87TUFBRSxLQUFLLE9BQU87S0FBQyxHQUFFLElBQUUsR0FBRSxJQUFFO0tBQUUsSUFBRyxLQUFHLEdBQUUsS0FBSSxJQUFJLElBQUUsR0FBRSxJQUFFLE9BQUssSUFBRSxFQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsSUFBRSxLQUFLLEtBQUssRUFBRSxJQUFJLEdBQUUsQ0FBQyxDQUFDLEdBQUUsSUFBRSxFQUFFLElBQUksSUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEtBQUcsS0FBRyxLQUFLLElBQUksSUFBRSxDQUFDLElBQUUsUUFBTyxLQUFJLElBQUU7S0FBRSxJQUFJLElBQUU7TUFBQyxJQUFFO01BQUUsSUFBRTtNQUFFLElBQUU7TUFBRSxJQUFFO0tBQUM7S0FBRSxPQUFNO01BQUMsS0FBSTtNQUFFLEdBQUU7TUFBRSxHQUFFO01BQUUsR0FBRTtNQUFFLFFBQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxLQUFJLENBQUMsR0FBRSxDQUFDO01BQUUsS0FBSSxFQUFFLElBQUksR0FBRSxDQUFDO01BQUUsT0FBTSxLQUFLLE1BQU0sTUFBSSxFQUFFLEVBQUUsS0FBRyxLQUFHLEtBQUssTUFBTSxNQUFJLEVBQUUsRUFBRSxLQUFHLEtBQUcsS0FBSyxNQUFNLE1BQUksRUFBRSxFQUFFLEtBQUcsSUFBRSxLQUFLLE1BQU0sTUFBSSxFQUFFLEVBQUUsT0FBSztLQUFDO0lBQUM7SUFBQyxJQUFJLElBQUU7S0FBQyxTQUFRLFNBQVMsR0FBRSxHQUFFO01BQUMsT0FBTTtPQUFDLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFO09BQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUU7T0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxNQUFJLEVBQUUsS0FBRyxFQUFFLE1BQUksRUFBRTtPQUFHLEVBQUUsTUFBSSxFQUFFLEtBQUcsRUFBRSxNQUFJLEVBQUUsS0FBRyxFQUFFLE1BQUksRUFBRSxLQUFHLEVBQUUsTUFBSSxFQUFFO01BQUU7S0FBQztLQUFFLEtBQUksU0FBUyxHQUFFLEdBQUU7TUFBQyxPQUFPLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFLEtBQUcsRUFBRSxLQUFHLEVBQUUsS0FBRyxFQUFFO0tBQUU7S0FBRSxLQUFJLFNBQVMsR0FBRSxHQUFFO01BQUMsT0FBTTtPQUFDLElBQUUsRUFBRTtPQUFHLElBQUUsRUFBRTtPQUFHLElBQUUsRUFBRTtPQUFHLElBQUUsRUFBRTtNQUFFO0tBQUM7SUFBQztJQUFFLEVBQUUsU0FBTyxTQUFTLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7S0FBQyxNQUFZLEdBQUcsTUFBWSxDQUFDO0tBQUcsSUFBSSxJQUFFLEVBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRTtNQUFDLENBQUM7TUFBRSxDQUFDO01BQUUsQ0FBQztNQUFFO01BQUU7TUFBRSxDQUFDO0tBQUMsQ0FBQztLQUFFLE9BQU8sRUFBRSxHQUFFLEVBQUUsR0FBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsQ0FBQztJQUFDLEdBQUUsRUFBRSxXQUFTLFNBQVMsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0tBQUMsS0FBSSxJQUFJLElBQUU7TUFBQyxPQUFNLEtBQUcsS0FBRyxJQUFFLElBQUUsTUFBSSxLQUFHLElBQUUsSUFBRTtNQUFHLE9BQU07TUFBRSxRQUFPLENBQUM7S0FBQyxHQUFFLEtBQUcsSUFBRSxLQUFHLEdBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsRUFBRSxRQUFPLEtBQUksRUFBRSxPQUFPLEtBQUs7TUFBQyxNQUFLO09BQUMsR0FBRTtPQUFFLEdBQUU7T0FBRSxPQUFNO09BQUUsUUFBTztNQUFDO01BQUUsS0FBSSxJQUFJLFdBQVcsRUFBRSxFQUFFO01BQUUsT0FBTTtNQUFFLFNBQVE7TUFBRSxLQUFJLEtBQUssS0FBSyxJQUFFLENBQUM7TUFBRSxLQUFJLEtBQUssS0FBSyxJQUFFLENBQUM7S0FBQyxDQUFDO0tBQUUsT0FBTyxF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