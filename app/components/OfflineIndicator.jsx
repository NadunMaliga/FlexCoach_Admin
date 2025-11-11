import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOffline } from '../hooks/useOffline';

/**
 * Offline Indicator Component
 * Shows network status and pending sync count
 */
export default function OfflineIndicator() {
  const { isOnline, pendingCount, sync } = useOffline();
  const [syncing, setSyncing] = React.useState(false);
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    // Show/hide indicator based on status
    if (!isOnline || pendingCount > 0) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [isOnline, pendingCount]);

  const handleSync = async () => {
    if (syncing || !isOnline) return;
    
    try {
      setSyncing(true);
      await sync();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={[
        styles.indicator,
        isOnline ? styles.online : styles.offline
      ]}>
        <Feather 
          name={isOnline ? 'wifi' : 'wifi-off'} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.text}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        
        {pendingCount > 0 && (
          <>
            <View style={styles.separator} />
            <Text style={styles.pendingText}>
              {pendingCount} pending
            </Text>
            {isOnline && (
              <TouchableOpacity 
                onPress={handleSync}
                style={styles.syncButton}
                disabled={syncing}
              >
                <Feather 
                  name={syncing ? 'loader' : 'refresh-cw'} 
                  size={14} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingTop: 50,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#ff6b6b',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  syncButton: {
    marginLeft: 8,
    padding: 4,
  },
});
