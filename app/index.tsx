import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>EduFocus</Text>
      <Text style={styles.welcome}>Welcome to EduFocus</Text>
      <Text style={styles.subtitle}>Enhance classroom engagement with AI-powered attention analytics</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/predict')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F9FF',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3366FF',
    marginBottom: 10,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#3366FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
