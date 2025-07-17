import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Package,
  Hash,
  IndianRupee,
  Tag,
  FileText,
} from 'lucide-react-native';
import uuid from 'react-native-uuid';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

const GST_RATES = [
  { label: 'Nil (0%)', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
];

const UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'm', 'cm', 'ft', 'box', 'pack'];

export default function AddItemScreen() {
  const [itemName, setItemName] = useState('');
  const [itemId, setItemId] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [gstRate, setGstRate] = useState(18);
  const [priceIncludesGst, setPriceIncludesGst] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return false;
    }

    if (!itemId.trim()) {
      Alert.alert('Error', 'Please enter item ID');
      return false;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      const existingItemsString = await AsyncStorage.getItem('items');
      const existingItems = existingItemsString
        ? JSON.parse(existingItemsString)
        : [];

      // Check if item ID already exists
      const itemIdExists = existingItems.some(
        (item: any) => item.itemId === itemId.trim()
      );
      if (itemIdExists) {
        Alert.alert(
          'Error',
          'Item ID already exists. Please use a different ID.'
        );
        setLoading(false);
        return;
      }

      const newItem = {
        id: uuid.v4(),
        name: itemName.trim(),
        itemId: itemId.trim(),
        price: Number(price),
        unit: unit,
        gstRate: gstRate,
        priceIncludesGst: priceIncludesGst,
        description: description.trim(),
        category: category.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedItems = [...existingItems, newItem];
      await AsyncStorage.setItem('items', JSON.stringify(updatedItems));

      Alert.alert('Success', 'Item added successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/items') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
      console.error('Error saving item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Item</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <View style={styles.inputContainer}>
                <Package size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="Enter item name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item ID *</Text>
              <View style={styles.inputContainer}>
                <Hash size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={itemId}
                  onChangeText={setItemId}
                  placeholder="Enter unique item ID"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Price *</Text>
                <View style={styles.inputContainer}>
                  <IndianRupee
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>{unit}</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GST Rate</Text>
              <View style={styles.gstContainer}>
                {GST_RATES.map((rate) => (
                  <TouchableOpacity
                    key={rate.value}
                    style={[
                      styles.gstOption,
                      gstRate === rate.value && styles.gstOptionSelected,
                    ]}
                    onPress={() => setGstRate(rate.value)}
                  >
                    <Text
                      style={[
                        styles.gstOptionText,
                        gstRate === rate.value && styles.gstOptionTextSelected,
                      ]}
                    >
                      {rate.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setPriceIncludesGst(!priceIncludesGst)}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    priceIncludesGst && styles.checkboxChecked,
                  ]}
                >
                  {priceIncludesGst && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Price includes GST</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category (Optional)</Text>
              <View style={styles.inputContainer}>
                <Tag size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Enter category"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <View style={styles.inputContainer}>
                <FileText size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter item description"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Item</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'center',
  },
  gstContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gstOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  gstOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  gstOptionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  gstOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
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
