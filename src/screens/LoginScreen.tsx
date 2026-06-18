import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  HelperText,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, register } from '../services/authService';
import { useAuth } from '../store/AuthContext';

export default function LoginScreen() {
  const theme = useTheme();
  const auth = useAuth();

  /*
    Mantém o mesmo contexto de autenticação já usado pelo projeto.
    Não foi alterado o fluxo de login, token ou usuário.
  */
  const { setUserId, setToken } = auth;

  /*
    Estes setters são acessados com any para manter compatibilidade caso o
    AuthContext já tenha esses campos no projeto, sem forçar alteração de tipos.
  */
  const setIconUrl = (auth as any).setIconUrl;
  const setCompanionPokemonId = (auth as any).setCompanionPokemonId;

  // Controla se a tela está em modo login ou cadastro.
  const [mode, setMode] = useState('login');

  // Campos do formulário.
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Estados visuais de carregamento e mensagens.
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /*
    Validação simples de e-mail.
    Usada apenas para habilitar/desabilitar botão e mostrar mensagem visual.
  */
  const isEmailValid = (value: string) => {
    if (!value) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  /*
    Regras visuais para senha no cadastro.
    O login continua aceitando qualquer senha preenchida.
  */
  const getPasswordErrors = (pass: string) => {
    const errors: string[] = [];

    if (pass.length < 8) errors.push('Minimum 8 characters');
    if (!/\d/.test(pass)) errors.push('At least one number');
    if (!/[A-Z]/.test(pass)) errors.push('At least one uppercase letter');

    return errors;
  };

  const isPasswordValid = (pass: string) => {
    if (mode === 'login') return pass.trim().length > 0;

    return getPasswordErrors(pass).length === 0;
  };

  /*
    Valida o formulário antes de liberar o botão.
    Não muda a chamada de API, apenas evita envio incompleto.
  */
  const isFormValid = () => {
    if (!isEmailValid(email)) return false;
    if (!isPasswordValid(password)) return false;
    if (mode === 'register' && !username.trim()) return false;

    return true;
  };

  // Exibe mensagens de erro ou sucesso na parte inferior da tela.
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  /*
    Mantém o fluxo original:
    - Se estiver em cadastro, registra primeiro.
    - Depois faz login.
    - Salva token e dados do usuário no contexto.
  */
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showSnackbar('Please fill in email and password.');
      return;
    }

    if (mode === 'register' && !username.trim()) {
      showSnackbar('Please enter a username for registration.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        await register(email.trim(), username.trim(), password);
      }

      const tokenData = await login(email.trim(), password);

      setToken(tokenData.access_token);
      setUserId(tokenData.user_id);

      if (typeof setIconUrl === 'function') {
        setIconUrl(tokenData.icon_url || null);
      }

      if (typeof setCompanionPokemonId === 'function') {
        setCompanionPokemonId(tokenData.companion_pokemon_id || null);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Cabeçalho visual da tela de login/cadastro. */}
            <View style={styles.hero}>
              <View style={[styles.logoCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="headlineLarge" style={{ color: theme.colors.primary }}>
                  P
                </Text>
              </View>

              <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
                Poke-Adoção
              </Text>

              <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {isRegister ? 'Create a new account.' : 'Sign in to continue.'}
              </Text>
            </View>

            {/* Card principal do formulário. */}
            <Card mode="elevated" style={styles.card}>
              <Card.Content>
                {/* Alterna entre login e cadastro. */}
                <SegmentedButtons
                  value={mode}
                  onValueChange={setMode}
                  style={styles.segmentedButton}
                  buttons={[
                    { value: 'login', label: 'Login' },
                    { value: 'register', label: 'Sign Up' },
                  ]}
                />

                <TextInput
                  testID="email-input"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  mode="outlined"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                  error={email.length > 0 && !isEmailValid(email)}
                  disabled={isLoading}
                />

                <HelperText type="error" visible={email.length > 0 && !isEmailValid(email)}>
                  Invalid email address.
                </HelperText>

                {/* Campo de username aparece somente no cadastro. */}
                {isRegister && (
                  <TextInput
                    testID="username-input"
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    mode="outlined"
                    left={<TextInput.Icon icon="account-outline" />}
                    style={styles.input}
                    disabled={isLoading}
                  />
                )}

                <TextInput
                  testID="password-input"
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  mode="outlined"
                  left={<TextInput.Icon icon="lock-outline" />}
                  style={styles.input}
                  error={password.length > 0 && !isPasswordValid(password)}
                  disabled={isLoading}
                />

                {/* Mostra os requisitos da senha apenas durante o cadastro. */}
                {isRegister && password.length > 0 && !isPasswordValid(password) && (
                  <HelperText type="error" visible>
                    {getPasswordErrors(password).join(', ')}
                  </HelperText>
                )}

                <Button
                  testID="auth-button"
                  mode="contained"
                  onPress={handleAuth}
                  loading={isLoading}
                  disabled={!isFormValid() || isLoading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {isRegister ? 'Register' : 'Login'}
                </Button>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mensagens de erro e retorno da API. */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

/*
  Estilos apenas visuais.
  Não alteram chamada de API, navegação ou regra de autenticação.
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    borderRadius: 24,
  },
  segmentedButton: {
    marginBottom: 18,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 18,
    borderRadius: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});