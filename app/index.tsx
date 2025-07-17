import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
        const billerData = await AsyncStorage.getItem('billerData');
        
        setTimeout(() => {
          if (hasCompletedOnboarding && billerData) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        }, 2500);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        router.replace('/onboarding');
      }
    };

    checkOnboarding();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Receipt size={80} color="#2563EB" strokeWidth={2} />
          <Sparkles size={32} color="#F59E0B" style={styles.sparkle} />
        </View>
        <Text style={styles.title}>BillMate</Text>
        <Text style={styles.subtitle}>Your Billing Companion</Text>
      </Animated.View>
      
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Professional Invoice Generator</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  sparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 80,
  },
  footerText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
});