import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Snackbar, SegmentedButtons } from 'react-native-paper';
import { login, register } from '../services/authService';
import { useAuth } from '../store/AuthContext';
import { jwtDecode } from 'jwt-decode';

export default function LoginScreen() {
  const theme = useTheme();
  const { setUserId, setToken } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setSnackbarMessage("Please fill in email and password.");
      setSnackbarVisible(true);
      return;
    }

    if (mode === 'register' && !username.trim()) {
      setSnackbarMessage("Please enter a username for registration.");
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await register(email.trim(), username.trim(), password);
        // Automatically login after successful registration
      }
      
      const tokenData = await login(email.trim(), password);
      
      setToken(tokenData.access_token);
      setUserId(mode === 'register' ? username.trim() : email.trim().split('@')[0]);

    } catch (error: any) {
      setSnackbarMessage(error.message || "Authentication failed.");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.formContainer}>
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          Poke-Adoção
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {mode === 'login' ? 'Sign in to continue.' : 'Create a new account.'}
        </Text>

        <SegmentedButtons
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: 'login', label: 'Sign In' },
            { value: 'register', label: 'Sign Up' },
          ]}
          style={styles.segmentedButton}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          testID="email-input"
        />

        {mode === 'register' && (
          <TextInput
            label="Trainer Name"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            style={styles.input}
            testID="username-input"
          />
        )}

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={true}
          style={styles.input}
          testID="password-input"
        />

        <Button
          mode="contained"
          onPress={handleAuth}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          testID="auth-button"
        >
          {mode === 'login' ? 'Login' : 'Register'}
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  segmentedButton: {
    marginBottom: 16,
  }
});
