import React, { useState, useEffect } from 'react';
import { Platform, LogBox, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import * as Font from 'expo-font';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import Login from './Screens/Login';
import Home from './Screens/Home';
import IndividualPage from './Screens/IndividualPage';
import { Colors } from './Components/theme';

// Ignore benign web-only warnings
LogBox.ignoreLogs([
  'BackHandler is not supported on web',
  '3000ms timeout exceeded',
  'fontfaceobserver',
]);

// Web-specific global error & font handling
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Prevent unhandled font timeout rejections from cluttering console
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event?.reason?.message?.includes('timeout exceeded') ||
      event?.reason?.message?.includes('fontfaceobserver') ||
      event?.reason?.message?.includes('BackHandler')
    ) {
      event.preventDefault();
    }
  });

  // Inject font styles directly into document head for instantaneous web font rendering
  try {
    const iconFontStyles = `
      @font-face {
        font-family: 'Ionicons';
        src: url(${require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf')}) format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url(${require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf')}) format('truetype');
        font-display: swap;
      }
      @font-face {
        font-family: 'FontAwesome5_Solid';
        src: url(${require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf')}) format('truetype');
        font-display: swap;
      }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = iconFontStyles;
    document.head.appendChild(styleSheet);
  } catch (e) {
    // Style injection fallback
  }
}

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...MaterialCommunityIcons.font,
          ...FontAwesome5.font,
        });
      } catch (err) {
        // Fallback gracefully if font load hits browser delay
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.background },
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen 
            name="IndividualPage" 
            component={IndividualPage} 
            options={{
              cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
