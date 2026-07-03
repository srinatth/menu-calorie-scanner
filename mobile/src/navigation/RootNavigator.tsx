import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { DishDetailScreen } from '../screens/DishDetailScreen';
import { MenuUploadReviewScreen } from '../screens/MenuUploadReviewScreen';
import { DetectedDishesScreen } from '../screens/DetectedDishesScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ title: 'Search' }} />
        <Stack.Screen name="DishDetail" component={DishDetailScreen} options={{ title: '' }} />
        {/* getComponent (not component) defers requiring these screens until they're actually
            navigated to. Both import react-native-vision-camera, which throws at module-load
            time on web ("VisionCamera currently does not work on web") — a static import here
            would crash the entire app (blank page) as soon as it loads on web, not just these
            two screens. */}
        <Stack.Screen
          name="MenuScan"
          getComponent={() => require('../screens/MenuScanScreen').MenuScanScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MenuUploadReview" component={MenuUploadReviewScreen} options={{ title: 'Analyzing Menu', headerBackVisible: false }} />
        <Stack.Screen name="DetectedDishes" component={DetectedDishesScreen} options={{ title: 'Detected Dishes' }} />
        <Stack.Screen
          name="QRScan"
          getComponent={() => require('../screens/QRScanScreen').QRScanScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
