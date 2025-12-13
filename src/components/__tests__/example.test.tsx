import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/utils/render";

// Example component for testing
const ExampleComponent = ({ title, onClick }: { title: string; onClick?: () => void }) => {
  return (
    <div>
      <h1 data-testid="title">{title}</h1>
      <button data-testid="click-button" onClick={onClick}>
        Click me
      </button>
    </div>
  );
};

describe("ExampleComponent", () => {
  it("renders title correctly", () => {
    render(<ExampleComponent title="Test Title" />);

    expect(screen.getByTestId("title")).toHaveTextContent("Test Title");
  });

  it("calls onClick when button is clicked", async () => {
    const mockClick = vi.fn();
    const { user } = render(<ExampleComponent title="Test" onClick={mockClick} />);

    await user.click(screen.getByTestId("click-button"));

    expect(mockClick).toHaveBeenCalledOnce();
  });

  it("matches snapshot", () => {
    const { container } = render(<ExampleComponent title="Snapshot Test" />);

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div>
        <div>
          <h1
            data-testid="title"
          >
            Snapshot Test
          </h1>
          <button
            data-testid="click-button"
          >
            Click me
          </button>
        </div>
      </div>
    `);
  });
});
