import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, TextInput, Snackbar, useTheme, Avatar } from 'react-native-paper';
import { useAuth } from '../store/AuthContext';
import { updateIcon } from '../services/authService';

const STATIC_AVATARS = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { userId, iconUrl, setIconUrl, token } = useAuth();
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>Profile Settings</Text>

        <Card style={styles.card}>
          <Card.Content style={styles.centerContent}>
            <Text variant="titleMedium" style={styles.label}>Current Avatar</Text>
            {iconUrl ? (
              <Avatar.Image size={100} source={{ uri: iconUrl }} />
            ) : (
              <Avatar.Icon size={100} icon="account" />
            )}
            <Text variant="bodyLarge" style={styles.userIdText}>Trainer: {userId}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Choose a Preset Avatar" />
          <Card.Content>
            <View style={styles.presetContainer}>
              {STATIC_AVATARS.map((url, index) => (
                <Button
                  key={index}
                  onPress={() => handleUpdateIcon(url)}
                  disabled={loading}
                  style={styles.presetButton}
                >
                  <Avatar.Image size={50} source={{ uri: url }} style={{backgroundColor: 'transparent'}} />
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Or enter a custom URL" />
          <Card.Content>
            <TextInput
              label="Avatar Image URL"
              value={inputUrl}
              onChangeText={setInputUrl}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              testID="avatar-input"
            />
            <Button
              mode="contained"
              onPress={() => handleUpdateIcon(inputUrl)}
              loading={loading}
              disabled={!inputUrl || loading}
            >
              Set Custom Avatar
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
    padding: 16,
  },
  label: {
    marginBottom: 16,
  },
  userIdText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  presetButton: {
    margin: 4,
  },
  input: {
    marginBottom: 16,
  },
});
