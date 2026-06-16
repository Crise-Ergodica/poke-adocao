// Author: Aurora Drumond Costa Magalhães
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, useWindowDimensions } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator, Button } from 'react-native-paper';
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
  const { width } = useWindowDimensions();
  const numCols = width > 1000 ? 6 : width > 768 ? 3 : 2;
  const { userId, token } = useAuth();
  const theme = useTheme();
  const [party, setParty] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);

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
          <View style={styles.pokemonContainer}>
            <Image
              source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png` }}
              style={styles.sprite}
            />
            <Button
              mode="outlined"
              onPress={() => handleReturn(item.id)}
              loading={returningId === item.id}
              disabled={returningId === item.id}
              style={styles.returnButton}
            >
              Devolver
            </Button>
          </View>
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pokemonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  sprite: {
    width: '60%',
    height: '60%',
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButton: {
    marginTop: 8,
  },
});
