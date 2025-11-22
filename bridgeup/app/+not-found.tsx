import { Link, Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CURRENT_VERTICAL } from '../config/current-vertical';

export default function NotFoundScreen() {
  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/auth');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={CURRENT_VERTICAL.gradientColors}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🫥</Text>
          <Text style={styles.title}>oops! this screen doesn't exist</Text>
          <Text style={styles.subtitle}>
            looks like you took a wrong turn somewhere
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGoHome}
          >
            <LinearGradient
              colors={['#FFFFFF', CURRENT_VERTICAL.lightColor]}
              style={styles.buttonGradient}
            >
              <Ionicons name="home-outline" size={20} color={CURRENT_VERTICAL.primaryColor} />
              <Text style={styles.buttonText}>go to home screen</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'lowercase',
  },
  button: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: CURRENT_VERTICAL.primaryColor,
    textTransform: 'lowercase',
  },
});
