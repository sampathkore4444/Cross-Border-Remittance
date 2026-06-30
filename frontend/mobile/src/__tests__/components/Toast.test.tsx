import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ToastProvider, useToast } from '../../components/Toast';
import { Text, TouchableOpacity } from 'react-native';

function TestHarness() {
  const { showToast } = useToast();
  return (
    <>
      <TouchableOpacity testID="show-error" onPress={() => showToast('Error message', 'error')} />
      <TouchableOpacity testID="show-success" onPress={() => showToast('Success message', 'success')} />
      <TouchableOpacity testID="show-info" onPress={() => showToast('Info message', 'info')} />
    </>
  );
}

describe('Toast', () => {
  it('renders children', () => {
    const { getByTestId } = render(
      <ToastProvider>
        <Text testID="child">Hello</Text>
      </ToastProvider>
    );
    expect(getByTestId('child')).toBeTruthy();
  });

  it('shows error toast with message', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );
    act(() => {
      getByTestId('show-error').props.onPress();
    });
    expect(queryByText('Error message')).toBeTruthy();
    jest.useRealTimers();
  });

  it('shows success toast', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );
    act(() => {
      getByTestId('show-success').props.onPress();
    });
    expect(queryByText('Success message')).toBeTruthy();
    jest.useRealTimers();
  });

  it('shows info toast', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );
    act(() => {
      getByTestId('show-info').props.onPress();
    });
    expect(queryByText('Info message')).toBeTruthy();
    jest.useRealTimers();
  });

  it('auto-dismisses toast after 3500ms', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );
    act(() => {
      getByTestId('show-error').props.onPress();
    });
    expect(queryByText('Error message')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(queryByText('Error message')).toBeNull();
    jest.useRealTimers();
  });
});
