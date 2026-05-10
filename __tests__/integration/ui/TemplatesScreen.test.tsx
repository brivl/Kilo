import { fireEvent, render, waitFor } from '@testing-library/react-native';

import TemplatesScreen from '@/app/(protected)/food/templates';
import { createTemplate } from '@/store/mealTemplateStore';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

beforeAll(() => {
  mockDb = makeTestDatabase();
});

beforeEach(async () => {
  const templates = await mockDb.collections.get('meal_templates').query().fetch();
  const items = await mockDb.collections.get('meal_template_items').query().fetch();
  await mockDb.write(async () => {
    for (const t of templates) await t.destroyPermanently();
    for (const i of items) await i.destroyPermanently();
  });
});

it('lists existing templates', async () => {
  await createTemplate('Breakfast A', [
    {
      foodName: 'Oats',
      calories: 300,
      proteinG: 10,
      carbsG: 50,
      fatG: 5,
      quantity: 1,
      unit: 'serving',
    },
  ]);
  await createTemplate('Lunch B', []);

  const { findByText } = render(<TemplatesScreen />);
  expect(await findByText('Breakfast A')).toBeTruthy();
  expect(await findByText('Lunch B')).toBeTruthy();
});

it('deletes a template when delete is pressed', async () => {
  await createTemplate('Temp meal', []);

  const { findByText, getByRole, queryByText } = render(<TemplatesScreen />);
  await findByText('Temp meal');

  fireEvent.press(getByRole('button', { name: 'Delete Temp meal' }));

  await waitFor(() => expect(queryByText('Temp meal')).toBeNull());
});
