import {
  calculateBMR,
  calculateMacros,
  calculateTargetCalories,
  calculateTDEE,
} from '@/utils/tdee';

describe('calculateBMR', () => {
  it('calculates male BMR', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR(80, 180, 30, 'male')).toBe(1780);
  });
  it('calculates female BMR', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345.25);
  });
});

describe('calculateTDEE', () => {
  it('applies sedentary multiplier (×1.2)', () => {
    // BMR=1780, ×1.2 = 2136
    expect(calculateTDEE(80, 180, 30, 'male', 'sedentary')).toBe(2136);
  });
  it('applies moderate multiplier (×1.55)', () => {
    // BMR=1780, ×1.55 = 2759
    expect(calculateTDEE(80, 180, 30, 'male', 'moderate')).toBe(2759);
  });
});

describe('calculateTargetCalories', () => {
  it('subtracts 500 for lose', () => {
    expect(calculateTargetCalories(2000, 'lose')).toBe(1500);
  });
  it('adds 300 for gain', () => {
    expect(calculateTargetCalories(2000, 'gain')).toBe(2300);
  });
  it('is unchanged for maintain', () => {
    expect(calculateTargetCalories(2000, 'maintain')).toBe(2000);
  });
  it('is unchanged for recomp', () => {
    expect(calculateTargetCalories(2000, 'recomp')).toBe(2000);
  });
});

describe('calculateMacros', () => {
  it('calculates lose macros (40/30/30)', () => {
    // 1500 cal: protein 40%=600/4=150g, carbs 30%=450/4=113g, fat 30%=450/9=50g
    expect(calculateMacros(1500, 'lose')).toEqual({
      proteinG: 150,
      carbsG: 113,
      fatG: 50,
    });
  });
  it('calculates gain macros (30/50/20)', () => {
    // 2300 cal: protein 30%=690/4=173g, carbs 50%=1150/4=288g, fat 20%=460/9=51g
    expect(calculateMacros(2300, 'gain')).toEqual({
      proteinG: 173,
      carbsG: 288,
      fatG: 51,
    });
  });
  it('calculates maintain macros (30/45/25)', () => {
    // 2000 cal: protein 30%=600/4=150g, carbs 45%=900/4=225g, fat 25%=500/9=56g
    expect(calculateMacros(2000, 'maintain')).toEqual({
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });
  });
  it('calculates recomp macros (40/35/25)', () => {
    // 2000 cal: protein 40%=800/4=200g, carbs 35%=700/4=175g, fat 25%=500/9=56g
    expect(calculateMacros(2000, 'recomp')).toEqual({
      proteinG: 200,
      carbsG: 175,
      fatG: 56,
    });
  });
});
