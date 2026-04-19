import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComparisonSlider from "../components/ComparisonSlider.jsx";

describe("ComparisonSlider", () => {
  it("renders labels", () => {
    render(<ComparisonSlider before="a" after="b" beforeLabel="Original" afterLabel="Converted" />);
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Converted")).toBeInTheDocument();
  });

  it("toggles orientation", () => {
    render(<ComparisonSlider before="a" after="b" />);
    const toggle = screen.getByLabelText("Toggle comparison orientation");
    fireEvent.click(toggle);
    expect(toggle).toBeInTheDocument();
  });
});
