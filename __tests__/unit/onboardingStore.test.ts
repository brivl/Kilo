import { useOnboardingStore } from '@/store/onboardingStore';

beforeEach(() => {
  useOnboardingStore.setState({
    goal: null,
    weightKg: null,
    heightCm: null,
    age: null,
    sex: null,
    activityLevel: null,
  });
});

it('setGoal updates goal', () => {
  useOnboardingStore.getState().setGoal('lose');
  expect(useOnboardingStore.getState().goal).toBe('lose');
});

it('setStats updates all stats fields', () => {
  useOnboardingStore.getState().setStats({ weightKg: 80, heightCm: 180, age: 30, sex: 'male' });
  const s = useOnboardingStore.getState();
  expect(s.weightKg).toBe(80);
  expect(s.heightCm).toBe(180);
  expect(s.age).toBe(30);
  expect(s.sex).toBe('male');
});

it('setActivityLevel updates activityLevel', () => {
  useOnboardingStore.getState().setActivityLevel('moderate');
  expect(useOnboardingStore.getState().activityLevel).toBe('moderate');
});

it('reset clears all fields to null', () => {
  useOnboardingStore.getState().setGoal('gain');
  useOnboardingStore.getState().setStats({ weightKg: 80, heightCm: 180, age: 30, sex: 'male' });
  useOnboardingStore.getState().setActivityLevel('very');
  useOnboardingStore.getState().reset();
  const s = useOnboardingStore.getState();
  expect(s.goal).toBeNull();
  expect(s.weightKg).toBeNull();
  expect(s.heightCm).toBeNull();
  expect(s.age).toBeNull();
  expect(s.sex).toBeNull();
  expect(s.activityLevel).toBeNull();
});
