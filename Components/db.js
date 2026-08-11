import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentUser as defaultUser } from './data';

const STORAGE_KEYS = {
  USER_PROFILE: '@voltcharge_user_profile',
  BOOKINGS: '@voltcharge_bookings',
  WALLET_TRANSACTIONS: '@voltcharge_wallet_txns',
  FAVORITES: '@voltcharge_favorites',
  ACTIVE_SESSION: '@voltcharge_active_session',
  SELECTED_CITY: '@voltcharge_selected_city',
};

// Initial default seed bookings
const defaultSeedBookings = [
  {
    id: 'VC-782194',
    stationId: 'PUNE_TATA_BANER',
    stationName: 'Tata Power EZ Charge MegaHub - Baner, Pune',
    portName: 'Port 01 (Dual Gun DC 120kW)',
    durationMins: 30,
    kwhCharged: 25.0,
    cost: 450,
    date: '2026-08-10T14:30:00.000Z',
    status: 'completed',
    vehicle: 'Tata Nexon EV Max',
  },
  {
    id: 'VC-619402',
    stationId: 'PUNE_TESLA_HINJAWADI',
    stationName: 'Tesla Supercharger Hub - Hinjawadi Phase 1, Pune',
    portName: 'Port 02 (V3 Supercharger 250kW)',
    durationMins: 20,
    kwhCharged: 32.5,
    cost: 780,
    date: '2026-08-08T18:15:00.000Z',
    status: 'completed',
    vehicle: 'Tata Nexon EV Max',
  },
];

// Initial default wallet transactions
const defaultSeedTransactions = [
  { id: 'TXN-901', type: 'debit', title: 'Charging Session #VC-782194', amount: 450, date: '10 Aug 2026' },
  { id: 'TXN-902', type: 'credit', title: 'Wallet Top-up (UPI)', amount: 1000, date: '09 Aug 2026' },
  { id: 'TXN-903', type: 'debit', title: 'Charging Session #VC-619402', amount: 780, date: '08 Aug 2026' },
];

export const DB = {
  // User Profile
  async getUserProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : defaultUser;
    } catch (e) {
      return defaultUser;
    }
  },

  async updateUserProfile(profile) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return true;
    } catch (e) {
      return false;
    }
  },

  // Bookings CRUD
  async getBookings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : defaultSeedBookings;
    } catch (e) {
      return defaultSeedBookings;
    }
  },

  async saveBooking(newBooking) {
    try {
      const current = await this.getBookings();
      const updated = [newBooking, ...current];
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
      
      // Also record transaction
      if (newBooking.cost) {
        await this.addTransaction({
          id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'debit',
          title: `Slot Reservation #${newBooking.id}`,
          amount: newBooking.cost,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        });
      }
      return updated;
    } catch (e) {
      return [];
    }
  },

  async cancelBooking(bookingId) {
    try {
      const current = await this.getBookings();
      const updated = current.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  // Wallet & Transactions
  async getTransactions() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_TRANSACTIONS);
      return data ? JSON.parse(data) : defaultSeedTransactions;
    } catch (e) {
      return defaultSeedTransactions;
    }
  },

  async addTransaction(txn) {
    try {
      const current = await this.getTransactions();
      const updated = [txn, ...current];
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_TRANSACTIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  async addWalletBalance(amount) {
    try {
      const user = await this.getUserProfile();
      user.walletBalance = (user.walletBalance || 0) + amount;
      await this.updateUserProfile(user);

      await this.addTransaction({
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'credit',
        title: 'Wallet Top-Up (Instant UPI)',
        amount,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      });

      return user.walletBalance;
    } catch (e) {
      return 0;
    }
  },

  // Favorites
  async getFavorites() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : ['PUNE_TESLA_HINJAWADI', 'PUNE_TATA_BANER'];
    } catch (e) {
      return ['PUNE_TESLA_HINJAWADI', 'PUNE_TATA_BANER'];
    }
  },

  async toggleFavorite(stationId) {
    try {
      const current = await this.getFavorites();
      const updated = current.includes(stationId)
        ? current.filter((id) => id !== stationId)
        : [...current, stationId];
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },
};
