import { useState, useEffect, useCallback } from 'react';
import { Medicine } from '@/types';

export interface NotificationData {
  lowStock: Medicine[];
  outOfStock: Medicine[];
  expired: Medicine[];
  totalAlerts: number;
}

interface UseNotificationsReturn extends NotificationData {
  showModal: boolean;
  toggleModal: () => void;
  closeModal: () => void;
  openModal: () => void;
  clearAllNotifications: () => void;
}

/**
 * useNotifications Hook
 * 
 * Analyzes medicine list and categorizes them into three alert types:
 * - Low stock (quantity < 10 or below lowStockThreshold)
 * - Out of stock (quantity === 0)
 * - Expired (expiryDate < today)
 * 
 * @param medicines - Array of medicine objects to analyze
 * @param autoOpen - Whether to auto-open modal on first alert (default: true)
 * @returns Object containing alert categories, modal state, and control functions
 */
export const useNotifications = (
  medicines: Medicine[],
  autoOpen: boolean = true
): UseNotificationsReturn => {
  const [showModal, setShowModal] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    lowStock: [],
    outOfStock: [],
    expired: [],
    totalAlerts: 0,
  });

  /**
   * Get today's date at midnight for comparison
   */
  const getTodayDate = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  /**
   * Analyze medicines and categorize them into alerts
   */
  const analyzeMedicines = useCallback(() => {
    const today = getTodayDate();
    const lowStockList: Medicine[] = [];
    const outOfStockList: Medicine[] = [];
    const expiredList: Medicine[] = [];

    medicines.forEach((medicine) => {
      // Check for out of stock (quantity === 0)
      if (medicine.quantity === 0) {
        outOfStockList.push(medicine);
      }
      // Check for low stock (quantity < 10 or below threshold)
      else if (medicine.quantity < 10 || medicine.quantity < medicine.lowStockThreshold) {
        lowStockList.push(medicine);
      }

      // Check for expired medicines
      const expiryDate = new Date(medicine.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        expiredList.push(medicine);
      }
    });

    const totalAlerts = lowStockList.length + outOfStockList.length + expiredList.length;

    setNotificationData({
      lowStock: lowStockList,
      outOfStock: outOfStockList,
      expired: expiredList,
      totalAlerts,
    });

    // Auto-open modal on first load if there are alerts
    if (
      autoOpen &&
      !hasAutoOpened &&
      totalAlerts > 0
    ) {
      setShowModal(true);
      setHasAutoOpened(true);
    }
  }, [medicines, autoOpen, hasAutoOpened]);

  /**
   * Re-analyze when medicines change
   */
  useEffect(() => {
    analyzeMedicines();
  }, [analyzeMedicines]);

  const toggleModal = useCallback(() => {
    setShowModal((prev) => !prev);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotificationData({
      lowStock: [],
      outOfStock: [],
      expired: [],
      totalAlerts: 0,
    });
  }, []);

  return {
    ...notificationData,
    showModal,
    toggleModal,
    closeModal,
    openModal,
    clearAllNotifications,
  };
};