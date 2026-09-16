import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: Props) {
  const startInspection = () => {
    // Generate a random 6-character inspection ID for the UI
    const randomId = 'LMPC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    navigation.navigate('Home', {
      inspectionId: randomId,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LMPC Field Inspector</Text>
      <Text style={styles.subtitle}>Official Legal Metrology Compliance Scanner</Text>
      
      <View style={styles.card}>
        <Text style={styles.instructions}>
          1. Start a new inspection session.{"\n"}
          2. Capture all sides of the product.{"\n"}
          3. Upload for AI compliance verification.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={startInspection}>
        <Text style={styles.buttonText}>START NEW INSPECTION</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0056b3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 40,
    width: '100%',
  },
  instructions: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 4,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
