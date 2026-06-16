import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import LoginScreen from '../LoginScreen';
import { login } from '../../services/authService';

// Mock the auth context
const mockSetUserId = jest.fn();
const mockSetToken = jest.fn();
jest.mock('../../store/AuthContext', () => ({
  useAuth: () => ({ setUserId: mockSetUserId, setToken: mockSetToken }),
}));

// Mock the auth service
jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows user to enter email and password and submit', async () => {
    // Setup the mock response for the login service
    (login as jest.Mock).mockResolvedValueOnce({ access_token: 'fake_token' });

    const { getByTestId } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaperProvider>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const button = getByTestId('auth-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'securepassword');
    fireEvent.press(button);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'securepassword');
      expect(mockSetToken).toHaveBeenCalledWith('fake_token');
      expect(mockSetUserId).toHaveBeenCalledWith('test');
    });
  }, 10000);

  it('shows error if email or password is empty', async () => {
    const { getByTestId, getByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaperProvider>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );
    const button = getByTestId('auth-button');

    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Please fill in email and password.')).toBeTruthy();
      expect(login).not.toHaveBeenCalled();
    });
  });
});
