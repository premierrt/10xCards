import { faker } from "faker";

export interface MockCard {
  id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export const createMockCard = (overrides: Partial<MockCard> = {}): MockCard => {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    tags: faker.lorem.words(3).split(" "),
    user_id: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    is_public: faker.datatype.boolean(),
    ...overrides,
  };
};

export const createMockCards = (count: number, overrides?: Partial<MockCard>): MockCard[] => {
  return Array.from({ length: count }, () => createMockCard(overrides));
};
