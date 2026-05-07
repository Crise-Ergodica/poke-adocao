import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function AddPokemonScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.onSurface }}>Tela de Login</Text>
    </View>
  );
}