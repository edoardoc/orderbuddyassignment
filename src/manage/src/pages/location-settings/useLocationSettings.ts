import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  useLocationSettingsApi,
  useUpdateLocationSettings,
  WorkingHour,
  OrderTiming,
} from '../../queries/location-settings/useLocationSettingsApi';
import { useIonToast } from '@ionic/react';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Simple interface for timezone data - kept for backward compatibility
export interface timezones {
  common: {
    id: string;
    name: string;
    group: string;
  }[];
}

// Interface for order timing settings
export interface OrderTimingSettings {
  acceptOrdersAfterMinutes: number;
  stopOrdersBeforeMinutes: number;
}

export function useLocationSettings() {
  const { restaurantId = '', locationId = '' } = useParams<{ restaurantId: string; locationId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [timezone, setTimezone] = useState<string>('');
  // State for range slider UI values
  const [startAcceptMinutes, setStartAcceptMinutes] = useState<number>(30);
  const [stopAcceptMinutes, setStopAcceptMinutes] = useState<number>(30);

  const [orderTiming, setOrderTiming] = useState<OrderTimingSettings>({
    acceptOrdersAfterMinutes: 30,
    stopOrdersBeforeMinutes: 30,
  });
  const [presentToast] = useIonToast();
  // Add a ref to track if data was changed by user action (not just loaded)
  const dataChangedByUserRef = useRef(false);

  const timezones: timezones = {
    common: [
      { id: 'America/New_York', name: 'Eastern Time (ET)', group: 'common' },
      { id: 'America/Chicago', name: 'Central Time (CT)', group: 'common' },
      { id: 'America/Denver', name: 'Mountain Time (MT)', group: 'common' },
      { id: 'America/Los_Angeles', name: 'Pacific Time (PT)', group: 'common' },
      { id: 'America/Anchorage', name: 'Alaska Time (AKT)', group: 'common' },
      { id: 'Pacific/Honolulu', name: 'Hawaii Time (HT)', group: 'common' },
    ],
  };

  // Fetch location settings
  const {
    data: locationSettingsData,
    isLoading: isLoadingData,
    error,
    refetch,
  } = useLocationSettingsApi(restaurantId, locationId);

  // Update location settings mutation
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateLocationSettings();

  // To track initial data for comparison
  const initialDataRef = useRef<{
    workingHours: WorkingHour[];
    timezone: string;
    orderTiming?: OrderTiming;
  } | null>(null);

  // Initialize state from fetched data
  useEffect(() => {
    if (locationSettingsData) {
      // Create default working hours with all days of the week
      const defaultWorkingHours: WorkingHour[] = daysOfWeek.map((day) => ({
        day,
        isOpen: false,
        startTime: null,
        endTime: null,
      }));

      if (locationSettingsData.workingHours && locationSettingsData.workingHours.length > 0) {
        // Merge existing working hours with defaults
        const mergedWorkingHours = [...defaultWorkingHours];

        locationSettingsData.workingHours.forEach((hourData) => {
          const index = daysOfWeek.indexOf(hourData.day);
          if (index !== -1) {
            mergedWorkingHours[index] = hourData;
          }
        });

        setWorkingHours(mergedWorkingHours);
      } else {
        // No working hours data, use defaults
        setWorkingHours(defaultWorkingHours);
      }

      const tzValue = locationSettingsData.timezone || 'America/New_York';
      setTimezone(tzValue);

      // Set order timing settings if available
      if (locationSettingsData.orderTiming) {
        setOrderTiming({
          acceptOrdersAfterMinutes:
            typeof locationSettingsData.orderTiming.acceptOrdersAfterMinutes === 'number'
              ? locationSettingsData.orderTiming.acceptOrdersAfterMinutes
              : 30,
          stopOrdersBeforeMinutes:
            typeof locationSettingsData.orderTiming.stopOrdersBeforeMinutes === 'number'
              ? locationSettingsData.orderTiming.stopOrdersBeforeMinutes
              : 30,
        });
      }

      // Store initial data for comparison
      initialDataRef.current = {
        workingHours: locationSettingsData.workingHours || defaultWorkingHours,
        timezone: tzValue,
        orderTiming: locationSettingsData.orderTiming || {
          acceptOrdersAfterMinutes: 30,
          stopOrdersBeforeMinutes: 30,
        },
      };

      setIsLoading(false);
    }
  }, [locationSettingsData]);

  // Handle working hours update
  const handleWorkingHoursChange = (updatedHours: WorkingHour[]) => {
    dataChangedByUserRef.current = true;
    setWorkingHours(updatedHours);
  };

  // Handle toggle for a specific day's working hours
  const updateStoreOpen = (index: number) => {
    dataChangedByUserRef.current = true;
    const updated = [...workingHours];
    updated[index].isOpen = !updated[index].isOpen;

    if (!updated[index].isOpen) {
      updated[index].startTime = null;
      updated[index].endTime = null;
    } else if (!updated[index].startTime && !updated[index].endTime) {
      // Set default values if opening and no times are set
      updated[index].startTime = '08:00';
      updated[index].endTime = '17:00';
    }

    setWorkingHours(updated);
  };

  // Handle time change for a specific day
  const updateWorkingHours = (index: number, key: 'startTime' | 'endTime', value: string) => {
    dataChangedByUserRef.current = true;
    const updated = [...workingHours];
    updated[index][key] = value;
    setWorkingHours(updated);
  };

  // Handle timezone update
  const updateTimezone = (newTimezone: string) => {
    dataChangedByUserRef.current = true;
    setTimezone(newTimezone);
  };

  // Update UI values when orderTiming changes
  useEffect(() => {
    if (orderTiming) {
      // Ensure we're treating 0 as a valid value
      setStartAcceptMinutes(
        typeof orderTiming.acceptOrdersAfterMinutes === 'number' ? orderTiming.acceptOrdersAfterMinutes : 30,
      );
      setStopAcceptMinutes(
        typeof orderTiming.stopOrdersBeforeMinutes === 'number' ? orderTiming.stopOrdersBeforeMinutes : 30,
      );
    }
  }, [orderTiming]);

  // Handle order timing update - used internally by other functions
  const updateOrderTimingValue = (field: keyof OrderTimingSettings, value: number) => {
    dataChangedByUserRef.current = true;
    setOrderTiming((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle start time range change
  const updateStartAcceptOrders = (e: CustomEvent) => {
    const newValue = parseInt(e.detail.value, 10);
    // Ensure value is treated as a number, including zero
    setStartAcceptMinutes(newValue);
    updateOrderTimingValue('acceptOrdersAfterMinutes', newValue);
  };

  // Handle stop time range change
  const updateStopAcceptOrders = (e: CustomEvent) => {
    const newValue = parseInt(e.detail.value, 10);
    // Ensure value is treated as a number, including zero
    setStopAcceptMinutes(newValue);
    updateOrderTimingValue('stopOrdersBeforeMinutes', newValue);
  };

  // Save changes to the server
  const saveSettings = async () => {
    if (!restaurantId || !locationId) {
      presentToast({
        message: 'Restaurant ID or Location ID is missing',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    updateSettings(
      {
        restaurantId,
        locationId,
        workingHours,
        timezone,
        orderTiming,
      },
      {
        onSuccess: () => {
          presentToast({
            message: 'Location settings updated successfully',
            duration: 3000,
            color: 'success',
          });
          // Reset the user change flag after successful save
          dataChangedByUserRef.current = false;
          refetch();
        },
        onError: (error) => {
          presentToast({
            message: `Failed to update location settings: ${error.message}`,
            duration: 3000,
            color: 'danger',
          });
        },
      },
    );
  };

  // Debounce timer ref for auto-saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save when workingHours, timezone, or orderTiming changes
  useEffect(() => {
    if (isLoading || isLoadingData) {
      return;
    }

    if (!dataChangedByUserRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (restaurantId && locationId && workingHours.length > 0) {
        saveSettings();
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workingHours, timezone, orderTiming]);

  return {
    workingHours,
    timezone,
    orderTiming,
    isLoading: isLoading || isLoadingData,
    isUpdating,
    error,
    handleWorkingHoursChange,
    updateTimezone,
    updateOrderTimingValue,
    updateStoreOpen,
    updateWorkingHours,
    // Order timing UI values and handlers
    startAcceptMinutes,
    stopAcceptMinutes,
    updateStartAcceptOrders,
    updateStopAcceptOrders,
    // Timezone data
    timezones,
  };
}
