import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { 
  ArrowLeft, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  FileText, 
  Share,
  Search,
  X
} from 'lucide-react-native';
import uuid from 'react-native-uuid';

interface Customer {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  address?: string;
}

interface Item {
  id: string;
  name: string;
  itemId: string;
  price: number;
  unit: string;
  gstRate: number;
  priceIncludesGst: boolean;
}

interface InvoiceItem extends Item {
  quantity: number;
  total: number;
}

export default function CreateInvoiceScreen() {
  const params = useLocalSearchParams();
  const preSelectedCustomerId = params.customerId as string;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [billerData, setBillerData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preSelectedCustomerId) {
      loadPreSelectedCustomer();
    }
  }, [preSelectedCustomerId, customers]);

  const loadData = async () => {
    try {
      const [customersString, itemsString, billerDataString] = await Promise.all([
        AsyncStorage.getItem('customers'),
        AsyncStorage.getItem('items'),
        AsyncStorage.getItem('billerData'),
      ]);

      if (customersString) setCustomers(JSON.parse(customersString));
      if (itemsString) setItems(JSON.parse(itemsString));
      if (billerDataString) setBillerData(JSON.parse(billerDataString));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadPreSelectedCustomer = () => {
    const customer = customers.find(c => c.id === preSelectedCustomerId);
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const addItemToInvoice = (item: Item) => {
    const existingItem = invoiceItems.find(i => i.id === item.id);
    if (existingItem) {
      updateItemQuantity(item.id, existingItem.quantity + 1);
    } else {
      const invoiceItem: InvoiceItem = {
        ...item,
        quantity: 1,
        total: calculateItemTotal(item, 1),
      };
      setInvoiceItems([...invoiceItems, invoiceItem]);
    }
    setShowItemModal(false);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setInvoiceItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity, total: calculateItemTotal(item, quantity) }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setInvoiceItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateItemTotal = (item: Item, quantity: number) => {
    const baseAmount = item.price * quantity;
    if (item.priceIncludesGst) {
      return baseAmount;
    } else {
      const gstAmount = (baseAmount * item.gstRate) / 100;
      return baseAmount + gstAmount;
    }
  };

  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    invoiceItems.forEach(item => {
      const baseAmount = item.price * item.quantity;
      
      if (item.priceIncludesGst) {
        const gstAmount = (baseAmount * item.gstRate) / (100 + item.gstRate);
        subtotal += baseAmount - gstAmount;
        totalGst += gstAmount;
      } else {
        const gstAmount = (baseAmount * item.gstRate) / 100;
        subtotal += baseAmount;
        totalGst += gstAmount;
      }
    });

    const total = subtotal + totalGst;
    return { subtotal, totalGst, total };
  };

  const generateInvoiceNumber = async () => {
    try {
      const counterString = await AsyncStorage.getItem('invoiceCounter');
      const counter = counterString ? parseInt(counterString) : 1;
      
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}-${counter.toString().padStart(4, '0')}`;
      
      await AsyncStorage.setItem('invoiceCounter', (counter + 1).toString());
      return invoiceNumber;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `INV-${Date.now()}`;
    }
  };

  const saveInvoice = async (invoiceData: any) => {
    try {
      const existingInvoicesString = await AsyncStorage.getItem('invoices');
      const existingInvoices = existingInvoicesString ? JSON.parse(existingInvoicesString) : [];
      
      const updatedInvoices = [...existingInvoices, invoiceData];
      await AsyncStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const generatePDF = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    if (invoiceItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);

    try {
      const invoiceNumber = await generateInvoiceNumber();
      const { subtotal, totalGst, total } = calculateInvoiceTotals();
      
      const invoiceData = {
        id: uuid.v4(),
        invoiceNumber,
        customer: selectedCustomer,
        items: invoiceItems,
        subtotal,
        totalGst,
        total,
        notes,
        createdAt: new Date().toISOString(),
      };

      await saveInvoice(invoiceData);

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563EB; padding-bottom: 20px; }
              .company-name { font-size: 28px; font-weight: bold; color: #2563EB; margin-bottom: 5px; }
              .company-details { font-size: 14px; color: #666; }
              .invoice-title { font-size: 24px; margin: 20px 0; text-align: center; color: #1E293B; }
              .info-section { margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
              .bill-to { background-color: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; }
              .table th { background-color: #F1F5F9; font-weight: bold; color: #374151; }
              .table td { color: #1E293B; }
              .text-right { text-align: right; }
              .total-section { margin-top: 30px; }
              .total-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
              .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #2563EB; padding-top: 10px; color: #2563EB; }
              .notes { margin-top: 30px; background-color: #F8FAFC; padding: 15px; border-radius: 8px; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">${billerData?.name || 'BillMate'}</div>
              ${billerData?.address ? `<div class="company-details">${billerData.address}</div>` : ''}
              ${billerData?.mobileNumber ? `<div class="company-details">Phone: ${billerData.mobileNumber}</div>` : ''}
              ${billerData?.gstNumber ? `<div class="company-details">GST: ${billerData.gstNumber}</div>` : ''}
            </div>
            
            <div class="invoice-title">INVOICE</div>
            
            <div class="info-section">
              <div class="info-row">
                <div><strong>Invoice Number:</strong> ${invoiceNumber}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>
            
            <div class="bill-to">
              <div><strong>Bill To:</strong></div>
              <div style="margin-top: 10px;">
                <div style="font-size: 16px; font-weight: bold;">${selectedCustomer.name}</div>
                ${selectedCustomer.mobile ? `<div>Phone: ${selectedCustomer.mobile}</div>` : ''}
                ${selectedCustomer.email ? `<div>Email: ${selectedCustomer.email}</div>` : ''}
                ${selectedCustomer.address ? `<div>Address: ${selectedCustomer.address}</div>` : ''}
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>GST Rate</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceItems.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: bold;">${item.name}</div>
                      <div style="font-size: 12px; color: #666;">ID: ${item.itemId}</div>
                    </td>
                    <td>${item.quantity} ${item.unit}</td>
                    <td>₹${item.price.toFixed(2)} ${item.priceIncludesGst ? '(Inc. GST)' : '(Exc. GST)'}</td>
                    <td>${item.gstRate === 0 ? 'Nil' : item.gstRate + '%'}</td>
                    <td class="text-right">₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Total GST:</span>
                <span>₹${totalGst.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>
            
            ${notes ? `
              <div class="notes">
                <strong>Notes:</strong><br>
                ${notes}
              </div>
            ` : ''}
            
            <div class="footer">
              <div>Thank you for your business!</div>
              <div style="margin-top: 5px;">Generated by BillMate - Your Billing Companion</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await Sharing.shareAsync(uri);
      
      Alert.alert('Success', 'Invoice generated and ready to share!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/invoices') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invoice');
      console.error('Invoice generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.mobile && customer.mobile.includes(customerSearch))
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.itemId.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const { subtotal, totalGst, total } = calculateInvoiceTotals();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Invoice</Text>
        <TouchableOpacity onPress={generatePDF} disabled={loading} style={styles.shareButton}>
          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Share size={20} color="#2563EB" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <TouchableOpacity
            style={styles.customerCard}
            onPress={() => setShowCustomerModal(true)}
          >
            {selectedCustomer ? (
              <View>
                <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                {selectedCustomer.mobile && (
                  <Text style={styles.customerDetail}>{selectedCustomer.mobile}</Text>
                )}
                {selectedCustomer.email && (
                  <Text style={styles.customerDetail}>{selectedCustomer.email}</Text>
                )}
              </View>
            ) : (
              <View style={styles.selectCustomer}>
                <User size={20} color="#64748B" />
                <Text style={styles.selectCustomerText}>Select Customer</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowItemModal(true)}
            >
              <Plus size={16} color="#2563EB" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {invoiceItems.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemId}>ID: {item.itemId}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={styles.removeButton}
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemPrice}>
                  ₹{item.price.toFixed(2)}/{item.unit} • GST: {item.gstRate === 0 ? 'Nil' : `${item.gstRate}%`}
                </Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Minus size={16} color="#64748B" />
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Plus size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemTotal}>
                <Text style={styles.itemTotalText}>₹{item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {invoiceItems.length === 0 && (
            <View style={styles.emptyItems}>
              <FileText size={48} color="#CBD5E1" />
              <Text style={styles.emptyItemsText}>No items added</Text>
              <Text style={styles.emptyItemsSubtext}>Tap "Add Item" to get started</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add payment terms, thank you message, or other notes..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total GST:</Text>
            <Text style={styles.totalValue}>₹{totalGst.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total:</Text>
            <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
          </View>

          <FlatList
            data={filteredCustomers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCustomer(item);
                  setShowCustomerModal(false);
                }}
              >
                <Text style={styles.modalItemName}>{item.name}</Text>
                {item.mobile && <Text style={styles.modalItemDetail}>{item.mobile}</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Item Selection Modal */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TouchableOpacity onPress={() => setShowItemModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              value={itemSearch}
              onChangeText={setItemSearch}
            />
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => addItemToInvoice(item)}
              >
                <View style={styles.modalItemHeader}>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>₹{item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.modalItemDetail}>
                  ID: {item.itemId} • GST: {item.gstRate === 0 ? 'Nil' : `${item.gstRate}%`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  selectCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectCustomerText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  itemId: {
    fontSize: 12,
    color: '#64748B',
  },
  removeButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#64748B',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyItemsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptyItemsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    height: 80,
    textAlignVertical: 'top',
  },
  totalSection: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  modalItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  modalItemDetail: {
    fontSize: 14,
    color: '#64748B',
  },
});