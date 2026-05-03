import { caloriesFromMacros, scaleNutrient, sumMacros } from '@/utils/macros'

describe('macros', () => {
  it('caloriesFromMacros 4/4/9', () =>
    expect(caloriesFromMacros({ proteinG: 10, carbsG: 10, fatG: 10 })).toBe(170))
  it('scaleNutrient per 100g', () => expect(scaleNutrient(20, 100, 150)).toBeCloseTo(30))
  it('sumMacros empty', () =>
    expect(sumMacros([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }))
  it('sumMacros two entries', () => {
    const entries = [
      { calories: 200, proteinG: 20, carbsG: 30, fatG: 5 },
      { calories: 100, proteinG: 10, carbsG: 10, fatG: 3 },
    ]
    expect(sumMacros(entries)).toEqual({ calories: 300, proteinG: 30, carbsG: 40, fatG: 8 })
  })
})
