import type { ComponentProps } from 'react'

// Common test props for components
export const mockProps = {
  // Mock function props
  onClick: vi.fn(),
  onSubmit: vi.fn(),
  onChange: vi.fn(),
  onFocus: vi.fn(),
  onBlur: vi.fn(),
}

// Helper to create typed props for specific components
export const createMockProps = <T extends Record<string, any>>(
  component: T,
  props: Partial<ComponentProps<T>> = {}
): ComponentProps<T> => {
  return {
    ...mockProps,
    ...props,
  } as ComponentProps<T>
}