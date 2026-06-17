// Author: Aurora Drumond Costa Magalhães
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Image, useWindowDimensions } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator, Button, Portal, Modal, TouchableRipple, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { returnPokemon } from '../services/adoptionService';

const API_URL = 'http://localhost:8000/api/v1';

interface UserPokemon {
  id: number;
  pokemon_id: number;
  name?: string;
}

export default function PartyScreen() {
  const { width } = useWindowDimensions();
  const numCols = width > 1000 ? 6 : width > 768 ? 3 : 2;
  const { userId, token } = useAuth();
  const theme = useTheme();
  const [party, setParty] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [selectedPokemon, setSelectedPokemon] = useState<UserPokemon | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showModal = (pokemon: UserPokemon) => {
    setSelectedPokemon(pokemon);
    setModalVisible(true);
  };
  const hideModal = () => setModalVisible(false);

  const handleListForAdoption = async () => {
    if (!selectedPokemon || !token) return;
    try {
      const response = await fetch(`${API_URL}/users/pokemon/${selectedPokemon.id}/list_for_adoption`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setSnackbarMessage("Pokemon listed for adoption!");
        setSnackbarVisible(true);
        hideModal();
        await fetchParty();
      } else {
        const err = await response.json();
        console.error("Failed to list for adoption:", err);
      }
    } catch (error) {
      console.error("Error listing pokemon for adoption:", error);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      fetchParty();
    }, [userId])
  );

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

  const slots = Array.from({ length: 6 }).map((_, index) => party[index] || null);

  const renderItem = ({ item, index }: { item: UserPokemon | null; index: number }) => {
    return (
      <Surface style={[styles.slot, { backgroundColor: theme.colors.surfaceVariant, flex: 1 / numCols, margin: 8 }]} elevation={2}>
        {item ? (
          <TouchableRipple onPress={() => showModal(item)} style={styles.pokemonContainer}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Image
                source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png` }}
                style={styles.sprite}
              />
              <Text variant="bodyMedium" style={styles.pokemonIdLabel}>
                ID: {item.pokemon_id}
              </Text>
            </View>
          </TouchableRipple>
        ) : (
          <View style={styles.emptySlot}>
            <MaterialCommunityIcons name="help-circle-outline" size={40} color={theme.colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Empty Slot</Text>
          </View>
        )}
      </Surface>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>Your Party</Text>
      <FlatList
        key={numCols}
        data={slots}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={numCols}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
      />

      <Portal>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {selectedPokemon && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.pokemon_id}.png` }}
                style={styles.modalSprite}
              />
              <Text variant="titleLarge" style={styles.modalTitle}>
                {selectedPokemon.name || `Pokemon ${selectedPokemon.pokemon_id}`}
              </Text>
              <Text variant="bodyMedium">ID: {selectedPokemon.pokemon_id}</Text>

              <View style={styles.modalActions}>
                <Button mode="contained" onPress={() => console.log('Ver Status')} style={styles.modalButton}>
                  Ver Status
                </Button>
                <Button mode="contained" onPress={() => console.log('Renomear')} style={styles.modalButton}>
                  Renomear
                </Button>
                <Button mode="contained" onPress={handleListForAdoption} style={styles.modalButton}>
                  Colocar para Adoção
                </Button>
                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  style={[styles.modalButton, { borderColor: theme.colors.error }]}
                  onPress={async () => {
                    await handleReturn(selectedPokemon.id);
                    hideModal();
                  }}
                  loading={returningId === selectedPokemon.id}
                  disabled={returningId === selectedPokemon.id}
                >
                  Abandonar
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'flex-start',
  },
  slot: {
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pokemonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingVertical: 8,
  },
  sprite: {
    width: '50%',
    height: '50%',
  },
  pokemonIdLabel: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalSprite: {
    width: 150,
    height: 150,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  modalActions: {
    marginTop: 16,
    width: '100%',
  },
  modalButton: {
    marginBottom: 8,
  },
});
