import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import LoginScreen from '../LoginScreen';
import { login } from '../../services/authService';

// Mock the auth context
const mockSetUserId = jest.fn();
jest.mock('../../store/AuthContext', () => ({
  useAuth: () => ({ setUserId: mockSetUserId }),
}));

// Mock the auth service
jest.mock('../../services/authService', () => ({
  login: jest.fn(),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
it('allows user to enter username and submit', async () => {
    // Setup the mock response for the login service
    (login as jest.Mock).mockResolvedValueOnce({ user_id: 'test_trainer' });

    const { getByTestId } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaperProvider>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );

    const input = getByTestId('username-input');
    const button = getByTestId('login-button');

    fireEvent.changeText(input, 'test_trainer');
    fireEvent.press(button);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test_trainer');
      expect(mockSetUserId).toHaveBeenCalledWith('test_trainer');
    });
  }, 10000);

  it('shows error if username is empty', async () => {
    const { getByTestId, getByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaperProvider>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );
    const button = getByTestId('login-button');

    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Please enter a username.')).toBeTruthy();
      expect(login).not.toHaveBeenCalled();
    });
  });
});
