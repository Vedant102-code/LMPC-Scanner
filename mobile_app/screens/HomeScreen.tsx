import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to scan products.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const cancelInspection = () => {
    Alert.alert(
      "Cancel Inspection",
      "Are you sure you want to cancel this inspection?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => navigation.goBack() }
      ]
    );
  };

  const uploadImages = async () => {
    if (images.length === 0) return;
    setLoading(true);
    
    // Using the Local Wi-Fi IP so the physical phone can reach the laptop
    const backendUrl = 'http://10.218.218.119:8000/api/analyze';
    
    const formData = new FormData();
    images.forEach((uri, index) => {
      formData.append('files', {
        uri,
        name: `scan_${index}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    formData.append('width', '10.0');
    formData.append('height', '15.0');

    try {
      const response = await axios.post(backendUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLoading(false);
      setImages([]); // Clear after success
      navigation.navigate('Results', {
        imageUri: images[0], // Pass the first image to display
        resultData: response.data,
      });

    } catch (error: any) {
      setLoading(false);
      Alert.alert('Network Error', 'Failed to connect to the AI Backend. Ensure the FastAPI server is running.');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.inspectionId}>Inspection ID: {inspectionId}</Text>
      </View>

      <Text style={styles.title}>Capture Product Packaging</Text>
      <Text style={styles.subtitle}>Take photos of all sides containing text.</Text>

      {/* Image Preview Grid */}
      <View style={styles.previewGrid}>
        {images.map((uri, index) => (
          <View key={index} style={styles.previewContainer}>
            <Image source={{ uri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.deleteBadge} onPress={() => removeImage(index)}>
              <Text style={styles.deleteBadgeText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>AI is analyzing {images.length} images...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>+ TAKE PHOTO</Text>
          </TouchableOpacity>
          
          {images.length > 0 && (
            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={uploadImages}>
              <Text style={styles.buttonText}>SUBMIT FOR ANALYSIS</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={cancelInspection}>
            <Text style={styles.cancelButtonText}>CANCEL INSPECTION</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    width: '100%',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    marginBottom: 24,
  },
  inspectionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 24,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  previewContainer: {
    margin: 8,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  deleteBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#0056b3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 3,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 24,
    padding: 12,
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
});
