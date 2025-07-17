import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Search, Users, CreditCard as Edit3, Trash2, Phone, Mail, MapPin } from 'lucide-react-native';

interface Customer {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const unsubscribe = router.addListener('focus', () => {
      loadCustomers();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      const customersString = await AsyncStorage.getItem('customers');
      if (customersString) {
        const loadedCustomers = JSON.parse(customersString);
        setCustomers(loadedCustomers);
        setFilteredCustomers(loadedCustomers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.mobile && customer.mobile.includes(searchQuery)) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const deleteCustomer = async (customerId: string) => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedCustomers = customers.filter(customer => customer.id !== customerId);
              await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));
              setCustomers(updatedCustomers);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.mobile && (
            <View style={styles.contactRow}>
              <Phone size={14} color="#64748B" />
              <Text style={styles.contactText}>{item.mobile}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.contactRow}>
              <Mail size={14} color="#64748B" />
              <Text style={styles.contactText}>{item.email}</Text>
            </View>
          )}
        </View>
        <View style={styles.customerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/edit-customer/${item.id}`)}
          >
            <Edit3 size={18} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteCustomer(item.id)}
          >
            <Trash2 size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {item.address && (
        <View style={styles.addressContainer}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.addressText}>{item.address}</Text>
        </View>
      )}

      <View style={styles.customerFooter}>
        <Text style={styles.dateText}>
          Added on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.billButton}
          onPress={() => router.push(`/create-invoice?customerId=${item.id}`)}
        >
          <Text style={styles.billButtonText}>Create Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-customer')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {filteredCustomers.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Customers Found</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery ? 'No customers match your search' : 'Add your first customer to get started'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/add-customer')}
          >
            <Plus size={16} color="#2563EB" />
            <Text style={styles.emptyButtonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={item => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1E293B',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  billButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  billButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 6,
  },
});