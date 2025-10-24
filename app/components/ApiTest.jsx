import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ApiService from '../services/api';

export default function ApiTest() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, data) => {
    setResults(prev => [...prev, { test, success, data, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test health endpoint
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      addResult('Health Check', response.ok, data.message || 'Connected');
    } catch (error) {
      addResult('Health Check', false, error.message);
    }

    // Test login (you'll need to update with real admin credentials)
    try {
      const loginResponse = await ApiService.login('admin@flexcoach.com', 'admin123');
      addResult('Admin Login', loginResponse.success, loginResponse.message);
    } catch (error) {
      addResult('Admin Login', false, error.message);
    }

    // Test get users
    try {
      const usersResponse = await ApiService.getUsers({ limit: 5 });
      addResult('Get Users', usersResponse.success, `Found ${usersResponse.users?.length || 0} users`);
    } catch (error) {
      addResult('Get Users', false, error.message);
    }

    // Test get exercises
    try {
      const exercisesResponse = await ApiService.getExercises({ limit: 5 });
      addResult('Get Exercises', exercisesResponse.success, `Found ${exercisesResponse.exercises?.length || 0} exercises`);
    } catch (error) {
      addResult('Get Exercises', false, error.message);
    }

    // Test get foods
    try {
      const foodsResponse = await ApiService.getFoods({ limit: 5 });
      addResult('Get Foods', foodsResponse.success, `Found ${foodsResponse.foods?.length || 0} foods`);
    } catch (error) {
      addResult('Get Foods', false, error.message);
    }

    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : 'Test API Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={[styles.resultItem, result.success ? styles.success : styles.error]}>
            <Text style={styles.resultTest}>{result.test}</Text>
            <Text style={styles.resultStatus}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </Text>
            <Text style={styles.resultData}>{result.data}</Text>
            <Text style={styles.resultTime}>{result.timestamp}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  testButton: {
    backgroundColor: '#d5ff5f',
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  success: {
    backgroundColor: '#1a4d1a',
    borderColor: '#4CAF50',
  },
  error: {
    backgroundColor: '#4d1a1a',
    borderColor: '#f44336',
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  resultStatus: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  resultData: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 5,
  },
  resultTime: {
    fontSize: 10,
    color: '#999',
  },
});