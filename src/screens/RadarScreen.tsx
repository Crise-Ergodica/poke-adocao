import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { finalizeAdoption, initiateAdoption } from '../services/adoptionService';
import { getNearby, spawnPokemon } from '../services/pokemonService';
import { useAuth } from '../store/AuthContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { updateUserLocation } from '../services/locationService';

/*
  Calcula a distância aproximada em metros entre duas coordenadas.
  Essa função mantém a lógica original de proximidade usada no radar.
*/
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function RadarScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  /*
    Responsividade:
    em telas maiores, Pokemon e treinadores aparecem em colunas lado a lado.
    em telas menores, ficam um abaixo do outro.
  */
  const isDesktop = width > 768;

  const { userId, token } = useAuth();

  /*
    Hook original de localização do projeto.
    Mantém validação de precisão e mensagens de erro.
  */
  const { location, accuracy, isAccuracySufficient, errorMsg, isLoading } = useUserLocation();
  // Listas retornadas pelo radar.
  const [nearbyPokemon, setNearbyPokemon] = useState<any[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);

  // Estados visuais para mensagens e carregamento.
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loadingRadar, setLoadingRadar] = useState(false);

  // Exibe mensagens no rodapé da tela.
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  /*
    Busca Pokemon e treinadores próximos usando o serviço original.
    Caso não exista Pokemon próximo, mantém a lógica de spawn já usada.
  */
  const fetchNearby = useCallback(async () => {
    // Adicionada a validação do userId para garantir que temos os dados necessários
    if (!location || !isAccuracySufficient || !token || !userId) return;

    setLoadingRadar(true);

    try {
      await updateUserLocation(userId, location.latitude, location.longitude, accuracy ?? 10);

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
  }, [location, accuracy, isAccuracySufficient, token, userId]);

  /*
    Atualiza o radar ao abrir a tela e repete a busca a cada 15 segundos.
  */
  useEffect(() => {
    fetchNearby();

    const interval = setInterval(fetchNearby, 15000);

    return () => clearInterval(interval);
  }, [fetchNearby]);

  /*
    Fluxo de adoção:
    - inicia adoção
    - finaliza adoção
    - atualiza radar
    - navega para Party
  */
  const handleAdopt = async (pokemonEntityId: number) => {
    if (!userId || !token) {
      showSnackbar('Authentication error. User ID or token not found.');
      return;
    }

    try {
      const adoption = await initiateAdoption(pokemonEntityId, userId, token);
      await finalizeAdoption(adoption.id, token);

      showSnackbar('Pokemon adopted successfully!');
      fetchNearby();
      navigation.navigate('Party');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to adopt Pokemon');
    }
  };

  /*
    Estado de carregamento inicial da localização.
  */
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating size="large" />

        <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Localizando seu treinador...
        </Text>
      </SafeAreaView>
    );
  }

  /*
    Estado visual quando a localização falha ou a precisão não é suficiente.
  */
  if (errorMsg || !isAccuracySufficient) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Card mode="contained" style={styles.statusCard}>
          <Card.Content style={styles.centeredContent}>
            <Avatar.Icon size={58} icon="map-marker-alert-outline" />

            <Text variant="titleMedium" style={[styles.statusTitle, { color: theme.colors.error }]}>
              Radar indisponível
            </Text>

            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {errorMsg || 'Accuracy insufficient. Please ensure accuracy <= 50m.'}
            </Text>
          </Card.Content>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          {/* Cabeçalho da tela. */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              Proximity Radar
            </Text>

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Atualização automática a cada 15 segundos.
            </Text>
          </View>

          {/* Card com a localização atual do usuário. */}
          {location && (
            <Card mode="contained" style={[styles.locationCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Card.Content>
                <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  Sua localização
                </Text>

                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  Lat: {location.latitude.toFixed(4)} | Lon: {location.longitude.toFixed(4)}
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Indicador pequeno de atualização do radar. */}
          {loadingRadar && <ActivityIndicator animating style={styles.loader} />}

          <View style={isDesktop ? styles.desktopColumns : styles.mobileColumns}>
            {/* Coluna/lista de Pokemon próximos. */}
            <View style={styles.column}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Wild Pokemon Nearby
              </Text>

              {nearbyPokemon.length === 0 ? (
                <Card mode="contained" style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>No Pokemon nearby.</Text>
                  </Card.Content>
                </Card>
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

                  /*
                    Mantém a regra de distância:
                    se estiver a mais de 50 metros, não permite adoção.
                  */
                  const isTooFar = dist > 50;

                  return (
                    <Card key={pokemon.id ?? index} style={styles.card} mode="elevated">
                      <Card.Title
                        title={isTooFar ? 'Unknown Signal' : (pokemon.name ? pokemon.name : `Pokemon ${pokemon.pokemon_id}`)}
                
                        titleVariant="titleMedium"
                        subtitle={`Distância: ${Math.round(dist)}m`}
                        subtitleVariant="bodyMedium"
                        left={() =>
                          pokemon.sprite_url && !isTooFar ? (
                            <Avatar.Image
                              size={52}
                              source={{ uri: pokemon.sprite_url }}
                              style={{ backgroundColor: 'transparent' }}
                            />
                          ) : (
                            <Avatar.Icon 
                              size={52} 
                              icon="grass" 
                              color="#4CAF50" /* Hexadecimal para um verde vibrante estilo Pokémon */
                              style={{ backgroundColor: 'transparent' }} /* Fundo transparente para parecer natural */
                            />
                          )
                        }
                      />

                      <Card.Content>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Lat: {pokemon.latitude.toFixed(4)}, Lon: {pokemon.longitude.toFixed(4)}
                        </Text>

                        <Button
                          mode="contained"
                          icon={isTooFar ? 'map-marker-distance' : 'heart-plus-outline'}
                          onPress={() => handleAdopt(pokemon.id)}
                          style={styles.actionButton}
                          disabled={isTooFar}
                        >
                          {isTooFar ? 'Aproxime-se' : 'Acolher'}
                        </Button>
                      </Card.Content>
                    </Card>
                  );
                })
              )}
            </View>

            {/* Coluna/lista de treinadores próximos. */}
            <View style={styles.column}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Nearby Trainers
              </Text>

              {nearbyUsers.length === 0 ? (
                <Card mode="contained" style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>No trainers nearby.</Text>
                  </Card.Content>
                </Card>
              ) : (
                nearbyUsers.map((user, index) => (
                  <Card key={user.user_id ?? index} style={styles.card} mode="elevated">
                    <Card.Title
                      title={`Trainer: ${user.user_id}`}
                      titleVariant="titleMedium"
                      subtitle={`Lat: ${user.latitude.toFixed(4)}, Lon: ${user.longitude.toFixed(4)}`}
                      subtitleVariant="bodyMedium"
                      left={() =>
                        user.icon_url ? (
                          <Avatar.Image size={52} source={{ uri: user.icon_url }} />
                        ) : (
                          <Avatar.Icon size={52} icon="account" />
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

      {/* Mensagens de erro/sucesso da tela. */}
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
  Estilos visuais da tela Radar.
  Não alteram localização, atualização automática ou fluxo de adoção.
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centeredContent: {
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  contentWrapper: {
    maxWidth: 1180,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    marginBottom: 4,
  },
  locationCard: {
    borderRadius: 20,
    marginBottom: 16,
  },
  desktopColumns: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  mobileColumns: {
    flexDirection: 'column',
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '800',
  },
  card: {
    marginBottom: 14,
    borderRadius: 22,
  },
  emptyCard: {
    marginBottom: 16,
    borderRadius: 20,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 14,
    borderRadius: 14,
  },
  loadingText: {
    marginTop: 12,
  },
  statusCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
  },
  statusTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '800',
  },
});