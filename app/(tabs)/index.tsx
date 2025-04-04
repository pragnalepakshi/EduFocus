import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Define types
type StudentPrediction = {
  student_name: string;
  is_attentive: boolean;
};

export default function App() {
  // States
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<StudentPrediction[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Function to handle getting started
  const handleGetStarted = () => {
    setShowWelcome(false);
  };
  
  // Function to pick CSV file
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });
      
      if (!result.canceled) {
        setSelectedFile(result);
        setErrorMsg('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setErrorMsg('Failed to select file');
    }
  };
  
  // Function to analyze attention from CSV
  const analyzeAttention = async () => {
    if (!selectedFile || selectedFile.canceled) {
      setErrorMsg('Please select a CSV file first');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // In a real app, this would send the file to your backend
      // For demo purposes, we'll simulate the API call with mock data
      setTimeout(() => {
        // Mock results - in a real app, this would come from your API
        const mockPredictions: StudentPrediction[] = [
          { student_name: 'Alex Smith', is_attentive: true },
          { student_name: 'Jamie Johnson', is_attentive: false },
          { student_name: 'Taylor Brown', is_attentive: true },
          { student_name: 'Morgan Lee', is_attentive: false },
          { student_name: 'Casey Wilson', is_attentive: true },
          { student_name: 'Jordan Davis', is_attentive: true }
        ];
        
        setResults(mockPredictions);
        setShowResults(true);
        setIsLoading(false);
      }, 2000);
      
      // In a real implementation, you would use something like this:
      /*
      const fileUri = selectedFile.assets[0].uri;
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: selectedFile.assets[0].name,
        type: 'text/csv'
      } as any);
      
      const response = await fetch('https://your-api-url.com/api/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setResults(data.predictions);
      setShowResults(true);
      */
      
    } catch (error) {
      console.error('Error analyzing data:', error);
      setErrorMsg('An error occurred during analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render welcome screen
  if (showWelcome) {
    return (
      <SafeAreaView style={styles.welcomeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />
        <View style={styles.welcomeContent}>
          <Text style={styles.logo}>EduFocus</Text>
          <Text style={styles.welcomeTitle}>Welcome to EduFocus</Text>
          <Text style={styles.welcomeSubtitle}>
            Enhance classroom engagement with AI-powered attention analytics
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render main app
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerLogo}>EduFocus</Text>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Student Data</Text>
          <Text style={styles.uploadDesc}>
            Upload a CSV file with student behavioral data to analyze attention patterns.
          </Text>
          
          <TouchableOpacity 
            style={styles.fileInputLabel} 
            onPress={pickDocument}
          >
            <Text style={styles.fileInputText}>
              Tap to select a CSV file
            </Text>
          </TouchableOpacity>
          
          {selectedFile && !selectedFile.canceled && selectedFile.assets && selectedFile.assets.length > 0 && (
            <Text style={styles.fileName}>
              {selectedFile.assets[0].name}
            </Text>
          )}
          
          {errorMsg ? (
            <Text style={styles.errorMessage}>{errorMsg}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              (!selectedFile || selectedFile.canceled) && styles.disabledBtn
            ]}
            disabled={!selectedFile || selectedFile.canceled}
            onPress={analyzeAttention}
          >
            <Text style={styles.secondaryBtnText}>Analyze Attention</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#4361ee" />
            <Text style={styles.loadingText}>Analyzing student data...</Text>
          </View>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Attention Analysis Results</Text>
            <Text style={styles.resultDesc}>
              Here are the attention prediction results for your students:
            </Text>
            
            <View style={styles.resultsGrid}>
              {results.map((prediction, index) => (
                <View key={index} style={styles.resultCard}>
                  <Text style={styles.studentName}>{prediction.student_name}</Text>
                  <View style={[
                    styles.attentionStatus,
                    prediction.is_attentive ? styles.attentive : styles.inattentive
                  ]}>
                    <Text style={[
                      styles.attentionText,
                      prediction.is_attentive ? styles.attentiveText : styles.inattentiveText
                    ]}>
                      {prediction.is_attentive ? 'Attentive' : 'Inattentive'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // General styles
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 42,
    color: '#4361ee',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    color: '#212529',
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 500,
  },
  primaryBtn: {
    backgroundColor: '#4361ee',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerLogo: {
    fontSize: 24,
    color: '#4361ee',
    fontWeight: 'bold',
  },
  
  // Upload section styles
  uploadSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    color: '#212529',
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadDesc: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  fileInputLabel: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  fileInputText: {
    color: '#666',
    fontSize: 16,
  },
  fileName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  secondaryBtn: {
    backgroundColor: '#4cc9f0',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#4cc9f0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  secondaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  errorMessage: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    width: '100%',
    textAlign: 'center',
  },
  
  // Loading section styles
  loadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  
  // Results section styles
  resultsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  resultDesc: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    width: '48%',
    marginBottom: 16,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  attentionStatus: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  attentive: {
    backgroundColor: '#d1fae5',
  },
  inattentive: {
    backgroundColor: '#fee2e2',
  },
  attentionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  attentiveText: {
    color: '#065f46',
  },
  inattentiveText: {
    color: '#b91c1c',
  },
});