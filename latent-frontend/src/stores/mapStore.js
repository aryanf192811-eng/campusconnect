import { create } from 'zustand';

export const useMapStore = create((set) => ({
  selectedLocation: null,
  filterCategory: 'all',
  searchQuery: '',
  showLabels: false,

  setSelectedLocation: (location) => set({ selectedLocation: location }),
  clearSelectedLocation: () => set({ selectedLocation: null }),
  setFilterCategory: (cat) => set({ filterCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowLabels: (val) => set({ showLabels: val }),
}));
