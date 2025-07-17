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
import { Plus, Search, Package, CreditCard as Edit3, Trash2, Filter, IndianRupee, Hash } from 'lucide-react-native';

interface Item {
  id: string;
  name: string;
  itemId: string;
  price: number;
  unit: string;
  gstRate: number;
  priceIncludesGst: boolean;
  description?: string;
  category?: string;
  createdAt: string;
}

export default function ItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const unsubscribe = router.addListener('focus', () => {
      loadItems();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, selectedCategory, items]);

  const loadItems = async () => {
    try {
      const itemsString = await AsyncStorage.getItem('items');
      if (itemsString) {
        const loadedItems = JSON.parse(itemsString);
        setItems(loadedItems);
        setFilteredItems(loadedItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedItems = items.filter(item => item.id !== itemId);
              await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
              setItems(updatedItems);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const getGstText = (gstRate: number) => {
    return gstRate === 0 ? 'Nil' : `${gstRate}%`;
  };

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemIdContainer}>
            <Hash size={12} color="#64748B" />
            <Text style={styles.itemId}>{item.itemId}</Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/edit-item/${item.id}`)}
          >
            <Edit3 size={18} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteItem(item.id)}
          >
            <Trash2 size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.priceContainer}>
          <IndianRupee size={16} color="#059669" />
          <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
          <Text style={styles.unit}>/{item.unit}</Text>
        </View>
        <View style={styles.gstContainer}>
          <Text style={styles.gstLabel}>GST:</Text>
          <Text style={styles.gstRate}>{getGstText(item.gstRate)}</Text>
          <Text style={styles.gstType}>
            {item.priceIncludesGst ? '(Inc.)' : '(Exc.)'}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      {item.category && (
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Items</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-item')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {categories.length > 0 && (
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Items Found</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery ? 'No items match your search' : 'Add your first item to get started'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/add-item')}
          >
            <Plus size={16} color="#2563EB" />
            <Text style={styles.emptyButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  searchBar: {
    flex: 1,
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
  filterButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemId: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 4,
  },
  unit: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 2,
  },
  gstContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gstLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  gstRate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  gstType: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  category: {
    fontSize: 12,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
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