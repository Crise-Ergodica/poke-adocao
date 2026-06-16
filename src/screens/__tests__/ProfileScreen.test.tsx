import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { AuthContext } from '../../store/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as authService from '../../services/authService';

// Mock the updateIcon function
jest.mock('../../services/authService', () => ({
  updateIcon: jest.fn(),
}));

describe('ProfileScreen', () => {
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 320, height: 640 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };

  it('renders correctly and allows submitting a custom avatar URL', async () => {
    (authService.updateIcon as jest.Mock).mockResolvedValueOnce({});

    // We need to provide a fake user id so the component doesn't fail the "if (!userId)" check
    const mockAuthContext = {
      userId: 'test_trainer',
      setUserId: jest.fn(),
      iconUrl: null,
      setIconUrl: jest.fn(),
      token: 'fake_token',
      setToken: jest.fn(),
      logout: jest.fn() as any,
    };

    const { getByText, getByTestId } = render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <PaperProvider>
          <AuthContext.Provider value={mockAuthContext}>
            <ProfileScreen />
          </AuthContext.Provider>
        </PaperProvider>
      </SafeAreaProvider>
    );

    expect(getByText('Profile Settings')).toBeTruthy();

    const input = getByTestId('avatar-input');
    fireEvent.changeText(input, 'https://example.com/avatar.png');

    const submitButton = getByText('Set Custom Avatar');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(authService.updateIcon).toHaveBeenCalledWith('test_trainer', 'https://example.com/avatar.png', 'fake_token');
    });
  });
});
