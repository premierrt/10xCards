import { faker } from "faker";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar: faker.image.avatar(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
};

export const createMockUsers = (count: number, overrides?: Partial<MockUser>): MockUser[] => {
  return Array.from({ length: count }, () => createMockUser(overrides));
};
