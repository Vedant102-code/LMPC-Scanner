import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import * as Location from 'expo-location';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const startInspection = async () => {
    setLoading(true);
    try {
      // 1. Get GPS Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      let locationGps = "Unknown Location";
      
      let locationAddress = "Address could not be resolved";

      if (status === 'granted') {
        // Enforce a strict 2-second timeout so the app NEVER hangs
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        
        const locationPromise = (async () => {
          let loc = await Location.getLastKnownPositionAsync({});
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          }
          return loc;
        })();

        // Race the GPS fetch against the 2-second timer
        const loc = await Promise.race([locationPromise, timeoutPromise]);
        
        if (loc) {
          locationGps = `${loc.coords.latitude}, ${loc.coords.longitude}`;
          
          try {
            // 1. Try Native Android OS Geocoder
            let addressArray = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            if (addressArray.length > 0) {
              let addr = addressArray[0];
              locationAddress = `${addr.name || addr.street || ''}, ${addr.city || addr.subregion || ''}, ${addr.region || ''}`.replace(/^, /, '').trim();
              if (locationAddress.endsWith(',')) locationAddress = locationAddress.slice(0, -1);
            }
          } catch (e) {
            // 2. Fallback to OpenStreetMap API if Android Geocoder is broken/missing
            try {
              const osmResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`, {
                headers: { 'User-Agent': 'LMPC-App/1.0' }
              });
              if (osmResponse.data && osmResponse.data.display_name) {
                // Get a shorter version of the massive OSM address
                const parts = osmResponse.data.display_name.split(',');
                locationAddress = parts.slice(0, 3).join(',').trim();
              }
            } catch (fallbackError) {
              console.error("OSM Fallback failed", fallbackError);
            }
          }
          
          if (!locationAddress || locationAddress === "") {
             locationAddress = "Address could not be resolved";
          }
        } else {
          locationGps = "GPS Signal Weak (Timeout)";
        }
      } else {
        Alert.alert("Permission Denied", "Location is required for official inspections.");
      }

      // 2. Connect to the local FastAPI backend to get a secure ID
      const response = await axios.get('http://10.218.218.119:8000/api/inspections/new');
      setLoading(false);
      
      navigation.navigate('Home', {
        inspectionId: response.data.inspection_id,
        locationGps: locationGps,
        locationAddress: locationAddress
      });
    } catch (error) {
      setLoading(false);
      Alert.alert(
        "Connection Error", 
        "Could not connect to the LMPC backend. Please ensure the server is running."
      );
      console.error(error);
    }
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

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={startInspection}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>START NEW INSPECTION</Text>
        )}
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
  buttonDisabled: {
    backgroundColor: '#94d3a2',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
