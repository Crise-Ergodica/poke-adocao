import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { LocationDisplay } from '../LocationDisplay';
import { useUserLocation } from '../../hooks/useUserLocation';

jest.mock('../../hooks/useUserLocation');

describe('LocationDisplay', () => {
  it('shows a loading state initially', () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      isLoading: true,
      location: null,
      accuracy: null,
      isAccuracySufficient: false,
      errorMsg: null,
    });

    const { getByTestId } = render(<LocationDisplay />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays error message when permission is denied or accuracy is too low', () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      isLoading: false,
      location: null,
      accuracy: null,
      isAccuracySufficient: false,
      errorMsg: 'Permission denied',
    });

    const { getByText } = render(<LocationDisplay />);
    expect(getByText('Permission denied')).toBeTruthy();
  });

  it('displays location data successfully with sufficient accuracy', () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      isLoading: false,
      location: { latitude: -23.55, longitude: -46.63 },
      accuracy: 25,
      isAccuracySufficient: true,
      errorMsg: null,
    });

    const { getByText } = render(<LocationDisplay />);
    expect(getByText('Latitude: -23.55')).toBeTruthy();
    expect(getByText('Longitude: -46.63')).toBeTruthy();
    expect(getByText('Accuracy: 25 meters')).toBeTruthy();
    expect(getByText('Status: Sufficient Accuracy')).toBeTruthy();
    expect(getByText(`Platform: ${Platform.OS}`)).toBeTruthy();
  });
});
