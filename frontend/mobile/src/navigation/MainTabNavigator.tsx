import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import type { MainTabParamList } from './types';
import HomeScreen from '@screens/HomeScreen';
import HistoryScreen from '@screens/HistoryScreen';
import ProfileScreen from '@screens/ProfileScreen';
import { Colors } from '@constants/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', History: '📋', Profile: '👤' };
  return <Text style={[styles.icon, focused && styles.iconFocused]}>{icons[label] || '●'}</Text>;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textLight,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
    })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 4, height: 60 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  icon: { fontSize: 22 },
  iconFocused: { fontSize: 24 },
});
