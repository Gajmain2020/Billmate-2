import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Building, Phone, FileText, Camera } from 'lucide-react-native';

export default function EditProfileScreen() {
  const [billerName, setBillerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBillerData();
  }, []);

  const loadBillerData = async () => {
    try {
      const billerDataString = await AsyncStorage.getItem('billerData');
      if (billerDataString) {
        const billerData = JSON.parse(billerDataString);
        setBillerName(billerData.name || '');
        setGstNumber(billerData.gstNumber || '');
        setMobileNumber(billerData.mobileNumber || '');
        setCompanyAddress(billerData.address || '');
        setLogoUri(billerData.logoUri || null);
      }
    } catch (error) {
      console.error('Error loading biller data:', error);
    }
  };

  const validateGST = (gst: string) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
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

  const handleSave = async () => {
    if (!billerName.trim()) {
      Alert.alert('Error', 'Please enter biller name');
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
        address: companyAddress.trim(),
        logoUri: logoUri,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('billerData', JSON.stringify(billerData));

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/settings') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error saving biller data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
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
            <Text style={styles.logoHint}>Tap to change your company logo</Text>
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
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});