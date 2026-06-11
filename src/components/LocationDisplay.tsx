import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ActivityIndicator, Text, Card } from 'react-native-paper';
import { useUserLocation } from '../hooks/useUserLocation';

export const LocationDisplay: React.FC = () => {
  const { location, accuracy, isAccuracySufficient, errorMsg, isLoading } = useUserLocation();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={[styles.card, isAccuracySufficient ? styles.successCard : styles.errorCard]}>
        <Card.Content>
          <Text variant="titleLarge">Location Details</Text>
          <Text variant="bodyMedium">Platform: {Platform.OS}</Text>

          {errorMsg ? (
            <Text variant="bodyLarge" style={styles.errorText}>
              {errorMsg}
            </Text>
          ) : (
            <>
              {location && (
                <>
                  <Text variant="bodyLarge">Latitude: {location.latitude}</Text>
                  <Text variant="bodyLarge">Longitude: {location.longitude}</Text>
                </>
              )}
              {accuracy !== null && (
                <Text variant="bodyLarge">Accuracy: {accuracy} meters</Text>
              )}
              <Text variant="bodyLarge" style={isAccuracySufficient ? styles.successText : styles.errorText}>
                Status: {isAccuracySufficient ? 'Sufficient Accuracy' : 'Insufficient Accuracy'}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  center: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 16,
  },
  successCard: {
    borderColor: 'green',
    borderWidth: 1,
  },
  errorCard: {
    borderColor: 'red',
    borderWidth: 1,
  },
  successText: {
    color: 'green',
    marginTop: 8,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    fontWeight: 'bold',
  },
});
