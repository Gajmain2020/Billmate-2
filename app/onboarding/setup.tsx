import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  Building,
  Phone,
  FileText,
  Camera,
  Globe,
  Mail,
} from 'lucide-react-native';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

export default function BillerSetupScreen() {
  const [billerName, setBillerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateGST = (gst: string) => {
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!billerName.trim()) {
      Alert.alert('Error', 'Please enter business name');
      return;
    }

    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }

    if (!validateMobile(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter business email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (gstNumber.trim() && !validateGST(gstNumber)) {
      Alert.alert('Error', 'Please enter a valid GST number');
      return;
    }

    setLoading(true);

    try {
      const billerData = {
        name: billerName.trim(),
        gstNumber: gstNumber.trim(),
        mobileNumber: mobileNumber.trim(),
        companyAddress: companyAddress.trim(),
        email: email.trim(),
        website: website.trim(),
        logoUri: logoUri,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('billerData', JSON.stringify(billerData));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      await AsyncStorage.setItem('invoiceCounter', '1');

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save business information');
      console.error('Error saving business data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Business</Text>
          <Text style={styles.subtitle}>
            Enter your business details to get started with BillMate
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.logoSection}>
            <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Camera size={32} color="#64748B" />
                  <Text style={styles.logoText}>Add Logo</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.logoHint}>Tap to add your company logo</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <View style={styles.inputContainer}>
              <Building size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={billerName}
                onChangeText={setBillerName}
                placeholder="Enter business name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter business email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website (Optional)</Text>
            <View style={styles.inputContainer}>
              <Globe size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="Enter business website"
                placeholderTextColor="#94A3B8"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST Number (Optional)</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="Enter GST number"
                placeholderTextColor="#94A3B8"
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.hint}>Format: 22AAAAA0000A1Z5</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Address (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={companyAddress}
              onChangeText={setCompanyAddress}
              placeholder="Enter company address"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            onPress={handleComplete}
            style={styles.completeButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.completeText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 20,
    // paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  logoHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
