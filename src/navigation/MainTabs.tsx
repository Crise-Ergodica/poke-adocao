// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import RadarScreen from '../screens/RadarScreen';
import PartyScreen from '../screens/PartyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdoptionBoardScreen from '../screens/AdoptionBoardScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      id={undefined}
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
        name="Party"
        component={PartyScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pokeball" color={color} size={26} />
        }}
      />

      <Tab.Screen
        name="Board"
        component={AdoptionBoardScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="format-list-bulleted" color={color} size={26} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" color={color} size={26} />
        }}
      />
    </Tab.Navigator>
  );
}