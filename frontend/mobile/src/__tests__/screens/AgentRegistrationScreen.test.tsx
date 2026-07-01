import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AgentRegistrationScreen from '../../screens/AgentRegistrationScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRegisterAgent = jest.fn();

jest.mock('@services/api', () => ({
  api: {
    registerAgent: (...args: any[]) => mockRegisterAgent(...args),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock('@components/ErrorBoundary', () => {
  const MockErrorBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  MockErrorBoundary.displayName = 'ErrorBoundary';
  return { __esModule: true, default: MockErrorBoundary };
});

describe('AgentRegistrationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form', () => {
    const { getByText } = render(<AgentRegistrationScreen navigation={{ goBack: mockGoBack } as any} />);
    expect(getByText('Register as Agent')).toBeTruthy();
    expect(getByText('Submit Registration')).toBeTruthy();
  });

  it('shows validation error when submitting empty form', () => {
    const { getByText } = render(<AgentRegistrationScreen navigation={{ goBack: mockGoBack } as any} />);
    fireEvent.press(getByText('Submit Registration'));
    expect(getByText('Shop name is required')).toBeTruthy();
  });

  it('calls registerAgent on valid submission', async () => {
    mockRegisterAgent.mockResolvedValueOnce({ agent_id: 'test-001' });
    const { getByText, getByPlaceholderText } = render(
      <AgentRegistrationScreen navigation={{ goBack: mockGoBack } as any} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. Bounmy Shop'), 'Test Shop');
    fireEvent.changeText(getByPlaceholderText('e.g. Vientiane'), 'Vientiane');
    fireEvent.press(getByText('Submit Registration'));
    await waitFor(() => {
      expect(mockRegisterAgent).toHaveBeenCalledWith({
        shop_name: 'Test Shop',
        shop_address: '',
        shop_province: 'Vientiane',
        country: 'LA',
        agent_type: 'cash_out_agent',
      });
    });
  });

  it('handles network error gracefully', async () => {
    mockRegisterAgent.mockRejectedValueOnce({ request: {} });
    const { getByText, getByPlaceholderText, findByText } = render(
      <AgentRegistrationScreen navigation={{ goBack: mockGoBack } as any} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. Bounmy Shop'), 'Test Shop');
    fireEvent.changeText(getByPlaceholderText('e.g. Vientiane'), 'Vientiane');
    fireEvent.press(getByText('Submit Registration'));
    const errorMsg = await findByText('Network error. Please check your connection and try again.');
    expect(errorMsg).toBeTruthy();
  });
});
