import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ route }: Props) {
  const { imageUri, resultData } = route.params;

  const report = resultData?.compliance_report || {};
  const isCompliant = report.is_compliant === true;
  const score = report.severity_score || 0;
  const status = report.status || 'UNKNOWN';
  const violations = report.violations || [];
  const entities = resultData?.extracted_entities || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={[styles.statusCard, isCompliant ? styles.bgGreen : styles.bgRed]}>
        <Text style={[styles.statusTitle, isCompliant ? styles.textGreen : styles.textRed]}>
          {status}
        </Text>
        <Text style={styles.scoreText}>Score: {score}/100</Text>
      </View>

      {violations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Violations Found ({violations.length})</Text>
          {violations.map((v: any, index: number) => (
            <View key={index} style={styles.violationItem}>
              <Text style={styles.violationField}>{v.field}</Text>
              <Text style={styles.violationDesc}>{v.description}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extracted Data</Text>
        {Object.keys(entities).map((key) => {
          const val = entities[key]?.value || 'Not Found';
          const unit = entities[key]?.unit ? ` ${entities[key].unit}` : '';
          return (
            <View key={key} style={styles.dataRow}>
              <Text style={styles.dataKey}>{key.replace(/_/g, ' ')}</Text>
              <Text style={styles.dataVal}>{val}{unit}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  imageContainer: {
    backgroundColor: '#000',
    height: 300,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
    margin: 16,
    padding: 24,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  bgGreen: { backgroundColor: '#e6ffe6' },
  bgRed: { backgroundColor: '#ffe6e6' },
  textGreen: { color: '#008000' },
  textRed: { color: '#cc0000' },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  violationItem: {
    marginBottom: 12,
  },
  violationField: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cc0000',
  },
  violationDesc: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  dataRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  dataKey: {
    fontSize: 12,
    color: '#777',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dataVal: {
    fontSize: 16,
    color: '#222',
  },
});
