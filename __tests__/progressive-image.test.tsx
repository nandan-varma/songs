import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { ProgressiveImage } from "../components/progressive-image";

// Mock Next.js Image
jest.mock("next/image", () => ({
	__esModule: true,
	default: (props: any) => <img {...props} />,
}));

describe("ProgressiveImage", () => {
	const mockImages = [
		{ url: "low.jpg", quality: "50x50" },
		{ url: "high.jpg", quality: "500x500" },
	];

	let imageInstances: any[];

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

		const img = screen.getByAltText("Test image");
		expect(img).toHaveAttribute("src", "low.jpg");
	});

	it("loads high quality image when available", async () => {
		render(<ProgressiveImage images={mockImages} alt="Test image" />);

		// Trigger low quality load
		act(() => {
			imageInstances[0].onload();
		});

		await waitFor(() => {
			const img = screen.getByAltText("Test image");
			expect(img).toHaveAttribute("src", "low.jpg");
		});

		// Trigger high quality load
		act(() => {
			imageInstances[1].onload();
		});

		await waitFor(() => {
			const img = screen.getByAltText("Test image");
			expect(img).toHaveAttribute("src", "high.jpg");
		});
	});

	it("shows fallback when images fail to load", async () => {
		render(<ProgressiveImage images={mockImages} alt="Test image" />);

		// Trigger error on low quality
		act(() => {
			imageInstances[0].onerror();
		});

		await waitFor(() => {
			const img = screen.getByAltText("Image not found");
			expect(img).toHaveAttribute(
				"src",
				"https://placehold.co/500x500.webp?text=Image+Not+Found",
			);
		});
	});

	it("handles empty images array", () => {
		render(<ProgressiveImage images={[]} alt="Test image" />);

		const img = screen.getByAltText("Image not found");
		expect(img).toHaveAttribute(
			"src",
			"https://placehold.co/500x500.webp?text=Image+Not+Found",
		);
	});

	it("applies correct classes for fill mode", () => {
		render(<ProgressiveImage images={mockImages} fill rounded="full" />);

		const img = screen.getByAltText("Image");
		expect(img).toHaveClass("object-cover", "blur-sm", "rounded-full");
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
		expect(wrapper).toHaveClass("overflow-hidden", "bg-muted", "rounded");
	});
});
