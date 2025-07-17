import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import {
  Receipt,
  Users,
  FileText,
  Shield,
  Smartphone,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Generate Professional Invoices',
    subtitle: 'Create GST-compliant invoices for your business with ease',
    icon: Receipt,
    color: '#2563EB',
    features: ['GST Compliance', 'Professional Templates', 'Auto Calculations'],
  },
  {
    id: 2,
    title: 'Manage Customers & Items',
    subtitle: 'Save customer details and product catalog for faster billing',
    icon: Users,
    color: '#059669',
    features: ['Customer Database', 'Item Management', 'Quick Search'],
  },
  {
    id: 3,
    title: 'Share & Save Invoices',
    subtitle:
      'Export as PDF and share directly via WhatsApp, email, or save locally',
    icon: FileText,
    color: '#DC2626',
    features: ['PDF Export', 'Direct Sharing', 'Invoice History'],
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage + 1);
        scrollViewRef.current?.scrollTo({
          x: (currentPage + 1) * width,
          animated: true,
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      router.push('/onboarding/setup');
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage - 1);
        scrollViewRef.current?.scrollTo({
          x: (currentPage - 1) * width,
          animated: true,
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/setup');
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.scrollView}
        >
          {onboardingData.map((item) => (
            <Animated.View
              key={item.id}
              style={[styles.page, { opacity: fadeAnim }]}
            >
              <View style={styles.iconContainer}>
                <item.icon size={120} color={item.color} strokeWidth={1.5} />
              </View>

              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>

                <View style={styles.featuresContainer}>
                  {item.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View
                        style={[
                          styles.featureDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === currentPage && styles.activeDot]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            {currentPage > 0 ? (
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.previousButton}
              >
                <ArrowLeft size={20} color="#64748B" />
                <Text style={styles.previousText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.previousButtonPlaceholder} /> // placeholder
            )}

            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextText}>
                {currentPage === onboardingData.length - 1
                  ? 'Get Started'
                  : 'Next'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2563EB',
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousButtonPlaceholder: {
    width: 120,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  previousText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
});
