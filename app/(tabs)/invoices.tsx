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
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { 
  Plus, 
  Search, 
  FileText, 
  Share, 
  Eye, 
  Calendar,
  IndianRupee,
  Clock
} from 'lucide-react-native';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    name: string;
    mobile?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    gstRate: number;
    priceIncludesGst: boolean;
    total: number;
  }>;
  subtotal: number;
  totalGst: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [billerData, setBillerData] = useState<any>(null);

  useEffect(() => {
    loadInvoices();
    loadBillerData();
  }, []);

  useEffect(() => {
    const unsubscribe = router.addListener('focus', () => {
      loadInvoices();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, invoices]);

  const loadInvoices = async () => {
    try {
      const invoicesString = await AsyncStorage.getItem('invoices');
      if (invoicesString) {
        const loadedInvoices = JSON.parse(invoicesString);
        setInvoices(loadedInvoices);
        setFilteredInvoices(loadedInvoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadBillerData = async () => {
    try {
      const billerDataString = await AsyncStorage.getItem('billerData');
      if (billerDataString) {
        setBillerData(JSON.parse(billerDataString));
      }
    } catch (error) {
      console.error('Error loading biller data:', error);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const generatePDF = async (invoice: Invoice) => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; color: #2563EB; }
              .invoice-title { font-size: 20px; margin: 20px 0; }
              .info-section { margin: 15px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f2f2f2; }
              .total-section { margin-top: 20px; text-align: right; }
              .total-row { margin: 5px 0; }
              .grand-total { font-size: 18px; font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">${billerData?.name || 'BillMate'}</div>
              ${billerData?.address ? `<div>${billerData.address}</div>` : ''}
              ${billerData?.mobileNumber ? `<div>Phone: ${billerData.mobileNumber}</div>` : ''}
              ${billerData?.gstNumber ? `<div>GST: ${billerData.gstNumber}</div>` : ''}
            </div>
            
            <div class="invoice-title">INVOICE</div>
            
            <div class="info-section">
              <div class="info-row">
                <div><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</div>
                <div><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            
            <div class="info-section">
              <div><strong>Bill To:</strong></div>
              <div>${invoice.customer.name}</div>
              ${invoice.customer.mobile ? `<div>${invoice.customer.mobile}</div>` : ''}
              ${invoice.customer.email ? `<div>${invoice.customer.email}</div>` : ''}
              ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ''}
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>GST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>${item.gstRate}%</td>
                    <td>₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
              <div class="total-row">Total GST: ₹${invoice.totalGst.toFixed(2)}</div>
              <div class="total-row grand-total">Grand Total: ₹${invoice.total.toFixed(2)}</div>
            </div>
            
            ${invoice.notes ? `<div class="info-section"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
            
            <div class="footer">
              <div>Thank you for your business!</div>
              <div>Generated by BillMate</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <Text style={styles.customerName}>{item.customer.name}</Text>
        </View>
        <View style={styles.invoiceAmount}>
          <Text style={styles.totalAmount}>₹{item.total.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Calendar size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.items.length} items</Text>
          </View>
        </View>

        <View style={styles.gstInfo}>
          <Text style={styles.gstText}>GST: ₹{item.totalGst.toFixed(2)}</Text>
          <Text style={styles.subtotalText}>Subtotal: ₹{item.subtotal.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/invoice-details/${item.id}`)}
        >
          <Eye size={16} color="#2563EB" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => generatePDF(item)}
        >
          <Share size={16} color="#059669" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create-invoice')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {filteredInvoices.length === 0 ? (
        <View style={styles.emptyState}>
          <FileText size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Invoices Found</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery ? 'No invoices match your search' : 'Create your first invoice to get started'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/create-invoice')}
          >
            <Plus size={16} color="#2563EB" />
            <Text style={styles.emptyButtonText}>Create Invoice</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoice}
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#64748B',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  gstInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gstText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  subtotalText: {
    fontSize: 12,
    color: '#64748B',
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
    fontWeight: '500',
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