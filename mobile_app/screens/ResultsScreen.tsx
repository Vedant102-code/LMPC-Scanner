import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

interface CheckListItem {
  field: string;
  value: string | null;
  status: 'PASS' | 'FAIL' | 'OVERRIDDEN';
  reason?: string;
  confidence?: number;
  evidenceUri?: string;
}

export default function ResultsScreen({ route, navigation }: Props) {
  const { data, inspectionId, locationGps, locationAddress } = route.params;

  const [checklist, setChecklist] = useState<CheckListItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isCompliant, setIsCompliant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const report = data?.compliance_report || {};
    const violations = report.violations || [];
    const entities = data?.extracted_entities || {};

    let initialChecklist: CheckListItem[] = [];
    let processedFields = new Set<string>();

    // 1. Add all violated fields (FAIL)
    violations.forEach((v: any) => {
      const entity = entities[v.field];
      initialChecklist.push({
        field: v.field,
        value: entity?.value ? `${entity.value}${entity.unit ? ' ' + entity.unit : ''}` : 'Missing',
        status: 'FAIL',
        reason: v.description,
        confidence: entity?.confidence || 0,
      });
      processedFields.add(v.field);
    });

    // 2. Add all successful extracted fields (PASS)
    Object.keys(entities).forEach((key) => {
      if (!processedFields.has(key) && entities[key]?.value) {
        initialChecklist.push({
          field: key,
          value: `${entities[key].value}${entities[key].unit ? ' ' + entities[key].unit : ''}`,
          status: 'PASS',
          confidence: entities[key].confidence || 0,
        });
      }
    });

    setChecklist(initialChecklist);
    calculateScore(initialChecklist);
  }, [data]);

  const calculateScore = (currentList: CheckListItem[]) => {
    let fails = currentList.filter(item => item.status === 'FAIL').length;
    let newScore = Math.max(0, 100 - (fails * 20)); // Rough estimation based on overrides
    setOverallScore(newScore);
    setIsCompliant(fails === 0);
  };

  const overrideDecision = async (index: number) => {
    const item = checklist[index];

    Alert.alert(
      "Manual Override Required",
      `To override the failure for '${item.field}', you must capture photographic evidence of the missing/failed information.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Open Camera", 
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required for evidence.');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              cameraType: ImagePicker.CameraType.back,
              allowsEditing: false,
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              // Update checklist with override and evidence
              const newList = [...checklist];
              newList[index].status = 'OVERRIDDEN';
              newList[index].evidenceUri = result.assets[0].uri;
              setChecklist(newList);
              calculateScore(newList);
            }
          }
        }
      ]
    );
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    
    // Construct the massive JSON payload
    const payload = {
      inspectionId: inspectionId,
      locationGps: locationGps,
      locationAddress: locationAddress || "Unknown Address",
      productBrand: data?.extracted_entities?.BRAND_NAME?.value,
      productName: data?.extracted_entities?.PRODUCT_NAME?.value,
      overallScore: overallScore,
      isCompliant: isCompliant,
      extractedData: data?.extracted_entities,
      processedUrls: data?.processed_urls,
      checklist: checklist
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));

    // Append all evidence photos, keyed by the field name they are overriding!
    checklist.forEach(item => {
      if (item.status === 'OVERRIDDEN' && item.evidenceUri) {
        formData.append('evidence_files', {
          uri: item.evidenceUri,
          name: `${item.field}.jpg`,
          type: 'image/jpeg',
        } as any);
      }
    });

    try {
      const response = await axios.post('http://10.218.218.119:8000/api/save_inspection', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setIsSubmitting(false);
      Alert.alert(
        "Report Submitted Successfully", 
        "The inspection data, evidence photos, and overrides have been permanently saved to the Supabase Cloud.",
        [{ text: "OK", onPress: () => navigation.navigate('Landing') }]
      );
    } catch (error) {
      setIsSubmitting(false);
      console.error(error);
      Alert.alert("Submission Failed", "Could not save to the Supabase Cloud. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'PASS') return '#28a745';
    if (status === 'OVERRIDDEN') return '#ffc107';
    return '#dc3545';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Show the first processed image if available, else fallback */}
      <View style={styles.imageContainer}>
        {data?.processed_urls && data.processed_urls.length > 0 ? (
           <Text style={{color: 'white', textAlign: 'center', marginTop: 110}}>Image Uploaded to Cloud</Text>
        ) : (
           <Text style={{color: 'white', textAlign: 'center', marginTop: 110}}>No Image Preview Available</Text>
        )}
      </View>

      <View style={[styles.statusCard, isCompliant ? styles.bgGreen : styles.bgRed]}>
        <Text style={[styles.statusTitle, isCompliant ? styles.textGreen : styles.textRed]}>
          {isCompliant ? 'APPROVED' : 'REJECTED'}
        </Text>
        <Text style={styles.scoreText}>Score: {overallScore}/100</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Checklist</Text>
        
        {checklist.map((item, index) => {
          const confPercent = item.confidence ? Math.round(item.confidence * 100) : 0;
          return (
            <View key={index} style={[styles.checklistItem, { borderLeftColor: getStatusColor(item.status) }]}>
              <View style={styles.checklistHeader}>
                <Text style={styles.fieldText}>{item.field.replace(/_/g, ' ')}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>

              <Text style={styles.valueText}>Extracted: <Text style={{fontWeight:'bold'}}>{item.value}</Text></Text>
              {confPercent > 0 && (
                <Text style={styles.confText}>AI Confidence: {confPercent}%</Text>
              )}

              {item.status === 'FAIL' && item.reason && (
                <Text style={styles.reasonText}>Error: {item.reason}</Text>
              )}

              {item.status === 'OVERRIDDEN' && item.evidenceUri && (
                <View style={styles.evidenceContainer}>
                  <Text style={styles.evidenceLabel}>Inspector Evidence Provided:</Text>
                  <Image source={{ uri: item.evidenceUri }} style={styles.evidenceImage} />
                </View>
              )}

              {item.status === 'FAIL' && (
                <TouchableOpacity style={styles.overrideBtn} onPress={() => overrideDecision(index)}>
                  <Text style={styles.overrideBtnText}>OVERRIDE DECISION (REQUIRES PHOTO)</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
      
      {/* FINAL SUBMIT BUTTON */}
      <View style={styles.submitSection}>
        <TouchableOpacity 
          style={[styles.finalSubmitBtn, isSubmitting && { backgroundColor: '#5c9bd1' }]} 
          onPress={submitReport}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finalSubmitBtnText}>SUBMIT OFFICIAL REPORT</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  imageContainer: { backgroundColor: '#000', height: 250, width: '100%' },
  statusCard: {
    margin: 16, padding: 24, borderRadius: 8, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', elevation: 2,
  },
  bgGreen: { backgroundColor: '#e6ffe6' },
  bgRed: { backgroundColor: '#ffe6e6' },
  textGreen: { color: '#008000' },
  textRed: { color: '#cc0000' },
  statusTitle: { fontSize: 24, fontWeight: 'bold' },
  scoreText: { fontSize: 18, fontWeight: '600', color: '#333' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  checklistItem: {
    backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12,
    borderLeftWidth: 6, elevation: 1,
  },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fieldText: { fontSize: 14, fontWeight: 'bold', color: '#555', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  valueText: { fontSize: 16, color: '#222', marginBottom: 4 },
  confText: { fontSize: 12, color: '#777', fontStyle: 'italic', marginBottom: 8 },
  reasonText: { fontSize: 14, color: '#cc0000', marginTop: 4, backgroundColor: '#ffe6e6', padding: 8, borderRadius: 4 },
  overrideBtn: { backgroundColor: '#ffc107', padding: 12, borderRadius: 4, marginTop: 12, alignItems: 'center' },
  overrideBtnText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  evidenceContainer: { marginTop: 12, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 },
  evidenceLabel: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  evidenceImage: { width: '100%', height: 120, borderRadius: 4, resizeMode: 'cover' },
  submitSection: { paddingHorizontal: 16, marginTop: 16 },
  finalSubmitBtn: { backgroundColor: '#0056b3', paddingVertical: 18, borderRadius: 8, alignItems: 'center', elevation: 4 },
  finalSubmitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
