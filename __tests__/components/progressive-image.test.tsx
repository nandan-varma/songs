import { act, render, screen, waitFor } from "@testing-library/react";
import { ProgressiveImage } from "../../components/progressive-image";

// Mock Next.js Image
jest.mock("next/image", () => ({
	__esModule: true,
	default: (props: Record<string, unknown>) => (
		<div
			data-testid="next-image"
			role="img"
			data-src={props.src}
			data-alt={props.alt}
			className={props.className as string}
		/>
	),
}));

describe("ProgressiveImage", () => {
	const mockImages = [
		{ url: "low.jpg", quality: "50x50" },
		{ url: "high.jpg", quality: "500x500" },
	];

	let imageInstances: { onload: jest.Mock; onerror: jest.Mock; src: string }[];

	beforeEach(() => {
		imageInstances = [];
		// Mock window.Image
		const mockImage = jest.fn().mockImplementation(() => {
			const instance = {
				onload: jest.fn(),
				onerror: jest.fn(),
				src: "",
			};
			imageInstances.push(instance);
			return instance;
		});

		Object.defineProperty(window, "Image", {
			writable: true,
			value: mockImage,
		});
	});

	it("renders with low quality image initially", () => {
		render(<ProgressiveImage images={mockImages} alt="Test image" />);

		const img = screen.getByTestId("next-image");
		expect(img.getAttribute("data-src")).toBe("low.jpg");
		expect(img.className).toContain("rounded");
	});

	it("loads high quality image when available", async () => {
		render(<ProgressiveImage images={mockImages} alt="Test image" />);

		// Trigger low quality load
		act(() => {
			imageInstances[0].onload();
		});

		await waitFor(() => {
			const img = screen.getByTestId("next-image");
			expect(img.getAttribute("data-src")).toBe("low.jpg");
		});

		// Trigger high quality load
		act(() => {
			imageInstances[1].onload();
		});

		await waitFor(() => {
			const img = screen.getByTestId("next-image");
			expect(img.getAttribute("data-src")).toBe("high.jpg");
		});
	});

	it("shows fallback when images fail to load", async () => {
		render(<ProgressiveImage images={mockImages} alt="Test image" />);

		// Trigger error on low quality
		act(() => {
			imageInstances[0].onerror();
		});

		await waitFor(() => {
			const img = screen.getByTestId("next-image");
			expect(img.getAttribute("data-src")).toBe(
				"https://placehold.co/500x500.webp?text=Image+Not+Found",
			);
		});
	});

	it("handles empty images array", () => {
		render(<ProgressiveImage images={[]} alt="Test image" />);

		const img = screen.getByTestId("next-image");
		expect(img.getAttribute("data-src")).toBe(
			"https://placehold.co/500x500.webp?text=Image+Not+Found",
		);
	});

	it("applies correct classes for fill mode", () => {
		render(<ProgressiveImage images={mockImages} fill rounded="full" />);

		const img = screen.getByTestId("next-image");
		expect(img.className).toContain("object-cover");
		expect(img.className).toContain("blur-sm");
		expect(img.className).toContain("rounded-full");
	});

	it("applies correct classes for fixed size", () => {
		render(
			<ProgressiveImage
				images={mockImages}
				fill={false}
				width={300}
				height={300}
			/>,
		);

		const wrapper = screen.getByRole("img").parentElement;
		expect(wrapper?.className).toContain("overflow-hidden");
		expect(wrapper?.className).toContain("bg-muted");
		expect(wrapper?.className).toContain("rounded");
	});
});
