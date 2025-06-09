import { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { appStore } from '../../store';

interface OrderGuardResult {
  isValid: boolean;
  error?: string;
  isLoading: boolean;
}

export const useOrderGuard = (): OrderGuardResult => {
  const router = useIonRouter();
  const appState = appStore();
  const [isLoading, setIsLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<OrderGuardResult>({
    isValid: false,
    isLoading: true,
  });

  const validateOrder = (): OrderGuardResult => {
    console.log('Validating order with state:', {
      restaurant: appState.RestaurantData.restaurant._id,
      location: appState.RestaurantData.location.locationId,
      origin: appState.RestaurantData.origin.originId,
      menuId: appState.menuId,
      items: appState.order.items.length,
    });

    if (!appState.RestaurantData.restaurant._id) {
      return {
        isValid: false,
        error: 'Missing restaurant information',
        isLoading: false,
      };
    }

    if (!appState.RestaurantData.location.locationId) {
      return {
        isValid: false,
        error: 'Missing location information',
        isLoading: false,
      };
    }

    if (!appState.menuId) {
      return {
        isValid: false,
        error: 'Missing menu information',
        isLoading: false,
      };
    }

    // Don't redirect for empty cart, just show the empty state
    if (appState.order.items.length === 0) {
      return {
        isValid: true,
        isLoading: false,
      };
    }

    return {
      isValid: true,
      isLoading: false,
    };
  };

  useEffect(() => {
    const result = validateOrder();
    console.log('Validation result:', result);

    if (!result.isValid && !result.isLoading) {
      const restaurantId = appState.RestaurantData.restaurant._id;
      const locationId = appState.RestaurantData.location.locationId;
      const menuId = appState.menuId;
      const originId = appState.RestaurantData.origin.originId;

      console.log('Redirecting to:', {
        restaurantId,
        locationId,
        menuId,
        originId,
      });

      // Add small delay before redirect to prevent white screen flash
      setTimeout(() => {
        if (restaurantId && locationId && menuId) {
          router.push(`/menu/${restaurantId}/${locationId}/${menuId}?originId=${originId}`, 'forward');
        } else {
          router.push('/');
        }
      }, 100);
    }

    setValidationResult(result);
    setIsLoading(false);
  }, []);

  return validationResult;
};
