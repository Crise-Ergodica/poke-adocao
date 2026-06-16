// Author: Aurora Drumond Costa Magalhães
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, useWindowDimensions } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { returnPokemon } from '../services/adoptionService';

const API_URL = 'http://localhost:8000/api/v1';

interface UserPokemon {
  id: number;
  pokemon_id: number;
}

export default function PartyScreen() {
  const { userId, token } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [party, setParty] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const isDesktop = width > 768;

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

  useEffect(() => {
    fetchParty();
  }, [userId]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleReturn = async (pokemonEntityId: number) => {
    if (!token) {
      showSnackbar("Authentication error. Token not found.");
      return;
    }

    try {
      await returnPokemon(pokemonEntityId, token);
      showSnackbar("Pokemon returned successfully!");
      fetchParty(); // Refresh list
    } catch (error: any) {
      showSnackbar(error.message);
    }
  };

  const slots = Array.from({ length: 6 }).map((_, index) => party[index] || null);

  const renderItem = ({ item, index }: { item: UserPokemon | null; index: number }) => {
    return (
      <View style={isDesktop ? styles.desktopSlotWrapper : styles.mobileSlotWrapper}>
        <Surface style={[styles.slot, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
          {item ? (
            <View style={styles.itemContent}>
              <Image
                source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png` }}
                style={styles.sprite}
              />
              <Button
                mode="outlined"
                onPress={() => handleReturn(item.id)}
                style={styles.returnButton}
                labelStyle={styles.returnButtonLabel}
              >
                Return to Adoption
              </Button>
            </View>
          ) : (
            <View style={styles.emptySlot}>
              <MaterialCommunityIcons name="help-circle-outline" size={40} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Empty Slot</Text>
            </View>
          )}
        </Surface>
      </View>
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
      <View style={[styles.contentWrapper, isDesktop && styles.desktopContainer]}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>Your Party</Text>
        <FlatList
          key={isDesktop ? 'desktop' : 'mobile'}
          data={slots}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          numColumns={isDesktop ? 3 : 2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
        />
      </View>
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
  contentWrapper: {
    flex: 1,
  },
  desktopContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mobileSlotWrapper: {
    width: '48%',
  },
  desktopSlotWrapper: {
    width: '31%',
  },
  slot: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  sprite: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  },
  returnButton: {
    marginTop: 8,
    width: '100%',
  },
  returnButtonLabel: {
    fontSize: 10,
    marginHorizontal: 4,
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
