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
            gestureEnabled: false,
            animation: 'none'
          }}
        >
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="oauth-signin" options={{ gestureEnabled: false }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="mentor-onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="role-selection" options={{ gestureEnabled: false }} />
          <Stack.Screen name="pending-approval" options={{ gestureEnabled: false }} />
        </Stack>
      </LinearGradient>
    </View>
  );
}