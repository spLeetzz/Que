import { describe, it } from "node:test";
import assert from "node:assert";
import { formatAnswerValue } from "./analytics.service";

describe("formatAnswerValue", () => {
	describe("Edge Cases - Null/Undefined/Empty Values", () => {
		it("should return empty string for undefined value", () => {
			const result = formatAnswerValue(undefined, "text");
			assert.strictEqual(result, "");
		});

		it("should return empty string for null value", () => {
			const result = formatAnswerValue(null, "text");
			assert.strictEqual(result, "");
		});

		it("should return empty string for empty array", () => {
			const result = formatAnswerValue([], "text");
			assert.strictEqual(result, "");
		});

		it("should return empty string for null question type", () => {
			const result = formatAnswerValue(["some value"], null);
			assert.strictEqual(result, "");
		});

		it("should return empty string for array with empty string", () => {
			const result = formatAnswerValue([""], "text");
			assert.strictEqual(result, "");
		});

		it("should return empty string for array with whitespace only", () => {
			const result = formatAnswerValue(["   "], "text");
			assert.strictEqual(result, "");
		});
	});

	describe("Text Questions", () => {
		it("should return first element for text question", () => {
			const result = formatAnswerValue(["Hello World"], "text");
			assert.strictEqual(result, "Hello World");
		});

		it("should handle text with special characters", () => {
			const result = formatAnswerValue(["Hello, World! @#$%"], "text");
			assert.strictEqual(result, "Hello, World! @#$%");
		});

		it("should handle multiline text", () => {
			const result = formatAnswerValue(["Line 1\nLine 2\nLine 3"], "text");
			assert.strictEqual(result, "Line 1\nLine 2\nLine 3");
		});

		it("should format date subtype correctly", () => {
			const result = formatAnswerValue(["2024-05-27T00:00:00.000Z"], "text", { subtype: "date" });
			assert.match(result, /May 27, 2024/);
		});

		it("should format time subtype correctly", () => {
			const result = formatAnswerValue(["2024-05-27T14:30:00.000Z"], "text", { subtype: "time" });
			assert.match(result, /\d{1,2}:\d{2}/); // Matches time format
		});

		it("should format number subtype with integer", () => {
			const result = formatAnswerValue(["42"], "text", { subtype: "number" });
			assert.strictEqual(result, "42");
		});

		it("should format number subtype with decimal", () => {
			const result = formatAnswerValue(["42.567"], "text", { subtype: "number" });
			assert.strictEqual(result, "42.57");
		});

		it("should handle invalid date gracefully", () => {
			const result = formatAnswerValue(["not a date"], "text", { subtype: "date" });
			assert.strictEqual(result, "not a date");
		});

		it("should handle invalid number gracefully", () => {
			const result = formatAnswerValue(["not a number"], "text", { subtype: "number" });
			assert.strictEqual(result, "not a number");
		});

		it("should handle email subtype as plain text", () => {
			const result = formatAnswerValue(["user@example.com"], "text", { subtype: "email" });
			assert.strictEqual(result, "user@example.com");
		});

		it("should handle url subtype as plain text", () => {
			const result = formatAnswerValue(["https://example.com"], "text", { subtype: "url" });
			assert.strictEqual(result, "https://example.com");
		});

		it("should handle short subtype as plain text", () => {
			const result = formatAnswerValue(["Short answer"], "text", { subtype: "short" });
			assert.strictEqual(result, "Short answer");
		});

		it("should handle long subtype as plain text", () => {
			const result = formatAnswerValue(["Long answer with multiple sentences."], "text", { subtype: "long" });
			assert.strictEqual(result, "Long answer with multiple sentences.");
		});
	});

	describe("Slider Questions", () => {
		it("should format integer slider value", () => {
			const result = formatAnswerValue(["5"], "slider");
			assert.strictEqual(result, "5");
		});

		it("should format decimal slider value with 2 decimal places", () => {
			const result = formatAnswerValue(["3.14159"], "slider");
			assert.strictEqual(result, "3.14");
		});

		it("should remove trailing zeros from decimal", () => {
			const result = formatAnswerValue(["3.50"], "slider");
			assert.strictEqual(result, "3.5");
		});

		it("should handle slider value with no decimals", () => {
			const result = formatAnswerValue(["10.00"], "slider");
			assert.strictEqual(result, "10");
		});

		it("should return empty string for invalid numeric value", () => {
			const result = formatAnswerValue(["not a number"], "slider");
			assert.strictEqual(result, "");
		});

		it("should return empty string for empty slider value", () => {
			const result = formatAnswerValue([""], "slider");
			assert.strictEqual(result, "");
		});

		it("should handle negative slider values", () => {
			const result = formatAnswerValue(["-5.75"], "slider");
			assert.strictEqual(result, "-5.75");
		});

		it("should handle zero slider value", () => {
			const result = formatAnswerValue(["0"], "slider");
			assert.strictEqual(result, "0");
		});
	});

	describe("Options Questions - Single Choice", () => {
		it("should return single choice as string", () => {
			const result = formatAnswerValue(["Option A"], "options", { multiple: false });
			assert.strictEqual(result, "Option A");
		});

		it("should return first choice when multiple provided but single choice expected", () => {
			const result = formatAnswerValue(["Option A", "Option B"], "options", { multiple: false });
			assert.strictEqual(result, "Option A");
		});

		it("should handle single choice with special characters", () => {
			const result = formatAnswerValue(["Option A, B & C"], "options", { multiple: false });
			assert.strictEqual(result, "Option A, B & C");
		});

		it("should return empty string for empty single choice", () => {
			const result = formatAnswerValue([""], "options", { multiple: false });
			assert.strictEqual(result, "");
		});

		it("should filter out empty strings in single choice", () => {
			const result = formatAnswerValue(["", "Option A"], "options", { multiple: false });
			assert.strictEqual(result, "Option A");
		});
	});

	describe("Options Questions - Multiple Choice", () => {
		it("should return multiple choices as comma-separated string", () => {
			const result = formatAnswerValue(["Option A", "Option B", "Option C"], "options", { multiple: true });
			assert.strictEqual(result, "Option A, Option B, Option C");
		});

		it("should handle two choices", () => {
			const result = formatAnswerValue(["Yes", "No"], "options", { multiple: true });
			assert.strictEqual(result, "Yes, No");
		});

		it("should handle single choice in multiple choice question", () => {
			const result = formatAnswerValue(["Only One"], "options", { multiple: true });
			assert.strictEqual(result, "Only One");
		});

		it("should filter out empty strings in multiple choice", () => {
			const result = formatAnswerValue(["Option A", "", "Option B"], "options", { multiple: true });
			assert.strictEqual(result, "Option A, Option B");
		});

		it("should filter out whitespace-only strings in multiple choice", () => {
			const result = formatAnswerValue(["Option A", "   ", "Option B"], "options", { multiple: true });
			assert.strictEqual(result, "Option A, Option B");
		});

		it("should return empty string when all choices are empty", () => {
			const result = formatAnswerValue(["", "  ", ""], "options", { multiple: true });
			assert.strictEqual(result, "");
		});

		it("should handle choices with commas", () => {
			const result = formatAnswerValue(["Option A, part 1", "Option B"], "options", { multiple: true });
			assert.strictEqual(result, "Option A, part 1, Option B");
		});
	});

	describe("Options Questions - No Metadata", () => {
		it("should default to single choice behavior when metadata is missing", () => {
			const result = formatAnswerValue(["Option A", "Option B"], "options");
			assert.strictEqual(result, "Option A");
		});

		it("should handle single option without metadata", () => {
			const result = formatAnswerValue(["Option A"], "options");
			assert.strictEqual(result, "Option A");
		});
	});

	describe("Unknown Question Types", () => {
		it("should return empty string for unknown question type", () => {
			// @ts-expect-error Testing invalid type
			const result = formatAnswerValue(["some value"], "unknown");
			assert.strictEqual(result, "");
		});
	});

	describe("Error Handling", () => {
		it("should handle malformed metadata gracefully", () => {
			const result = formatAnswerValue(["value"], "text", "not an object");
			assert.strictEqual(result, "value");
		});

		it("should handle null metadata gracefully", () => {
			const result = formatAnswerValue(["value"], "text", null);
			assert.strictEqual(result, "value");
		});

		it("should handle undefined metadata gracefully", () => {
			const result = formatAnswerValue(["value"], "text", undefined);
			assert.strictEqual(result, "value");
		});
	});
});
