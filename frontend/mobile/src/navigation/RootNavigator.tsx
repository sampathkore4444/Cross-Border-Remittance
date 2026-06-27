import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import { Loading } from '@components/Loading';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { SendNavigator } from './SendNavigator';
import TransactionDetailScreen from '@screens/TransactionDetailScreen';
import AgentDashboardScreen from '@screens/AgentDashboardScreen';
import AutosendSettingsScreen from '@screens/AutosendSettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading fullScreen message="Loading..." />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Send" component={SendNavigator} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} />
          <Stack.Screen name="AutosendSettings" component={AutosendSettingsScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
