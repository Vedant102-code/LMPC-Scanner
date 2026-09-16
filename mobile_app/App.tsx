import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import LandingScreen from './screens/LandingScreen';
import HomeScreen from './screens/HomeScreen';
import ResultsScreen from './screens/ResultsScreen';

export type RootStackParamList = {
  Login: undefined;
  Landing: undefined;
  Home: { inspectionId: string; locationGps?: string; locationAddress?: string };
  Results: { 
    data: any; 
    inspectionId: string;
    locationGps?: string;
    locationAddress?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#f2f2f2' },
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen} 
          options={{ title: 'LMPC Portal', headerBackVisible: false }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Capture Packaging' }} 
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen} 
          options={{ title: 'Compliance Report' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
