import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function PredictScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedFile(result);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      console.log('Uploading file:', selectedFile.assets[0].uri);
      Alert.alert('File Ready', `Selected file: ${selectedFile.assets[0].name}`);
    } else {
      Alert.alert('No File', 'Please select a file to analyze.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>&larr;</Text>
        </TouchableOpacity>
        <Text style={styles.header}>EduFocus</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Upload Student Data</Text>
        <Text style={styles.description}>
          Upload a CSV file with student behavioral data to analyze attention patterns.
        </Text>

        <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.assets[0].name : 'Tap to select a CSV file'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.analyzeButton, !selectedFile && styles.disabledButton]}
          disabled={!selectedFile}
          onPress={handleAnalyze}
        >
          <Text style={styles.analyzeButtonText}>Analyze Attention</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  backText: {
    fontSize: 22,
    color: '#3366FF',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3366FF',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  uploadBox: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    borderColor: '#999',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 14,
    color: '#999',
  },
  analyzeButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
  },
});
