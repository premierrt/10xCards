import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/utils/render";
import { Button } from "../button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Test Button</Button>);

    expect(screen.getByRole("button")).toHaveTextContent("Test Button");
  });

  it("applies default variant and size classes", () => {
    render(<Button>Default Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground", "h-9");
  });

  it("applies custom variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive", "text-white");
  });

  it("applies custom size classes", () => {
    render(<Button size="lg">Large Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "px-6");
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("has correct data-slot attribute", () => {
    render(<Button>Slotted Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("matches snapshot for default button", () => {
    const { container } = render(<Button>Snapshot Button</Button>);

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div>
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3"
          data-slot="button"
        >
          Snapshot Button
        </button>
      </div>
    `);
  });

  it.each([
    ["default", "bg-primary"],
    ["destructive", "bg-destructive"],
    ["outline", "border"],
    ["secondary", "bg-secondary"],
    ["ghost", "hover:bg-accent"],
    ["link", "text-primary"],
  ])("applies correct classes for %s variant", (variant, expectedClass) => {
    render(<Button variant={variant as any}>Test</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass(expectedClass);
  });
});
