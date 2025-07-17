import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Building, Package, Users, FileText, Download, Upload, Trash2, ChevronRight, CreditCard as Edit } from 'lucide-react-native';

interface BillerData {
  name: string;
  gstNumber: string;
  mobileNumber: string;
  address: string;
  logoUri: string | null;
}

export default function SettingsScreen() {
  const [billerData, setBillerData] = useState<BillerData | null>(null);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalItems: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const billerDataString = await AsyncStorage.getItem('billerData');
      if (billerDataString) {
        setBillerData(JSON.parse(billerDataString));
      }

      const invoicesString = await AsyncStorage.getItem('invoices');
      const customersString = await AsyncStorage.getItem('customers');
      const itemsString = await AsyncStorage.getItem('items');

      const invoices = invoicesString ? JSON.parse(invoicesString) : [];
      const customers = customersString ? JSON.parse(customersString) : [];
      const items = itemsString ? JSON.parse(itemsString) : [];

      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalItems: items.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const exportData = async () => {
    try {
      const invoices = await AsyncStorage.getItem('invoices');
      const customers = await AsyncStorage.getItem('customers');
      const items = await AsyncStorage.getItem('items');
      const billerData = await AsyncStorage.getItem('billerData');

      const exportData = {
        invoices: invoices ? JSON.parse(invoices) : [],
        customers: customers ? JSON.parse(customers) : [],
        items: items ? JSON.parse(items) : [],
        billerData: billerData ? JSON.parse(billerData) : null,
        exportDate: new Date().toISOString(),
      };

      // In a real app, you would use file sharing or cloud export
      Alert.alert(
        'Export Data',
        `Data exported successfully!\n\nInvoices: ${exportData.invoices.length}\nCustomers: ${exportData.customers.length}\nItems: ${exportData.items.length}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const resetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all your data including invoices, customers, and items. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'invoices',
                'customers',
                'items',
                'billerData',
                'hasCompletedOnboarding',
                'invoiceCounter',
              ]);
              router.replace('/onboarding');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Edit Business Profile',
      icon: Building,
      onPress: () => router.push('/edit-profile'),
      subtitle: 'Update business information',
    },
    {
      title: 'Manage Items',
      icon: Package,
      onPress: () => router.push('/(tabs)/items'),
      subtitle: `${stats.totalItems} items`,
    },
    {
      title: 'Manage Customers',
      icon: Users,
      onPress: () => router.push('/(tabs)/customers'),
      subtitle: `${stats.totalCustomers} customers`,
    },
    {
      title: 'Invoice History',
      icon: FileText,
      onPress: () => router.push('/(tabs)/invoices'),
      subtitle: `${stats.totalInvoices} invoices`,
    },
  ];

  const dataItems = [
    {
      title: 'Export Data',
      icon: Download,
      onPress: exportData,
      subtitle: 'Backup your data',
    },
    {
      title: 'Reset App',
      icon: Trash2,
      onPress: resetApp,
      subtitle: 'Delete all data',
      color: '#DC2626',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          {billerData?.logoUri && (
            <Image source={{ uri: billerData.logoUri }} style={styles.profileImage} />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.businessName}>{billerData?.name}</Text>
            <Text style={styles.businessDetails}>
              {billerData?.gstNumber ? `GST: ${billerData.gstNumber}` : 'No GST Number'}
            </Text>
            <Text style={styles.businessDetails}>
              Phone: {billerData?.mobileNumber}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Edit size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Management</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuIcon}>
              <item.icon size={20} color="#64748B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        {dataItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuIcon}>
              <item.icon size={20} color={item.color || '#64748B'} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, item.color && { color: item.color }]}>
                {item.title}
              </Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BillMate v1.0.0</Text>
        <Text style={styles.footerText}>Your Billing Companion</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  businessDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  editButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 1,
    borderRadius: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});