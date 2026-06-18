import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Chip,
  Searchbar,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAvailableAdoptions, acceptAdoption } from '../services/adoptionService';
import { useAuth } from '../store/AuthContext';

const POKEMON_TYPES = [
  'Fogo', 'Água', 'Planta', 'Elétrico', 'Gelo', 'Lutador', 'Veneno', 'Terra', 'Voador',
  'Psíquico', 'Inseto', 'Pedra', 'Fantasma', 'Dragão', 'Sombrio', 'Metálico', 'Fada', 'Normal',
];

const genderMap: Record<string, string> = {
  Macho: 'male',
  Fêmea: 'female',
  'Sem Gênero': 'genderless',
};

export default function AdoptionBoardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { token } = useAuth();

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

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const fetchAdoptions = async () => {
    setLoading(true);
    try {
      const data = await getAvailableAdoptions(
        {
          pokemon_name: searchPokemon,
          provider_name: searchProvider,
          type: selectedType,
          isShiny: isShiny ? true : undefined,
          gender: gender !== 'Todos' ? genderMap[gender] : undefined,
        },
        token,
      );
      setAdoptions(data || []);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch available adoptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const handleAcceptAdoption = async (adoptionId: number) => {
    if (!token) return;
    try {
      await acceptAdoption(adoptionId, token);
      showSnackbar('Adoção bem-sucedida! Verifique a sua Party.');
      fetchAdoptions();
    } catch (error: any) {
      showSnackbar(error.message || 'Falha ao adotar Pokémon.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              Conselho de Adoção
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Encontre Pokémon disponíveis e filtros para treinador, tipo, gênero ou brilhante.
            </Text>
          </View>

          <Card mode="elevated" style={styles.filterCard}>
            <Card.Content>
              <View style={isDesktop ? styles.searchRow : styles.searchColumn}>
                <Searchbar
                  placeholder="Nome do Pokémon"
                  value={searchPokemon}
                  onChangeText={setSearchPokemon}
                  style={[styles.searchInput, isDesktop && styles.searchInputDesktop]}
                />
                <Searchbar
                  placeholder="Nome do treinador"
                  value={searchProvider}
                  onChangeText={setSearchProvider}
                  style={[styles.searchInput, isDesktop && styles.searchInputDesktop]}
                />
              </View>

              <Button
                mode="outlined"
                icon={showAdvancedFilters ? 'chevron-up' : 'tune-variant'}
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={styles.advancedButton}
              >
                {showAdvancedFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}
              </Button>

              {showAdvancedFilters && (
                <View style={[styles.advancedFiltersContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={styles.filterRow}>
                    <View>
                      <Text variant="titleSmall">Apenas brilhantes</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Mostra apenas Pokémon raros
                      </Text>
                    </View>
                    <Switch value={isShiny} onValueChange={setIsShiny} />
                  </View>

                  <Text variant="titleSmall" style={styles.filterLabel}>Gênero</Text>
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

                  <Text variant="titleSmall" style={styles.filterLabel}>Tipos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typesContainer}>
                    {POKEMON_TYPES.map((type) => (
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

              <Button mode="contained" icon="magnify" onPress={fetchAdoptions} style={styles.searchButton} contentStyle={styles.searchButtonContent}>
                Aplicar filtros
              </Button>
            </Card.Content>
          </Card>

          {loading ? (
            <ActivityIndicator animating size="large" style={styles.loader} />
          ) : (
            <View style={isDesktop ? styles.grid : styles.column}>
              {adoptions.length === 0 ? (
                <Card mode="contained" style={styles.emptyCard}>
                  <Card.Content style={styles.emptyContent}>
                    <Avatar.Icon size={54} icon="pokeball" />
                    <Text variant="titleMedium" style={styles.emptyTitle}>Nenhuma adoção disponível.</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                      Tente remover algum filtro ou buscar por outro Pokémon.
                    </Text>
                  </Card.Content>
                </Card>
              ) : (
                adoptions.map((adoption, index) => {
                  const pokemonName = adoption.pokemon?.name || `Pokémon #${adoption.pokemon?.pokemon_id || adoption.pokemon_entity_id}`;
                  const spriteUrl = adoption.pokemon?.sprite_url;

                  return (
                    <Card key={adoption.id ?? index} mode="elevated" style={[styles.adoptionCard, isDesktop && styles.gridItem]}>
                      <Card.Content>
                        <View style={styles.adoptionHeader}>
                          {spriteUrl ? (
                            <Avatar.Image size={48} source={{ uri: spriteUrl }} style={{ backgroundColor: 'transparent' }} />
                          ) : (
                            <Avatar.Icon size={48} icon="pokeball" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
                          )}

                          <View style={styles.adoptionTitleBlock}>
                            <Text variant="titleMedium" style={styles.cardTitle}>{pokemonName}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                              Entidade: {adoption.pokemon_entity_id}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                              Doador: {adoption.provider_user_id || 'Desconhecido'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          {adoption.pokemon?.is_shiny && (
                            <Chip compact icon="star-four-points" style={styles.metaChip}>SHINY</Chip>
                          )}
                          {adoption.pokemon?.type_1 && (
                            <Chip compact style={styles.metaChip}>{adoption.pokemon.type_1}</Chip>
                          )}
                          {adoption.pokemon?.type_2 && (
                            <Chip compact style={styles.metaChip}>{adoption.pokemon.type_2}</Chip>
                          )}
                          {adoption.pokemon?.gender && (
                            <Chip compact style={styles.metaChip}>{adoption.pokemon.gender}</Chip>
                          )}
                        </View>

                        <Button mode="contained" icon="heart-plus-outline" onPress={() => handleAcceptAdoption(adoption.id)} style={styles.adoptButton}>
                          Adotar
                        </Button>
                      </Card.Content>
                    </Card>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  contentWrapper: { maxWidth: 1180, alignSelf: 'center', width: '100%' },
  header: { marginBottom: 16 },
  title: { fontWeight: '800', marginBottom: 4 },
  filterCard: { borderRadius: 24, marginBottom: 18 },
  searchRow: { flexDirection: 'row', marginHorizontal: -6 },
  searchColumn: { flexDirection: 'column' },
  searchInput: { marginBottom: 12 },
  searchInputDesktop: { flex: 1, marginHorizontal: 6 },
  advancedButton: { alignSelf: 'flex-start', marginBottom: 12, borderRadius: 14 },
  advancedFiltersContainer: { borderRadius: 18, padding: 14, marginBottom: 14 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterLabel: { marginTop: 16, marginBottom: 8 },
  typesContainer: { paddingBottom: 4 },
  chip: { marginRight: 8 },
  searchButton: { borderRadius: 16 },
  searchButtonContent: { paddingVertical: 6 },
  loader: { marginTop: 32 },
  column: { flexDirection: 'column' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  gridItem: { width: '48%', marginHorizontal: 8 },
  adoptionCard: { marginBottom: 16, borderRadius: 22 },
  adoptionHeader: { flexDirection: 'row', alignItems: 'center' },
  adoptionTitleBlock: { flex: 1, marginLeft: 12 },
  cardTitle: { fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginHorizontal: -4 },
  metaChip: { marginHorizontal: 4, marginBottom: 8 },
  adoptButton: { marginTop: 8, borderRadius: 14 },
  emptyCard: { borderRadius: 24 },
  emptyContent: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { marginTop: 12, marginBottom: 4, fontWeight: '700' },
});