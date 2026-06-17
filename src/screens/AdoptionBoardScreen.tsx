/**
 * Author: Aurora Drumond Costa Magalhães
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Card, Text, Button, Snackbar, List, useTheme, ActivityIndicator, Avatar, TextInput, Searchbar, Switch, SegmentedButtons, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { getAvailableAdoptions } from '../services/adoptionService';

export default function AdoptionBoardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { userId, token } = useAuth();

  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPokemon, setSearchPokemon] = useState('');
  const [searchProvider, setSearchProvider] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [gender, setGender] = useState('Todos');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const genderMap: Record<string, string> = { 'Macho': 'male', 'Fêmea': 'female', 'Sem Gênero': 'genderless' };

  const fetchAdoptions = async () => {
    setLoading(true);
    try {
      const data = await getAvailableAdoptions({
        pokemon_name: searchPokemon,
        provider_name: searchProvider,
        type: selectedType,
        isShiny: isShiny ? true : undefined,
        gender: gender !== 'Todos' ? genderMap[gender] : undefined,
      }, token);
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
              <Button mode="outlined" onPress={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ marginTop: 8, marginBottom: 8 }}>
                {showAdvancedFilters ? "Hide Advanced Filters" : "Filtros Avançados"}
              </Button>

              {showAdvancedFilters && (
                <View style={styles.advancedFiltersContainer}>
                  <View style={styles.filterRow}>
                    <Text variant="titleMedium" style={{ marginRight: 16 }}>Apenas Shiny</Text>
                    <Switch value={isShiny} onValueChange={setIsShiny} />
                  </View>

                  <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>Gender</Text>
                  <SegmentedButtons
                    value={gender}
                    onValueChange={setGender}
                    buttons={[
                      { value: 'Todos', label: 'Todos' },
                      { value: 'Macho', label: 'Macho' },
                      { value: 'Fêmea', label: 'Fêmea' },
                      { value: 'Sem Gênero', label: 'Sem Gênero' },
                    ]}
                  />

                  <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>Types</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesContainer}>
                    {['Fogo', 'Água', 'Planta', 'Elétrico', 'Gelo', 'Lutador', 'Veneno', 'Terra', 'Voador', 'Psíquico', 'Inseto', 'Pedra', 'Fantasma', 'Dragão', 'Sombrio', 'Metálico', 'Fada', 'Normal'].map(type => (
                      <Chip
                        key={type}
                        selected={selectedType === type}
                        onPress={() => setSelectedType(selectedType === type ? undefined : type)}
                        style={styles.chip}
                      >
                        {type}
                      </Chip>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
                Aplicar Filtros
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
                        description={() => (
                          <View>
                            <Text>Provider: {adoption.provider_user_id || 'Unknown'}</Text>
                            {adoption.pokemon?.is_shiny && (
                              <Text style={{ marginTop: 4, fontWeight: 'bold' }}>
                                <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" /> SHINY <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" />
                              </Text>
                            )}
                            {(adoption.pokemon?.type_1 || adoption.pokemon?.gender) && (
                              <Text style={{ marginTop: 4 }}>
                                {[adoption.pokemon?.type_1, adoption.pokemon?.gender].filter(Boolean).join(' | ')}
                              </Text>
                            )}
                          </View>
                        )}
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
  },
  advancedFiltersContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typesContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
  }
});
