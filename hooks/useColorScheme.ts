import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

/**
 * Custom useColorScheme that listens to Appearance changes directly.
 * React Native's built-in useColorScheme can be sluggish in modals
 * and certain component trees. This version uses Appearance.addChangeListener
 * for immediate updates.
 */
export function useColorScheme(): ColorSchemeName {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      setColorScheme(newScheme);
    });
    return () => subscription.remove();
  }, []);

  return colorScheme;
}
