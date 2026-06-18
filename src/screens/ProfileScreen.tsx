import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  updateCompanion,
  updateIcon,
  updatePassword,
  updateUsername,
} from '../services/authService';
import { useAuth } from '../store/AuthContext';

/*
  Avatares prontos para escolha rápida.
  Usam sprites públicos do PokeAPI.
*/
const STATIC_AVATARS = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
];

export default function ProfileScreen() {
  const theme = useTheme();
  const auth = useAuth();

  /*
    Dados vindos do contexto de autenticação.
    Mantém o mesmo fluxo do projeto.
  */
  const {
    userId,
    setUserId,
    iconUrl,
    setIconUrl,
    token,
    logout,
  } = auth;

  /*
    Campos opcionais acessados com any para evitar alteração obrigatória
    na tipagem do AuthContext.
  */
  const companionPokemonId = (auth as any).companionPokemonId;
  const setCompanionPokemonId = (auth as any).setCompanionPokemonId;

  // Campos editáveis da tela.
  const [inputUrl, setInputUrl] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [companionInput, setCompanionInput] = useState('');

  // Estados visuais.
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Exibe mensagens no rodapé.
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  /*
    Atualiza o avatar do usuário.
    Mantém chamada ao service updateIcon.
  */
  const handleUpdateIcon = async (url: string) => {
    if (!userId || !token) {
      showSnackbar('User ID or token not found.');
      return;
    }

    setLoading(true);

    try {
      await updateIcon(userId, url, token);
      setIconUrl(url);
      showSnackbar('Profile icon updated successfully!');
      setInputUrl('');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update icon.');
    } finally {
      setLoading(false);
    }
  };

  /*
    Atualiza o username do usuário.
    Mantém chamada ao service updateUsername.
  */
  const handleUpdateUsername = async () => {
    if (!userId || !token) return;

    setLoading(true);

    try {
      await updateUsername(userId, usernameInput, token);
      setUserId(usernameInput);
      showSnackbar('Username updated successfully!');
      setUsernameInput('');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update username.');
    } finally {
      setLoading(false);
    }
  };

  /*
    Atualiza a senha do usuário.
    Mantém chamada ao service updatePassword.
  */
  const handleUpdatePassword = async () => {
    if (!userId || !token) return;

    setLoading(true);

    try {
      await updatePassword(userId, passwordInput, token);
      showSnackbar('Password updated successfully!');
      setPasswordInput('');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  /*
    Atualiza o Pokemon companheiro.
    A validação local evita IDs inválidos antes de chamar a API.
  */
  const handleUpdateCompanion = async () => {
    if (!userId || !token) return;

    setLoading(true);

    try {
      const parsedId = parseInt(companionInput, 10);

      if (Number.isNaN(parsedId) || parsedId < 1 || parsedId > 1025) {
        throw new Error('Please enter a valid PokeAPI ID between 1 and 1025.');
      }

      await updateCompanion(userId, parsedId, token);

      if (typeof setCompanionPokemonId === 'function') {
        setCompanionPokemonId(parsedId);
      }

      showSnackbar('Companion Pokemon updated successfully!');
      setCompanionInput('');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update companion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          {/* Cabeçalho da tela. */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              Profile Settings
            </Text>

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Ajuste seu treinador, avatar e Pokemon companheiro.
            </Text>
          </View>

          {/* Card superior com avatar, companion e logout. */}
          <Card mode="elevated" style={styles.profileCard}>
            <Card.Content style={styles.centerContent}>
              <View style={styles.avatarRow}>
                {iconUrl ? (
                  <Avatar.Image size={104} source={{ uri: iconUrl }} />
                ) : (
                  <Avatar.Icon size={104} icon="account" />
                )}

                {companionPokemonId && (
                  <View style={[styles.companionBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Avatar.Image
                      size={90}
                      source={{
                        uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${companionPokemonId}.png`,
                      }}
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </View>
                )}
              </View>

              <Text variant="titleMedium" style={styles.userIdText}>
                Trainer: {userId}
              </Text>

              <Button
                mode="outlined"
                onPress={logout}
                textColor={theme.colors.error}
                style={[styles.logoutButton, { borderColor: theme.colors.error }]}
              >
                Logout
              </Button>
            </Card.Content>
          </Card>

          {/* Card para alterar username e senha. */}
          <Card mode="elevated" style={styles.card}>
            <Card.Title title="Update Details" subtitle="Altere nome e senha da conta" />

            <Card.Content>
              <TextInput
                testID="username-input"
                label="New Username"
                value={usernameInput}
                onChangeText={setUsernameInput}
                mode="outlined"
                left={<TextInput.Icon icon="account-edit-outline" />}
                style={styles.input}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleUpdateUsername}
                loading={loading}
                disabled={!usernameInput || loading}
                style={styles.actionButton}
              >
                Update Username
              </Button>

              <TextInput
                testID="password-input"
                label="New Password"
                value={passwordInput}
                onChangeText={setPasswordInput}
                mode="outlined"
                secureTextEntry
                left={<TextInput.Icon icon="lock-reset" />}
                style={styles.input}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleUpdatePassword}
                loading={loading}
                disabled={!passwordInput || loading}
                style={styles.actionButton}
              >
                Update Password
              </Button>
            </Card.Content>
          </Card>

          {/* Card para alterar Pokemon companheiro. */}
          <Card mode="elevated" style={styles.card}>
            <Card.Title title="Companion Pokemon" subtitle="Escolha um Pokemon por ID da PokeAPI" />

            <Card.Content>
              <TextInput
                testID="companion-input"
                label="PokeAPI ID (1 to 1025)"
                value={companionInput}
                onChangeText={setCompanionInput}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="pokeball" />}
                style={styles.input}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleUpdateCompanion}
                loading={loading}
                disabled={!companionInput || loading}
                style={styles.actionButton}
              >
                Set Companion
              </Button>
            </Card.Content>
          </Card>

          {/* Card de avatares prontos. */}
          <Card mode="elevated" style={styles.card}>
            <Card.Title title="Choose a Preset Avatar" />

            <Card.Content>
              <View style={styles.presetContainer}>
                {STATIC_AVATARS.map((url) => (
                  <Button
                    key={url}
                    onPress={() => handleUpdateIcon(url)}
                    disabled={loading}
                    style={styles.presetButton}
                    contentStyle={styles.presetButtonContent}
                  >
                    <Avatar.Image
                      size={54}
                      source={{ uri: url }}
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </Button>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Card para URL personalizada de avatar. */}
          <Card mode="elevated" style={styles.card}>
            <Card.Title title="Or enter a custom URL (ending in .png, .jpg or .jpeg)" />

            <Card.Content>
              <TextInput
                testID="avatar-input"
                label="Avatar Image URL"
                value={inputUrl}
                onChangeText={setInputUrl}
                mode="outlined"
                left={<TextInput.Icon icon="image-outline" />}
                style={styles.input}
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={() => handleUpdateIcon(inputUrl)}
                loading={loading}
                disabled={!inputUrl || loading}
                style={styles.actionButton}
              >
                Set Custom Avatar
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Mensagens da tela. */}
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
  Estilos visuais da tela de perfil.
  Não alteram autenticação, atualização de usuário, senha, avatar ou companion.
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    marginBottom: 4,
  },
  profileCard: {
    borderRadius: 26,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 22,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  userIdText: {
    marginTop: 16,
    fontWeight: '800',
  },
  logoutButton: {
    marginTop: 18,
    borderRadius: 14,
  },
  input: {
    marginBottom: 14,
  },
  actionButton: {
    marginBottom: 16,
    borderRadius: 14,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  presetButton: {
    margin: 6,
    borderRadius: 18,
  },
  presetButtonContent: {
    width: 74,
    height: 74,
  },
});