import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';

export default function DemoScreen() {
  const colors = Colors.dark;

  const openWizzmoDemo = () => {
    Linking.openURL('https://wizzmo.app');
  };

  const openBridgeUpLanding = () => {
    Linking.openURL('https://bridgeup.app');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Demo</Text>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Text style={styles.logoText}>bridgeup</Text>
              <Text style={styles.subtitle}>
                college admissions advice from verified mentors
              </Text>
            </View>

            {/* Demo Options */}
            <View style={styles.demoSection}>
              <Text style={styles.sectionTitle}>Live Demos</Text>
              
              <TouchableOpacity
                style={styles.demoButton}
                onPress={openWizzmoDemo}
                activeOpacity={0.8}
              >
                <View style={styles.demoButtonContent}>
                  <Ionicons name="rocket" size={24} color="#FF4DB8" />
                  <View style={styles.demoTextContainer}>
                    <Text style={styles.demoTitle}>Wizzmo (Live App)</Text>
                    <Text style={styles.demoDescription}>
                      See the fully working app with real mentors and students
                    </Text>
                  </View>
                  <Ionicons name="external-link" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoButton}
                onPress={openBridgeUpLanding}
                activeOpacity={0.8}
              >
                <View style={styles.demoButtonContent}>
                  <Ionicons name="globe" size={24} color="#FF4DB8" />
                  <View style={styles.demoTextContainer}>
                    <Text style={styles.demoTitle}>BridgeUp Landing</Text>
                    <Text style={styles.demoDescription}>
                      Visit the BridgeUp marketing site and mentor application
                    </Text>
                  </View>
                  <Ionicons name="external-link" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>Development Status</Text>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statusText}>Database schema replicated</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statusText}>Mentor profiles & expertise system</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statusText}>Real-time messaging</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="construct" size={20} color="#FF9800" />
                <Text style={styles.statusText}>OAuth authentication (in progress)</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4DB8',
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  demoSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  demoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  demoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  demoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    flex: 1,
  },
});