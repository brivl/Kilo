import { fireEvent, render } from '@testing-library/react-native';

import { FoodEntryRow } from '@/components/FoodEntry';

const entry = {
  id: '1',
  foodName: 'Chicken breast',
  quantity: 200,
  unit: 'g',
  calories: 330,
  proteinG: 62,
  carbsG: 0,
  fatG: 7,
};

it('renders food name and calories', () => {
  const { getByText } = render(<FoodEntryRow entry={entry} onDelete={jest.fn()} />);
  expect(getByText('Chicken breast')).toBeTruthy();
  expect(getByText('330 kcal')).toBeTruthy();
});

it('calls onDelete with id', () => {
  const onDelete = jest.fn();
  const { getByLabelText } = render(<FoodEntryRow entry={entry} onDelete={onDelete} />);
  fireEvent.press(getByLabelText('Delete Chicken breast'));
  expect(onDelete).toHaveBeenCalledWith('1');
});
