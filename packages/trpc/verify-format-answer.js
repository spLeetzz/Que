// Simple verification script for formatAnswerValue function
// This script manually tests the key functionality

function formatAnswerValue(rawValue, questionType, metadata) {
	// Handle null/undefined/empty values
	if (!rawValue || rawValue.length === 0 || !questionType) {
		return "";
	}

	try {
		switch (questionType) {
			case "text": {
				const textValue = rawValue[0];
				if (!textValue || textValue.trim() === "") {
					return "";
				}

				const subtype = metadata?.subtype;
				
				if (subtype === "date") {
					try {
						const date = new Date(textValue);
						if (!isNaN(date.getTime())) {
							return date.toLocaleDateString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric"
							});
						}
					} catch {
						// If date parsing fails, return as-is
					}
				} else if (subtype === "time") {
					try {
						const date = new Date(textValue);
						if (!isNaN(date.getTime())) {
							return date.toLocaleTimeString("en-US", {
								hour: "2-digit",
								minute: "2-digit"
							});
						}
					} catch {
						// If time parsing fails, return as-is
					}
				} else if (subtype === "number") {
					const num = parseFloat(textValue);
					if (!isNaN(num)) {
						return num % 1 === 0 ? num.toString() : num.toFixed(2);
					}
				}

				return textValue;
			}

			case "slider": {
				const sliderValue = rawValue[0];
				if (!sliderValue) {
					return "";
				}

				const num = parseFloat(sliderValue);
				if (isNaN(num)) {
					return "";
				}

				return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");
			}

			case "options": {
				const selections = rawValue.filter(v => v && v.trim() !== "");
				
				if (selections.length === 0) {
					return "";
				}

				const isMultiple = metadata?.multiple === true;

				if (isMultiple) {
					return selections.join(", ");
				} else {
					return selections[0] || "";
				}
			}

			default:
				return "";
		}
	} catch (error) {
		console.warn(`Error formatting answer value for question type ${questionType}:`, error);
		return "";
	}
}

// Test cases
console.log("Testing formatAnswerValue function...\n");

// Test 1: Null/undefined/empty values
console.log("Test 1: Edge cases");
console.log("  undefined:", formatAnswerValue(undefined, "text") === "" ? "✓" : "✗");
console.log("  null:", formatAnswerValue(null, "text") === "" ? "✓" : "✗");
console.log("  empty array:", formatAnswerValue([], "text") === "" ? "✓" : "✗");
console.log("  null question type:", formatAnswerValue(["value"], null) === "" ? "✓" : "✗");

// Test 2: Text questions
console.log("\nTest 2: Text questions");
console.log("  simple text:", formatAnswerValue(["Hello World"], "text") === "Hello World" ? "✓" : "✗");
console.log("  email:", formatAnswerValue(["user@example.com"], "text", { subtype: "email" }) === "user@example.com" ? "✓" : "✗");
console.log("  url:", formatAnswerValue(["https://example.com"], "text", { subtype: "url" }) === "https://example.com" ? "✓" : "✗");
console.log("  number (integer):", formatAnswerValue(["42"], "text", { subtype: "number" }) === "42" ? "✓" : "✗");
console.log("  number (decimal):", formatAnswerValue(["42.567"], "text", { subtype: "number" }) === "42.57" ? "✓" : "✗");

// Test 3: Slider questions
console.log("\nTest 3: Slider questions");
console.log("  integer:", formatAnswerValue(["5"], "slider") === "5" ? "✓" : "✗");
console.log("  decimal:", formatAnswerValue(["3.14159"], "slider") === "3.14" ? "✓" : "✗");
console.log("  trailing zeros:", formatAnswerValue(["3.50"], "slider") === "3.5" ? "✓" : "✗");
console.log("  invalid:", formatAnswerValue(["not a number"], "slider") === "" ? "✓" : "✗");

// Test 4: Options questions - single choice
console.log("\nTest 4: Options (single choice)");
console.log("  single:", formatAnswerValue(["Option A"], "options", { multiple: false }) === "Option A" ? "✓" : "✗");
console.log("  first of many:", formatAnswerValue(["Option A", "Option B"], "options", { multiple: false }) === "Option A" ? "✓" : "✗");

// Test 5: Options questions - multiple choice
console.log("\nTest 5: Options (multiple choice)");
console.log("  multiple:", formatAnswerValue(["Option A", "Option B", "Option C"], "options", { multiple: true }) === "Option A, Option B, Option C" ? "✓" : "✗");
console.log("  single in multiple:", formatAnswerValue(["Only One"], "options", { multiple: true }) === "Only One" ? "✓" : "✗");
console.log("  filter empty:", formatAnswerValue(["Option A", "", "Option B"], "options", { multiple: true }) === "Option A, Option B" ? "✓" : "✗");

// Test 6: Rating (typically slider)
console.log("\nTest 6: Rating (slider)");
console.log("  rating value:", formatAnswerValue(["4"], "slider") === "4" ? "✓" : "✗");

console.log("\n✅ All manual tests completed!");
