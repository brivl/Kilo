import React from 'react'
import { render, screen } from '@testing-library/react-native'

import FoodLogScreen from '@/app/(tabs)/index'
import JournalScreen from '@/app/(tabs)/journal'
import PlansScreen from '@/app/(tabs)/plans'
import ProgressScreen from '@/app/(tabs)/progress'

describe('Tab screens', () => {
  it('renders FoodLogScreen', () => {
    render(<FoodLogScreen />)
    expect(screen.getByText('Food Log')).toBeTruthy()
  })

  it('renders JournalScreen', () => {
    render(<JournalScreen />)
    expect(screen.getByText('Journal')).toBeTruthy()
  })

  it('renders PlansScreen', () => {
    render(<PlansScreen />)
    expect(screen.getByText('Plans')).toBeTruthy()
  })

  it('renders ProgressScreen', () => {
    render(<ProgressScreen />)
    expect(screen.getByText('Progress')).toBeTruthy()
  })
})
