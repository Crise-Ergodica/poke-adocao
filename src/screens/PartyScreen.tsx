// Author: Aurora Drumond Costa Magalhães
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8000/api/v1';

interface UserPokemon {
  id: number;
  pokemon_id: number;
}

export default function PartyScreen() {
  const { userId } = useAuth();
  const theme = useTheme();
  const [party, setParty] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchParty();
  }, [userId]);

  const slots = Array.from({ length: 6 }).map((_, index) => party[index] || null);

  const renderItem = ({ item, index }: { item: UserPokemon | null; index: number }) => {
    return (
      <Surface style={[styles.slot, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
        {item ? (
          <Image
            source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png` }}
            style={styles.sprite}
          />
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
        data={slots}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={2}
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  slot: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sprite: {
    width: '80%',
    height: '80%',
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
