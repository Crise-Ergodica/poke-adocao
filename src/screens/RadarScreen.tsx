// Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import {
  Card,
  Text,
  Button,
  Snackbar,
  List,
  useTheme,
  ActivityIndicator,
  Avatar,
} from 'react-native-paper';
import { useUserLocation } from '../hooks/useUserLocation';
import { initiateAdoption, finalizeAdoption } from '../services/adoptionService';
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getNearby, spawnPokemon } from '../services/pokemonService';

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RadarScreen() {
  const navigation = useNavigation<any>();
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
  const fetchNearby = useCallback(async () => {
    if (!location || !isAccuracySufficient || !token) return;

    setLoadingRadar(true);
    try {
      const data = await getNearby(location.latitude, location.longitude, token);

      const pokemonList = data.pokemon || [];

      if (pokemonList.length === 0) {
        await spawnPokemon(location.latitude, location.longitude, token);

        const refreshedData = await getNearby(location.latitude, location.longitude, token);
        setNearbyPokemon(refreshedData.pokemon || []);
      } else {
        setNearbyPokemon(pokemonList);
      }

      setNearbyUsers(data.users || []);
    } catch (error: any) {
      showSnackbar(error.message || 'Erro ao atualizar radar.');
    } finally {
      setLoadingRadar(false);
    }
  }, [location, isAccuracySufficient, token]);

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
      showSnackbar('Authentication error. User ID or token not found.');
      return;
    }

    try {
      const adoption = await initiateAdoption(pokemonEntityId, userId, token);
      await finalizeAdoption(adoption.id, token);
      showSnackbar('Pokemon adopted successfully!');
      fetchNearby(); // Refresh lists
      navigation.navigate('Party');
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
          {errorMsg || 'Accuracy insufficient. Please ensure accuracy <= 50m.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text variant="headlineMedium" style={styles.title}>
            Proximity Radar
          </Text>

          {loadingRadar && <ActivityIndicator animating={true} style={styles.loader} />}

          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <View style={{ flex: isDesktop ? 1 : undefined }}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Wild Pokemon Nearby
              </Text>
              {nearbyPokemon.length === 0 ? (
                <Text style={styles.emptyText}>No Pokemon nearby.</Text>
              ) : (
                nearbyPokemon.map((pokemon, index) => {
                  const dist = location
                    ? getDistanceInMeters(
                        location.latitude,
                        location.longitude,
                        pokemon.latitude,
                        pokemon.longitude,
                      )
                    : Infinity;
                  const isTooFar = dist > 50;

                  return (
                    <Card key={index} style={styles.card} mode="elevated">
                      <Card.Title
                        title={isTooFar ? 'Unknown Signal' : `Pokemon ID: ${pokemon.pokemon_id}`}
                        titleVariant="titleMedium"
                        subtitle={`Lat: ${pokemon.latitude.toFixed(4)}, Lon: ${pokemon.longitude.toFixed(4)}`}
                        subtitleVariant="bodyMedium"
                        left={(props) =>
                          pokemon.sprite_url && !isTooFar ? (
                            <Avatar.Image
                              {...props}
                              source={{ uri: pokemon.sprite_url }}
                              style={{ backgroundColor: 'transparent' }}
                            />
                          ) : (
                            <Avatar.Icon {...props} icon="help" />
                          )
                        }
                        right={(props) => (
                          <Button
                            mode="contained"
                            onPress={() => handleAdopt(pokemon.id)}
                            style={styles.actionButton}
                            disabled={isTooFar}
                          >
                            {isTooFar ? 'Aproxime-se' : 'Acolher'}
                          </Button>
                        )}
                      />
                    </Card>
                  );
                })
              )}
            </View>

            <View style={{ flex: isDesktop ? 1 : undefined }}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Nearby Trainers
              </Text>
              {nearbyUsers.length === 0 ? (
                <Text style={styles.emptyText}>No trainers nearby.</Text>
              ) : (
                nearbyUsers.map((user, index) => (
                  <Card key={index} style={styles.card} mode="elevated">
                    <Card.Title
                      title={`Trainer: ${user.user_id}`}
                      titleVariant="titleMedium"
                      subtitle={`Lat: ${user.latitude.toFixed(4)}, Lon: ${user.longitude.toFixed(4)}`}
                      subtitleVariant="bodyMedium"
                      left={(props) =>
                        user.icon_url ? (
                          <Avatar.Image {...props} source={{ uri: user.icon_url }} />
                        ) : (
                          <Avatar.Icon {...props} icon="account" />
                        )
                      }
                    />
                  </Card>
                ))
              )}
            </View>
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  emptyText: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loader: {
    marginBottom: 16,
  },
  actionButton: {
    marginRight: 16,
  },
});
