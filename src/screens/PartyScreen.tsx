import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Modal,
  Portal,
  Snackbar,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { returnPokemon } from '../services/adoptionService';
import { useAuth } from '../store/AuthContext';

/*
  Endpoint original usado pela tela.
  Mantido aqui para preservar o comportamento atual do projeto.
*/
const API_URL = 'http://localhost:8000/api/v1';

/*
  Interface básica do Pokemon do usuário.
  Mantém os campos usados pela tela original.
*/
interface UserPokemon {
  id: number;
  pokemon_id: number;
  name?: string;
}

export default function PartyScreen() {
  const { width } = useWindowDimensions();

  /*
    Layout responsivo:
    - telas grandes: 6 colunas
    - tablets ou web menor: 3 colunas
    - celular: 2 colunas
  */
  const numCols = width > 1000 ? 6 : width > 768 ? 3 : 2;

  const { userId, token } = useAuth();
  const theme = useTheme();

  // Lista de Pokemon na party do usuário.
  const [party, setParty] = useState<UserPokemon[]>([]);

  // Estados de carregamento e ações.
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);

  // Pokemon selecionado no modal.
  const [selectedPokemon, setSelectedPokemon] = useState<UserPokemon | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Snackbar para mensagens visuais.
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Abre o modal com as ações do Pokemon selecionado.
  const showModal = (pokemon: UserPokemon) => {
    setSelectedPokemon(pokemon);
    setModalVisible(true);
  };

  const hideModal = () => setModalVisible(false);

  /*
    Busca a party do usuário.
    Mantém o endpoint original: /users/{userId}
  */
  const fetchParty = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_URL}/users/${userId}`);

      if (response.ok) {
        const data = await response.json();
        setParty(data.party || []);
      }
    } catch (error) {
      console.error('Failed to fetch party', error);
    } finally {
      setLoading(false);
    }
  };

  /*
    Atualiza a party sempre que a tela ganha foco.
    Mantém a lógica original baseada em useFocusEffect.
  */
  useFocusEffect(
    useCallback(() => {
      fetchParty();
    }, [userId]),
  );

  /*
    Coloca o Pokemon selecionado para adoção.
    Mantém a chamada original para list_for_adoption.
  */
  const handleListForAdoption = async () => {
    if (!selectedPokemon || !token) return;

    try {
      const response = await fetch(`${API_URL}/users/pokemon/${selectedPokemon.id}/list_for_adoption`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showSnackbar('Pokemon listed for adoption!');
        hideModal();
        await fetchParty();
      } else {
        const err = await response.json();
        console.error('Failed to list for adoption:', err);
      }
    } catch (error) {
      console.error('Error listing pokemon for adoption:', error);
    }
  };

  /*
    Devolve/remove Pokemon usando o serviço original returnPokemon.
  */
  const handleReturn = async (pokemonEntityId: number) => {
    if (!token) return;

    setReturningId(pokemonEntityId);

    try {
      await returnPokemon(pokemonEntityId, token);
      await fetchParty();
    } catch (error) {
      console.error('Failed to return pokemon', error);
    } finally {
      setReturningId(null);
    }
  };

  /*
    A party sempre mostra 6 slots.
    Quando não houver Pokemon em determinada posição, exibe slot vazio.
  */
  const slots = Array.from({ length: 6 }).map((_, index) => party[index] || null);

  /*
    Renderiza cada slot da party.
    Se houver Pokemon, exibe sprite e abre modal ao clicar.
    Se estiver vazio, exibe indicador de slot vazio.
  */
  const renderItem = ({ item, index }: { item: UserPokemon | null; index: number }) => (
    <Surface
      style={[
        styles.slot,
        {
          backgroundColor: item ? theme.colors.surface : theme.colors.surfaceVariant,
          flex: 1 / numCols,
        },
      ]}
      elevation={2}
    >
      {item ? (
        <TouchableRipple onPress={() => showModal(item)} style={styles.pokemonContainer}>
          <View style={styles.pokemonContent}>
            <Image
              source={{
                uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png`,
              }}
              style={styles.sprite}
            />

            <Text variant="titleSmall" style={styles.pokemonIdLabel}>
              {item.name ? item.name : `Pokémon ${item.pokemon_id}`}
            </Text>
          </View>
        </TouchableRipple>
      ) : (
        <View style={styles.emptySlot}>
          <MaterialCommunityIcons
            name="help-circle-outline"
            size={40}
            color={theme.colors.onSurfaceVariant}
          />

          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Empty Slot
          </Text>
        </View>
      )}
    </Surface>
  );

  /*
    Tela de carregamento enquanto busca a party.
  */
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Cabeçalho com quantidade de slots preenchidos. */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Your Party
        </Text>

        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {party.length}/6 slots preenchidos
        </Text>
      </View>

      {/* Grade responsiva dos 6 slots. */}
      <FlatList
        key={numCols}
        data={slots}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={numCols}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
      />

      {/* Modal de ações do Pokemon selecionado. */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {selectedPokemon && (
            <View style={styles.modalContent}>
              <View style={[styles.modalSpriteWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                <Image
                  source={{
                    uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.pokemon_id}.png`,
                  }}
                  style={styles.modalSprite}
                />
              </View>

              <Text variant="titleLarge" style={styles.modalTitle}>
                {selectedPokemon.name || `Pokemon ${selectedPokemon.pokemon_id}`}
              </Text>

              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                ID: {selectedPokemon.pokemon_id}
              </Text>

              <View style={styles.modalActions}>
                {/* Botões mantidos como estavam, sem implementar lógica nova. */}
                <Button
                  mode="contained-tonal"
                  onPress={() => console.log('Ver Status')}
                  style={styles.modalButton}
                >
                  Ver Status
                </Button>

                <Button
                  mode="contained-tonal"
                  onPress={() => console.log('Renomear')}
                  style={styles.modalButton}
                >
                  Renomear
                </Button>

                <Button
                  mode="contained"
                  onPress={handleListForAdoption}
                  style={styles.modalButton}
                >
                  Colocar para Adoção
                </Button>

                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  style={[styles.modalButton, { borderColor: theme.colors.error }]}
                  loading={returningId === selectedPokemon.id}
                  onPress={async () => {
                    await handleReturn(selectedPokemon.id);
                    hideModal();
                  }}
                >
                  Return Pokemon
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Mensagens visuais da tela. */}
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
  Estilos visuais da party.
  Não alteram regra de party, quantidade de slots ou chamadas de API.
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'center',
  },
  slot: {
    minHeight: 150,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  pokemonContainer: {
    flex: 1,
  },
  pokemonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  sprite: {
    width: 92,
    height: 92,
  },
  pokemonIdLabel: {
    marginTop: 8,
    fontWeight: '800',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    margin: 20,
    padding: 22,
    borderRadius: 28,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalSpriteWrapper: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalSprite: {
    width: 128,
    height: 128,
  },
  modalTitle: {
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    marginBottom: 10,
    borderRadius: 14,
  },
});