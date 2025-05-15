import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function PredictScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [inattentivePeriods, setInattentivePeriods] = useState<[number, number][]>([]);
  const [plotImageUrl, setPlotImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedFile(result);
      setInattentivePeriods([]);
      setPlotImageUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file to analyze.');
      return;
    }

    try {
      setLoading(true);
      const fileAsset = selectedFile.assets[0];
      const filename = fileAsset.name;

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const fileResponse = await fetch(fileAsset.uri);
        const blob = await fileResponse.blob();
        const file = new File([blob], filename, { type: 'text/csv' });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: fileAsset.uri,
          name: filename,
          type: 'text/csv',
        } as any);
      }

      const uploadResponse = await fetch('http://192.168.1.4:8085/predict', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file.');

      const processResponse = await fetch('http://192.168.1.4:8085/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!processResponse.ok) throw new Error('Failed to process file.');

      const data = await processResponse.json();

      const periods = data.inattentive_periods || [];
      const parsed = periods.map((text: string) => {
        const match = text.match(/From ([\d.]+) sec to ([\d.]+) sec/);
        if (match) {
          return [parseFloat(match[1]), parseFloat(match[2])] as [number, number];
        }
        return null;
      }).filter(Boolean) as [number, number][];

      setInattentivePeriods(parsed);

      if (data.plot_url) {
        setPlotImageUrl(data.plot_url);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong during processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (plotImageUrl) {
      if (Platform.OS === 'web') {
        try {
          // Fetch the image as blob
          const response = await fetch(plotImageUrl);
          if (!response.ok) throw new Error('Failed to fetch image for download');
  
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
  
          const link = document.createElement('a');
          link.href = url;
          link.download = 'attention_graph.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
  
          // Release the object URL after download
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Download error:', error);
          Alert.alert('Error', 'Failed to download image.');
        }
      } else {
        try {
          const downloadResumable = FileSystem.createDownloadResumable(
            plotImageUrl,
            FileSystem.documentDirectory + 'attention_graph.png'
          );
  
          const downloadResult = await downloadResumable.downloadAsync();
          if (downloadResult?.uri) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
              Alert.alert('Success', 'Image saved to your device.');
            } else {
              Alert.alert('Permission denied', 'Please grant storage permission.');
            }
          }
        } catch (error) {
          console.error(error);
          Alert.alert('Error', 'Failed to download image.');
        }
      }
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
          style={[styles.analyzeButton, (!selectedFile || loading) && styles.disabledButton]}
          disabled={!selectedFile || loading}
          onPress={handleAnalyze}
        >
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Analyze Attention'}
          </Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#3366FF" style={{ marginTop: 20 }} />}

        {inattentivePeriods.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>🔴 Periods of Inattention (≥ 5 seconds)</Text>
            {inattentivePeriods.map(([start, end], index) => (
              <Text key={index} style={styles.resultText}>
                ⏳ From {start.toFixed(2)}s to {end.toFixed(2)}s
              </Text>
            ))}
          </View>
        )}

        {plotImageUrl && (
          <View style={{ marginTop: 30, width: '100%' }}>
            <Text style={styles.resultsTitle}>🖼️ Attention Graph (Image)</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image
                source={{ uri: plotImageUrl }}
                style={{ width: '100%', height: 200, resizeMode: 'contain' }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload}
            >
              <Text style={styles.downloadButtonText}>Download Graph</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Zoomable image modal for mobile */}
      {plotImageUrl && (
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalCloseArea} onPress={() => setModalVisible(false)} />
            <Image source={{ uri: plotImageUrl }} style={styles.modalImage} />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✖ Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    backgroundColor: '#A0BFFF',
  },
  resultsContainer: {
    marginTop: 30,
    width: '100%',
    padding: 10,
    backgroundColor: '#EFF3FF',
    borderRadius: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalImage: {
    width: '90%',
    height: '60%',
    resizeMode: 'contain',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#3366FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  downloadButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
