import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WizzmoIntroCard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Wizzmo</Text>
      <Text style={styles.subtitle}>Connect with college mentors for advice</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FF4DB8',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
  },
});