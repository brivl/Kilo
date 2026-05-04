import { OffNetworkError, searchFoods } from '@/services/openFoodFacts';

const mockProduct = {
  id: '123',
  product_name: 'Oats',
  brands: 'Quaker',
  nutriments: {
    'energy-kcal_100g': 379,
    proteins_100g: 13,
    carbohydrates_100g: 68,
    fat_100g: 7,
  },
};

beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

it('returns normalised food on success', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: [mockProduct] }),
  });
  const results = await searchFoods('oats');
  expect(results).toHaveLength(1);
  expect(results[0]!.name).toBe('Oats');
  expect(results[0]!.kcalPer100g).toBe(379);
});

it('returns [] on malformed payload', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ notProducts: [] }),
  });
  const results = await searchFoods('oats');
  expect(results).toEqual([]);
});

it('throws OffNetworkError on HTTP 500', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
  await expect(searchFoods('oats')).rejects.toBeInstanceOf(OffNetworkError);
});

it('throws OffNetworkError on fetch failure', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
  await expect(searchFoods('oats')).rejects.toBeInstanceOf(OffNetworkError);
});

it('filters out products with no name', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: [mockProduct, { id: 'x', nutriments: {} }] }),
  });
  const results = await searchFoods('oats');
  expect(results).toHaveLength(1);
});
