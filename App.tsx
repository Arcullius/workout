import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { supabase } from './utils/supabase';

type Todo = {
  id: string | number;
  name: string;
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    async function getTodos() {
      const { data } = await supabase.from('todos').select();

      if (data) {
        setTodos(data as Todo[]);
      }
    }

    getTodos();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={todos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
        ListEmptyComponent={<Text style={styles.item}>No todos found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  item: {
    fontSize: 16,
    paddingVertical: 8,
  },
});
