// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../store/AuthContext';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { userId } = useAuth();
  const isAuthenticated = !!userId;

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