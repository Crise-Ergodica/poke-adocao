// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import RadarScreen from '../screens/RadarScreen';
import AddPokemonScreen from '../screens/AddPokemonScreen';
import ProcessesScreen from '../screens/ProcessesScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Ocultamos o header nativo para fazer o nosso customizado MD3
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: { 
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 8, // Sombra MD3
        },
      }}
    >
      <Tab.Screen 
        name="Radar"
        component={RadarScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="radar" color={color} size={26} />
        }}
      />
      <Tab.Screen 
        name="Adicionar" 
        component={AddPokemonScreen} 
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="plus" color={color} size={26} />
        }}
      />
      <Tab.Screen 
        name="Processos" 
        component={ProcessesScreen} 
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="check" color={color} size={26} />
        }}
      />
    </Tab.Navigator>
  );
}