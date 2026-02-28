import { create } from 'zustand';
import { bookingsAPI } from '../services/api';

const useBookingStore = create((set, get) => ({
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,

  // Fetch all bookings
  fetchBookings: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingsAPI.getAll(params);
      const { bookings } = response.data.data;

      set({
        bookings,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to fetch bookings';
      set({ isLoading: false, error: errorMessage });
    }
  },

  // Fetch single booking
  fetchBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingsAPI.getById(bookingId);
      const { booking } = response.data.data;

      set({
        currentBooking: booking,
        isLoading: false,
        error: null,
      });

      return { success: true, booking };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to fetch booking';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Create booking
  createBooking: async (bookingData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingsAPI.create(bookingData);
      const { booking } = response.data.data;

      // Add to bookings list
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isLoading: false,
        error: null,
      }));

      return { success: true, booking };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to create booking';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Update booking
  updateBooking: async (bookingId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingsAPI.update(bookingId, data);
      const { booking } = response.data.data;

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? booking : b
        ),
        currentBooking:
          state.currentBooking?.id === bookingId
            ? booking
            : state.currentBooking,
        isLoading: false,
        error: null,
      }));

      return { success: true, booking };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to update booking';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bookingsAPI.cancel(bookingId);
      const { booking } = response.data.data;

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? booking : b
        ),
        currentBooking:
          state.currentBooking?.id === bookingId
            ? booking
            : state.currentBooking,
        isLoading: false,
        error: null,
      }));

      return { success: true, booking };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to cancel booking';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Clear current booking
  clearCurrentBooking: () => set({ currentBooking: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useBookingStore;
