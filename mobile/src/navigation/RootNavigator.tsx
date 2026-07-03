import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { DishDetailScreen } from '../screens/DishDetailScreen';
import { MenuScanScreen } from '../screens/MenuScanScreen';
import { MenuUploadReviewScreen } from '../screens/MenuUploadReviewScreen';
import { DetectedDishesScreen } from '../screens/DetectedDishesScreen';
import { QRScanScreen } from '../screens/QRScanScreen';
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
        <Stack.Screen name="MenuScan" component={MenuScanScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MenuUploadReview" component={MenuUploadReviewScreen} options={{ title: 'Analyzing Menu', headerBackVisible: false }} />
        <Stack.Screen name="DetectedDishes" component={DetectedDishesScreen} options={{ title: 'Detected Dishes' }} />
        <Stack.Screen name="QRScan" component={QRScanScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
