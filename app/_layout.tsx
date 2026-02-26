import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider as RNKeyboardProvider } from '@/lib/native-modules';
import { useColorScheme } from '@/hooks/useColorScheme';
import { isExpoGo } from '@/lib/native-modules';

// Safe KeyboardProvider - uses native module in dev build, no-op in Expo Go
const SafeKeyboardProvider = ({ children }: { children: React.ReactNode }) => {
  if (RNKeyboardProvider) {
    return <RNKeyboardProvider>{children}</RNKeyboardProvider>;
  }
  return <>{children}</>;
};

// Prevent the splash screen from auto-hiding before fonts are loaded.
// Skip in Expo Go where the native splash screen isn't registered.
if (!isExpoGo) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

/**
 * ErrorBoundary fallback UI
 */
function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.emoji}>:(</Text>
      <Text style={errorStyles.title}>Something went wrong</Text>
      <Text style={errorStyles.message}>{error.message}</Text>
      <TouchableOpacity style={errorStyles.button} onPress={retry}>
        <Text style={errorStyles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 48, color: '#fff', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  message: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#6366f1', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          retry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    // Add more fonts here as needed:
    // PlayfairDisplay_400Regular,
    // Montserrat_400Regular,
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded && !isExpoGo) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
    },
  };

  const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
    },
  };

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background }}>
        <SafeKeyboardProvider>
          <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
            {/* Add your context providers here as your app grows:
                <AuthProvider>
                  <SubscriptionProvider>
                    ... */}
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Add more screens as you build:
                  <Stack.Screen name="profile" options={{ headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerShown: false }} /> */}
            </Stack>
            <StatusBar
              style={colorScheme === 'dark' ? 'light' : 'dark'}
              backgroundColor={colorScheme === 'dark' ? Colors.dark.background : Colors.light.background}
            />
          </ThemeProvider>
        </SafeKeyboardProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
