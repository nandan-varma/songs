import { formatDuration } from "@/lib/utils";

describe("cn", () => {
	it("merges class names correctly", () => {
		expect(cn("class1", "class2")).toBe("class1 class2");
		expect(cn("class1", undefined, "class2")).toBe("class1 class2");
	});
});
