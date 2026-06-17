/**
 * Author: Aurora Drumond Costa Magalhães
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Card, Text, Button, Snackbar, List, useTheme, ActivityIndicator, Avatar, TextInput, Searchbar } from 'react-native-paper';
import { useAuth } from '../store/AuthContext';

export default function AdoptionBoardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { userId, token } = useAuth();

  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPokemon, setSearchPokemon] = useState('');
  const [searchProvider, setSearchProvider] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

const fetchAdoptions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchPokemon) queryParams.append('pokemon_name', searchPokemon);
      if (searchProvider) queryParams.append('provider_name', searchProvider);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const API_URL = 'http://localhost:8000/api/v1/adoptions';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/available${queryString}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to fetch available adoptions');
      }

      const data = await response.json();
      setAdoptions(data || []);
    } catch (error: any) {
      showSnackbar(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAcceptAdoption = async (adoptionId: number) => {
    if (!token) return;
    try {
      const API_URL = 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/adoptions/${adoptionId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail || 'Failed to accept adoption');
      }

      showSnackbar("Adoption successful! Check your party.");
      fetchAdoptions();
    } catch (error: any) {
      showSnackbar(error.message);
    }
  };

  const handleSearch = () => {
    fetchAdoptions();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text variant="headlineMedium" style={styles.title}>Adoption Board</Text>

          <Card style={styles.card}>
            <Card.Title title="Search Filters" />
            <Card.Content>
              <View style={isDesktop ? styles.row : styles.column}>
                <Searchbar
                  placeholder="Pokemon Name"
                  value={searchPokemon}
                  onChangeText={setSearchPokemon}
                  style={[styles.input, isDesktop && { flex: 1, marginRight: 8 }]}
                />
                <Searchbar
                  placeholder="Trainer Name"
                  value={searchProvider}
                  onChangeText={setSearchProvider}
                  style={[styles.input, isDesktop && { flex: 1, marginLeft: 8 }]}
                />
              </View>
              <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
                Search
              </Button>
            </Card.Content>
          </Card>

          {loading ? (
            <ActivityIndicator animating={true} size="large" style={styles.loader} />
          ) : (
            <View style={isDesktop ? styles.grid : styles.column}>
              {adoptions.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>No adoptions available.</Text>
              ) : (
                adoptions.map((adoption, index) => (
                  <Card key={index} style={[styles.card, isDesktop && styles.gridItem]}>
                    <Card.Content>
                      <List.Item
                        title={`Pokemon Entity ID: ${adoption.pokemon_entity_id}`}
                        description={`Provider: ${adoption.provider_user_id || 'Unknown'}`}
                        left={props => <Avatar.Icon size={40} icon="pokeball" />}
                        right={props => (
                          <Button mode="contained" onPress={() => handleAcceptAdoption(adoption.id)}>
                            Adopt
                          </Button>
                        )}
                      />
                    </Card.Content>
                  </Card>
                ))
              )}
            </View>
          )}
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
  input: {
    marginBottom: 12,
  },
  searchButton: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  loader: {
    marginTop: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    width: 'calc(50% - 16px)',
    marginHorizontal: 8,
  }
});
