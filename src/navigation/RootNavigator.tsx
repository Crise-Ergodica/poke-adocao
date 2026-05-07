// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  // Estado provisório para desenvolvimento. 
  // Na Etapa 4, substituiremos isso pelo estado global do Zustand.
  const isAuthenticated = false; 

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}