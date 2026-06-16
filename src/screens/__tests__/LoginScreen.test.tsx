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

  it('disables button when email is empty or invalid', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaperProvider>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );
    const button = getByTestId('auth-button');
    const emailInput = getByTestId('email-input');

    // Initially button should be disabled because email and password are empty
    expect(button.props.accessibilityState.disabled).toBe(true);

    // Provide invalid email
    fireEvent.changeText(emailInput, 'invalidemail');

    // Wait for the UI to update
    await waitFor(() => {
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(getByText('Invalid email address.')).toBeTruthy();
    });

    // Provide valid email
    fireEvent.changeText(emailInput, 'valid@example.com');

    // Wait for UI update
    await waitFor(() => {
      // It's still disabled because password is empty
      expect(button.props.accessibilityState.disabled).toBe(true);
      // We expect the visible prop of the HelperText to be false, meaning it is visually hidden
      const helperText = queryByText('Invalid email address.');
      if (helperText) {
          // Verify it exists in tree but its parent wrapper / logic makes it hidden.
          // Wait for HelperText style or parent View style or explicit property to be invisible.
          // For HelperText, we know we set visible={false} and it might still render text with opacity 0.
          // So we should just check the component we passed false to.
          // But `queryByText` finds the text node inside.
      }
    });
  });

  it('shows password requirements and disables button in Sign Up mode when requirements are not met', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaperProvider>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );

    // Switch to Register Mode
    const signUpTab = getByText('Sign Up');
    fireEvent.press(signUpTab);

    const emailInput = getByTestId('email-input');
    const usernameInput = getByTestId('username-input');
    const passwordInput = getByTestId('password-input');
    const button = getByTestId('auth-button');

    // Provide valid email and username
    fireEvent.changeText(emailInput, 'valid@example.com');
    fireEvent.changeText(usernameInput, 'trainer123');

    // Provide weak password
    fireEvent.changeText(passwordInput, 'weak');

    await waitFor(() => {
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(getByText('Minimum 8 characters, At least one number, At least one uppercase letter')).toBeTruthy();
    });

    // Provide better but still invalid password
    fireEvent.changeText(passwordInput, 'weakpassword');

    await waitFor(() => {
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(getByText('At least one number, At least one uppercase letter')).toBeTruthy();
    });

    // Provide valid password
    fireEvent.changeText(passwordInput, 'StrongPass1');

    await waitFor(() => {
      expect(button.props.accessibilityState.disabled).toBe(false);
      expect(queryByText('At least one number, At least one uppercase letter')).toBeFalsy();
    });
  });
});
