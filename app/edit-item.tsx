import { useLocalSearchParams } from 'expo-router';

import { Text } from 'react-native';

// to be built on top of add item

export default function EditItem() {
  const { itemId } = useLocalSearchParams();
  return <Text>EditItem {itemId}</Text>;
}
