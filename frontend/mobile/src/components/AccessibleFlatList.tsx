import React, { memo, useCallback } from 'react';
import { FlatList, FlatListProps, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface AccessibleFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: FlatListProps<T>['renderItem'];
  itemHeight?: number;
  emptyMessage?: string;
  accessibilityLabel?: string;
}

function AccessibleFlatListInner<T>({
  data,
  renderItem,
  itemHeight,
  emptyMessage,
  accessibilityLabel = 'List',
  keyExtractor,
  ...rest
}: AccessibleFlatListProps<T>) {
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemHeight || 80,
      offset: (itemHeight || 80) * index,
      index,
    }),
    [itemHeight]
  );

  const ListEmpty = useCallback(
    () =>
      emptyMessage ? (
        <View style={styles.emptyContainer} accessible accessibilityLabel={emptyMessage}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : null,
    [emptyMessage]
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={itemHeight ? getItemLayout : undefined}
      ListEmptyComponent={ListEmpty}
      removeClippedSubviews={itemHeight ? true : undefined}
      maxToRenderPerBatch={10}
      windowSize={7}
      initialNumToRender={8}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="list"
      {...rest}
    />
  );
}

const AccessibleFlatList = memo(AccessibleFlatListInner) as typeof AccessibleFlatListInner;

const styles = StyleSheet.create({
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
});

export default AccessibleFlatList;
