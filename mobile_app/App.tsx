import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from './screens/LandingScreen';
import HomeScreen from './screens/HomeScreen';
import ResultsScreen from './screens/ResultsScreen';

export type RootStackParamList = {
  Landing: undefined;
  Home: {
    inspectionId: string;
  };
  Results: {
    imageUri: string;
    resultData: any;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Landing"
        screenOptions={{
          headerStyle: { backgroundColor: '#f2f2f2' },
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen} 
          options={{ title: 'LMPC Portal' }} 
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
