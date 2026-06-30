import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';

const mockNavigate = jest.fn();
const mockDemoLogin = jest.fn();

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({ Navigator: ({ children }: any) => children, Screen: () => null }),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ demoLogin: mockDemoLogin }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@services/api', () => ({
  api: {
    register: jest.fn(),
  },
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and form elements', () => {
    const { getByText } = render(<LoginScreen /> as any);
    expect(getByText('app.name')).toBeTruthy();
    expect(getByText('login.title')).toBeTruthy();
  });

  it('shows error when pressing send with empty phone', () => {
    const { getByText } = render(<LoginScreen /> as any);
    fireEvent.press(getByText('login.sendOTP'));
    expect(getByText('validation.phoneRequired')).toBeTruthy();
  });

  it('calls demoLogin when demo button is pressed', () => {
    const { getByText } = render(<LoginScreen /> as any);
    fireEvent.press(getByText('Demo Mode (Skip Login)'));
    expect(mockDemoLogin).toHaveBeenCalled();
  });
});
