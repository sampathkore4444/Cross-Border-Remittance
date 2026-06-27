import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SendStackParamList } from './types';
import AmountScreen from '@screens/AmountScreen';
import RecipientScreen from '@screens/RecipientScreen';
import PayoutMethodScreen from '@screens/PayoutMethodScreen';
import ConfirmScreen from '@screens/ConfirmScreen';
import QRScreen from '@screens/QRScreen';
import SuccessScreen from '@screens/SuccessScreen';
import { Colors } from '@constants/colors';

const Stack = createNativeStackNavigator<SendStackParamList>();

export function SendNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="Amount" component={AmountScreen} />
      <Stack.Screen name="Recipient" component={RecipientScreen} />
      <Stack.Screen name="PayoutMethod" component={PayoutMethodScreen} />
      <Stack.Screen name="Confirm" component={ConfirmScreen} />
      <Stack.Screen name="QR" component={QRScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}
