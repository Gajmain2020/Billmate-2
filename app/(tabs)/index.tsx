import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Package,
  IndianRupee,
  FileText,
  Clock,
} from 'lucide-react-native';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

interface BillerData {
  name: string;
  gstNumber: string;
  mobileNumber: string;
  address: string;
  logoUri: string | null;
}

interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  totalItems: number;
  totalAmount: number;
  recentInvoices: any[];
}

export default function DashboardScreen() {
  const [billerData, setBillerData] = useState<BillerData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalCustomers: 0,
    totalItems: 0,
    totalAmount: 0,
    recentInvoices: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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

      const totalAmount = invoices.reduce(
        (sum: number, invoice: any) => sum + invoice.total,
        0
      );
      const recentInvoices = invoices.slice(-5).reverse();

      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalItems: items.length,
        totalAmount,
        recentInvoices,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: 'Create Invoice',
      icon: Plus,
      color: '#2563EB',
      onPress: () => router.push('/create-invoice'),
    },
    {
      title: 'Add Item',
      icon: Package,
      color: '#059669',
      onPress: () => router.push('/add-item'),
    },
    {
      title: 'Add Customer',
      icon: Users,
      color: '#DC2626',
      onPress: () => router.push('/add-customer'),
    },
    // {
    //   title: 'View Reports',
    //   icon: TrendingUp,
    //   color: '#7C3AED',
    //   onPress: () => router.push('/reports'),
    // },
  ];

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: Receipt,
      color: '#2563EB',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: '#059669',
      bgColor: '#F0FDF4',
    },
    {
      title: 'Items',
      value: stats.totalItems,
      icon: Package,
      color: '#DC2626',
      bgColor: '#FEF2F2',
    },
    {
      title: 'Total Amount',
      value: `₹${stats.totalAmount.toLocaleString()}`,
      icon: IndianRupee,
      color: '#7C3AED',
      bgColor: '#F9FAFB',
    },
  ];

  return (
    <KeyboardAvoidingWrapper>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {billerData?.logoUri && (
              <Image source={{ uri: billerData.logoUri }} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.businessName}>{billerData?.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: action.color }]}
                >
                  <action.icon size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <View style={styles.statsGrid}>
            {statCards.map((stat, index) => (
              <View
                key={index}
                style={[styles.statCard, { backgroundColor: stat.bgColor }]}
              >
                <View style={styles.statIcon}>
                  <stat.icon size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {stats.recentInvoices.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            {stats.recentInvoices.map((invoice, index) => (
              <View key={index} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.invoiceNumber}>
                    {invoice.invoiceNumber}
                  </Text>
                  <Text style={styles.invoiceAmount}>
                    ₹{invoice.total.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.customerName}>{invoice.customer.name}</Text>
                <View style={styles.invoiceFooter}>
                  <View style={styles.dateContainer}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.invoiceDate}>
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.itemCount}>
                    {invoice.items.length} items
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  stats: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  customerName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#64748B',
  },
});
