import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { View } from 'react-native';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={{ flex: 1 }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="oauth-signin" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </LinearGradient>
    </View>
  );
}