// Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PartyScreen from '../PartyScreen';

// Mock the AuthContext
jest.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    userId: 'test_trainer',
  }),
}));

// Mock useFocusEffect from React Navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        party: [
          { id: 1, pokemon_id: 25 },
          { id: 2, pokemon_id: 1 },
        ],
      }),
  }),
) as jest.Mock;

describe('PartyScreen', () => {
  it('renders party screen correctly with populated slots and empty slots', async () => {
    const { getByText, getAllByText } = render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <PaperProvider>
          <PartyScreen />
        </PaperProvider>
      </SafeAreaProvider>,
    );

    // Initial loading state might not be testable due to how fast the mock resolves or layout issues,
    // so we wait for the final layout.
    await waitFor(() => {
      expect(getByText('Your Party')).toBeTruthy();

      // With 2 pokemon in party out of 6 total slots, there should be 4 empty slots
      const emptySlots = getAllByText('Empty Slot');
      expect(emptySlots.length).toBe(4);
    });
  });
});
