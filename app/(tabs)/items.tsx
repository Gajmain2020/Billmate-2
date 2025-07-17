import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Animated, {
  LinearTransition,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search,
  Edit3,
  Trash2,
  Hash,
  Package,
  Plus,
} from 'lucide-react-native';

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
  const [searchQuery, setSearchQuery] = useState('');

  const { id } = useLocalSearchParams();

  useEffect(() => {
    loadItems();
  }, [id]);

  const loadItems = async () => {
    try {
      const itemsString = await AsyncStorage.getItem('items');
      if (itemsString) {
        const loadedItems = JSON.parse(itemsString);
        setItems(loadedItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteItem = async (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedItems = items.filter((item) => item.id !== itemId);
            await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
            setItems(updatedItems);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Item }) => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
    >
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
              onPress={() => router.push(`/edit-item/${item.id}`)}
            >
              <Edit3 size={18} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                deleteItem(item.id);
              }}
            >
              <Trash2 size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹ {item.price}</Text>
            <Text style={styles.unit}>/{item.unit}</Text>
          </View>
          <View style={styles.gstContainer}>
            <Text style={styles.gstLabel}>GST:</Text>
            <Text style={styles.gstRate}>{item.gstRate}%</Text>
            <Text style={styles.gstType}>
              {item.priceIncludesGst ? '(Inc.)' : '(Exc.)'}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Animated.FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        itemLayoutAnimation={LinearTransition}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'No items match your search'
                : 'Add your first item to get started'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-item')}
            >
              <Plus size={16} color="#2563EB" />
              <Text style={styles.emptyButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 1,
  },
  unit: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  gstContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gstLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  gstRate: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  gstType: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2563EB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1E293B',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    fontSize: 16,
    color: '#2563EB',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    fontSize: 16,
    color: '#DC2626',
    flex: 1,
    textAlign: 'center',
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
