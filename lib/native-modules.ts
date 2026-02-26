/**
 * Native Modules - Safe imports for native-only modules
 *
 * This module provides safe access to native modules that are only available
 * in development builds, not in Expo Go. Components should import from here
 * instead of directly importing native modules.
 *
 * Usage:
 *   import { RNShare, isExpoGo } from '@/lib/native-modules';
 *
 *   if (RNShare) {
 *     await RNShare.shareSingle({...});
 *   } else {
 *     Alert.alert('Not available in Expo Go');
 *   }
 */

import Constants from 'expo-constants';

// Detect if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

if (__DEV__) {
  console.log(`[NativeModules] Running in ${isExpoGo ? 'Expo Go' : 'Development Build'}`);
}

// =============================================================================
// react-native-keyboard-controller (example native module)
// Used for: Better keyboard handling (avoids keyboard covering inputs)
// Install: npx expo install react-native-keyboard-controller
// =============================================================================
export let KeyboardProvider: any = null;
export let KeyboardAvoidingView: any = null;

// =============================================================================
// Add your native modules here following this pattern:
//
// export let MyNativeModule: any = null;
//
// Then load it in the block below.
// =============================================================================

if (!isExpoGo) {
  // react-native-keyboard-controller
  try {
    const keyboardModule = require('react-native-keyboard-controller');
    KeyboardProvider = keyboardModule.KeyboardProvider;
    KeyboardAvoidingView = keyboardModule.KeyboardAvoidingView;
    if (__DEV__) console.log('[NativeModules] Loaded react-native-keyboard-controller');
  } catch (e) {
    if (__DEV__) console.log('[NativeModules] react-native-keyboard-controller not available');
  }

  // Add more native modules here:
  // try {
  //   const myModule = require('my-native-module');
  //   MyNativeModule = myModule.default;
  //   if (__DEV__) console.log('[NativeModules] Loaded my-native-module');
  // } catch (e) {
  //   if (__DEV__) console.log('[NativeModules] my-native-module not available');
  // }
} else {
  if (__DEV__) console.log('[NativeModules] Expo Go detected - skipping native module loading');
}
