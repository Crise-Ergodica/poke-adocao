// Author: Aurora Drumond Costa Magalhães
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Card, Text, Button, Snackbar, List, useTheme, ActivityIndicator, Avatar } from 'react-native-paper';
import { useUserLocation } from '../hooks/useUserLocation';
import { getNearby } from '../services/pokemonService';
import { initiateAdoption, finalizeAdoption } from '../services/adoptionService';
import { useAuth } from '../store/AuthContext';

export default function RadarScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { userId, token } = useAuth();
  const { location, isAccuracySufficient, errorMsg, isLoading } = useUserLocation();
  const [nearbyPokemon, setNearbyPokemon] = useState<any[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loadingRadar, setLoadingRadar] = useState(false);

  const fetchNearby = async () => {
    if (location && isAccuracySufficient) {
      setLoadingRadar(true);
      try {
        const data = await getNearby(location.latitude, location.longitude, token);
        setNearbyPokemon(data.pokemon || []);
        setNearbyUsers(data.users || []);
      } catch (error: any) {
        showSnackbar(error.message);
      } finally {
        setLoadingRadar(false);
      }
    }
  };

  useEffect(() => {
    fetchNearby();
    const interval = setInterval(fetchNearby, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [location, isAccuracySufficient]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAdopt = async (pokemonEntityId: number) => {
    if (!userId || !token) {
      showSnackbar("Authentication error. User ID or token not found.");
      return;
    }

    try {
      const adoption = await initiateAdoption(pokemonEntityId, userId, token);
      await finalizeAdoption(adoption.id, token);
      showSnackbar("Pokemon adopted successfully!");
      fetchNearby(); // Refresh lists
    } catch (error: any) {
      showSnackbar(error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (errorMsg || !isAccuracySufficient) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, textAlign: 'center', padding: 20 }}>
          {errorMsg || "Accuracy insufficient. Please ensure accuracy <= 50m."}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text variant="headlineMedium" style={styles.title}>Proximity Radar</Text>

          {loadingRadar && <ActivityIndicator animating={true} style={styles.loader} />}

          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <Card style={[styles.card, { flex: isDesktop ? 1 : undefined }]}>
              <Card.Title title="Wild Pokemon Nearby" />
              <Card.Content>
                {nearbyPokemon.length === 0 ? (
                  <Text>No Pokemon nearby.</Text>
                ) : (
                  nearbyPokemon.map((pokemon, index) => (
                    <List.Item
                      key={index}
                      title={`Pokemon ID: ${pokemon.pokemon_id}`}
                      description={`Lat: ${pokemon.latitude.toFixed(4)}, Lon: ${pokemon.longitude.toFixed(4)}`}
                      left={props => (
                        pokemon.sprite_url ?
                        <Avatar.Image size={40} source={{ uri: pokemon.sprite_url }} style={{backgroundColor: 'transparent'}} /> :
                        <Avatar.Icon size={40} icon="help" />
                      )}
                      right={props => (
                        <Button mode="contained" onPress={() => handleAdopt(pokemon.id)}>
                          Acolher
                        </Button>
                      )}
                    />
                  ))
                )}
              </Card.Content>
            </Card>

            <Card style={[styles.card, { flex: isDesktop ? 1 : undefined }]}>
              <Card.Title title="Nearby Trainers" />
              <Card.Content>
                {nearbyUsers.length === 0 ? (
                  <Text>No trainers nearby.</Text>
                ) : (
                  nearbyUsers.map((user, index) => (
                    <List.Item
                      key={index}
                      title={`Trainer: ${user.user_id}`}
                      description={`Lat: ${user.latitude.toFixed(4)}, Lon: ${user.longitude.toFixed(4)}`}
                      left={props => (
                        user.icon_url ?
                        <Avatar.Image size={40} source={{ uri: user.icon_url }} /> :
                        <Avatar.Icon size={40} icon="account" />
                      )}
                    />
                  ))
                )}
              </Card.Content>
            </Card>
          </View>
        </View>
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
  contentWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  loader: {
    marginBottom: 16,
  }
});
