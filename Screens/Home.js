import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../Components/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Card from '../Components/card';
import { stations as allStations, currentUser, manufacturerBrands, availableCities } from '../Components/data';
import { calculateDistanceKm, formatDistance, estimateTravelTime, detectRealLocation } from '../Components/locationUtils';
import { DB } from '../Components/db';

function Home({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFastDC, setOnlyFastDC] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'speed', 'rating', 'price'
  
  // Database States
  const [userProfile, setUserProfile] = useState(currentUser);
  const [walletBalance, setWalletBalance] = useState(currentUser.walletBalance);
  const [favoriteIds, setFavoriteIds] = useState(currentUser.savedStations || ['PUNE_TESLA_HINJAWADI']);
  const [bookingsList, setBookingsList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);

  // Location & City Switcher State (Default: Pune)
  const [selectedCityId, setSelectedCityId] = useState('pune');
  const [userLocation, setUserLocation] = useState(currentUser.defaultLocation);
  const [locationName, setLocationName] = useState('Pune, Maharashtra');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Modals State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');

  // Load persistent data from Local Database on mount
  useEffect(() => {
    loadDatabaseState();
    autoDetectLocation();
  }, []);

  const loadDatabaseState = async () => {
    const profile = await DB.getUserProfile();
    const bookings = await DB.getBookings();
    const favs = await DB.getFavorites();
    const txns = await DB.getTransactions();

    setUserProfile(profile);
    setWalletBalance(profile.walletBalance || 1450);
    setBookingsList(bookings);
    setFavoriteIds(favs);
    setTransactionsList(txns);
  };

  // Auto-detect real location using GPS / IP Network
  const autoDetectLocation = async (userInitiated = false) => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectRealLocation();
      setUserLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: loc.cityName,
      });
      setLocationName(loc.cityName);

      // Match city id if in Pune, Mumbai, etc.
      const lower = loc.cityName.toLowerCase();
      if (lower.includes('pune')) setSelectedCityId('pune');
      else if (lower.includes('mumbai')) setSelectedCityId('mumbai');
      else if (lower.includes('delhi') || lower.includes('gurugram')) setSelectedCityId('delhi');
      else if (lower.includes('bengaluru')) setSelectedCityId('bengaluru');
      else if (lower.includes('hyderabad')) setSelectedCityId('hyderabad');

      if (userInitiated) {
        Alert.alert('Location Updated 📍', `Detected Location: ${loc.cityName}\nNearest charging stations recalculated.`);
      }
    } catch (e) {
      setLocationName('Pune, Maharashtra');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Switch City Manually
  const handleSelectCity = (city) => {
    setSelectedCityId(city.id);
    setUserLocation({
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
    });
    setLocationName(city.name);
    setShowCityModal(false);
  };

  // Toggle favorite station in Local DB
  const toggleFavorite = async (stationId) => {
    const updated = await DB.toggleFavorite(stationId);
    setFavoriteIds(updated);
  };

  // Wallet Top-Up Handler
  const handleTopUpWallet = async (amount) => {
    const num = parseInt(amount, 10);
    if (!num || num <= 0) return;
    const newBal = await DB.addWalletBalance(num);
    setWalletBalance(newBal);
    const txns = await DB.getTransactions();
    setTransactionsList(txns);
    Alert.alert('Payment Successful! 💳', `Added ₹${num} to your VoltCharge Wallet.\nCurrent Balance: ₹${newBal}`);
  };

  // Cancel Booking in Local DB
  const handleCancelBooking = async (bookingId, cost) => {
    Alert.alert('Cancel Slot Reservation', 'Are you sure? Your payment will be refunded to your wallet.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel & Refund',
        style: 'destructive',
        onPress: async () => {
          const updated = await DB.cancelBooking(bookingId);
          setBookingsList(updated);
          if (cost) {
            const newBal = await DB.addWalletBalance(cost);
            setWalletBalance(newBal);
          }
          Alert.alert('Cancelled & Refunded', 'Slot reservation cancelled. ₹' + cost + ' has been refunded to your wallet.');
        },
      },
    ]);
  };

  // Calculate live dynamic distance & sort all stations from user's current city/GPS
  const processedStations = useMemo(() => {
    const userLat = userLocation?.latitude || 18.5204;
    const userLon = userLocation?.longitude || 73.8567;

    // Map each station with calculated live distance from user GPS
    const listWithDistance = allStations.map((st) => {
      const dist = calculateDistanceKm(userLat, userLon, st.latitude, st.longitude);
      const travelTime = estimateTravelTime(dist);
      return {
        ...st,
        calculatedDistanceKm: dist,
        calculatedTime: travelTime,
      };
    });

    // Filter by City, Brand, Availability, Speed, Favorites, and Search Query
    const filtered = listWithDistance.filter((station) => {
      // Favorites filter
      if (onlyFavorites && !favoriteIds.includes(station.id)) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'all' && station.company.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      // Available ports filter
      if (onlyAvailable && station.availablePortsCount === 0) {
        return false;
      }
      // Fast DC filter (>= 60kW)
      if (onlyFastDC && station.maxPowerKw < 60) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = station.stationName.toLowerCase().includes(query);
        const matchesAddress = station.address.toLowerCase().includes(query);
        const matchesBrand = station.company.toLowerCase().includes(query);
        const matchesCity = (station.cityName || '').toLowerCase().includes(query);
        return matchesName || matchesAddress || matchesBrand || matchesCity;
      }
      return true;
    });

    // Sort according to active sort criteria (Default: Distance - Nearest First)
    return filtered.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.calculatedDistanceKm - b.calculatedDistanceKm;
      }
      if (sortBy === 'speed') {
        return b.maxPowerKw - a.maxPowerKw;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'price') {
        return a.pricePerKwh - b.pricePerKwh;
      }
      return 0;
    });
  }, [userLocation, searchQuery, selectedBrand, onlyAvailable, onlyFastDC, onlyFavorites, sortBy, favoriteIds]);

  // Closest station ID (if sorted by distance)
  const closestStationId = processedStations.length > 0 && sortBy === 'distance' ? processedStations[0].id : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity 
            style={styles.profileSection} 
            activeOpacity={0.8}
            onPress={() => setShowProfileModal(true)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AR</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.greetingText}>Hello, {userProfile.name.split(' ')[0]} ⚡</Text>
              
              {/* Interactive City / Location Selector */}
              <TouchableOpacity 
                style={styles.locationPill}
                activeOpacity={0.7}
                onPress={() => setShowCityModal(true)}
              >
                {isDetectingLocation ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 4 }} />
                ) : (
                  <Ionicons name="location-sharp" size={13} color={Colors.primaryNeon} />
                )}
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationName}
                </Text>
                <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Bookings / Sessions Button */}
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.7}
              onPress={() => setShowBookingsModal(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.textPrimary} />
              {bookingsList.filter((b) => b.status !== 'cancelled').length > 0 && (
                <View style={styles.dotBadge} />
              )}
            </TouchableOpacity>

            {/* Wallet Button */}
            <TouchableOpacity 
              style={[styles.iconButton, { marginLeft: 6 }]} 
              activeOpacity={0.7}
              onPress={() => setShowWalletModal(true)}
            >
              <MaterialCommunityIcons name="wallet-outline" size={18} color={Colors.primaryDark} />
              <View style={styles.walletBadge}>
                <Text style={styles.walletBadgeText}>₹{walletBalance}</Text>
              </View>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity 
              style={[styles.iconButton, { marginLeft: 6 }]} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Location Proximity Banner with Pune Highlighting */}
        <View style={styles.gpsBanner}>
          <View style={styles.gpsBannerLeft}>
            <View style={styles.gpsPulseCircle}>
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.gpsBannerTitle}>Location: {locationName}</Text>
              <Text style={styles.gpsBannerSub}>
                {processedStations.length} EV stations calculated • {formatDistance(processedStations[0]?.calculatedDistanceKm || 0)} nearest
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.gpsRefreshBtn}
            onPress={() => autoDetectLocation(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={14} color={Colors.primaryDark} />
            <Text style={styles.gpsRefreshText}>Auto-Detect</Text>
          </TouchableOpacity>
        </View>

        {/* Connected EV Status Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleSub}>Connected Vehicle</Text>
              <Text style={styles.vehicleName}>{userProfile.vehicle?.model || 'Tata Nexon EV Max'}</Text>
            </View>
            <View style={styles.portBadge}>
              <MaterialCommunityIcons name="ev-plug-ccs2" size={14} color={Colors.primaryNeon} />
              <Text style={styles.portBadgeText}>{userProfile.vehicle?.portType || 'CCS-2'}</Text>
            </View>
          </View>

          <View style={styles.batteryProgressContainer}>
            <View style={styles.batteryBarBg}>
              <View 
                style={[
                  styles.batteryBarFill, 
                  { width: `${userProfile.vehicle?.currentBatteryPct || 78}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.vehicleStatsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.vehicle?.currentBatteryPct || 78}%</Text>
              <Text style={styles.statLabel}>Battery Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.vehicle?.estimatedRangeKm || 284} km</Text>
              <Text style={styles.statLabel}>Remaining Range</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.vehicle?.fastChargeSpeedKw || 50} kW</Text>
              <Text style={styles.statLabel}>Max DC Speed</Text>
            </View>
          </View>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Pune, Baner, Hinjawadi, Mumbai, or Hub Name..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Brand & Filter Pills */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {manufacturerBrands.map((brand) => {
              const isSelected = selectedBrand === brand.id && !onlyFavorites;
              return (
                <TouchableOpacity
                  key={brand.id}
                  activeOpacity={0.8}
                  style={[
                    styles.brandPill,
                    isSelected && styles.brandPillActive,
                  ]}
                  onPress={() => {
                    setSelectedBrand(brand.id);
                    setOnlyFavorites(false);
                  }}
                >
                  <Ionicons 
                    name={brand.icon} 
                    size={15} 
                    color={isSelected ? '#FFFFFF' : brand.color} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    styles.brandPillText,
                    isSelected && styles.brandPillTextActive,
                  ]}>
                    {brand.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Favorites Toggle Pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.quickFilterPill,
                onlyFavorites && styles.quickFilterPillActive,
              ]}
              onPress={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Ionicons 
                name={onlyFavorites ? "heart" : "heart-outline"} 
                size={14} 
                color={onlyFavorites ? '#FFFFFF' : '#EF4444'} 
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.quickFilterText,
                onlyFavorites && styles.quickFilterTextActive,
              ]}>
                Favorites ({favoriteIds.length})
              </Text>
            </TouchableOpacity>

            {/* Fast DC toggle pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.quickFilterPill,
                onlyFastDC && styles.quickFilterPillActive,
              ]}
              onPress={() => setOnlyFastDC(!onlyFastDC)}
            >
              <Ionicons 
                name="flash" 
                size={14} 
                color={onlyFastDC ? '#FFFFFF' : Colors.accentOrange} 
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.quickFilterText,
                onlyFastDC && styles.quickFilterTextActive,
              ]}>
                60kW+ Fast DC
              </Text>
            </TouchableOpacity>

            {/* Available Now toggle pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.quickFilterPill,
                onlyAvailable && styles.quickFilterPillActive,
              ]}
              onPress={() => setOnlyAvailable(!onlyAvailable)}
            >
              <View style={[
                styles.filterDot,
                { backgroundColor: onlyAvailable ? '#FFFFFF' : Colors.success }
              ]} />
              <Text style={[
                styles.quickFilterText,
                onlyAvailable && styles.quickFilterTextActive,
              ]}>
                Available Now
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Sorting Bar */}
        <View style={styles.sortingBar}>
          <Text style={styles.sortLabel}>Sort By:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
            {[
              { id: 'distance', label: '📍 Nearest First' },
              { id: 'speed', label: '⚡ Fastest Power' },
              { id: 'rating', label: '★ Top Rated' },
              { id: 'price', label: '💰 Lowest Price' },
            ].map((sortOption) => {
              const isSelected = sortBy === sortOption.id;
              return (
                <TouchableOpacity
                  key={sortOption.id}
                  style={[styles.sortChip, isSelected && styles.sortChipActive]}
                  onPress={() => setSortBy(sortOption.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sortChipText, isSelected && styles.sortChipTextActive]}>
                    {sortOption.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {onlyFavorites
                ? 'Saved Favorite Stations'
                : selectedBrand === 'all'
                ? `Charging Hubs in ${locationName.split(',')[0]}`
                : `${selectedBrand} Stations in ${locationName.split(',')[0]}`}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Found {processedStations.length} charging locations
            </Text>
          </View>

          {(selectedBrand !== 'all' || onlyFastDC || onlyAvailable || onlyFavorites || searchQuery || sortBy !== 'distance') && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedBrand('all');
                setOnlyFastDC(false);
                setOnlyAvailable(false);
                setOnlyFavorites(false);
                setSearchQuery('');
                setSortBy('distance');
              }}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Station Cards List with Proximity Sorting */}
        {processedStations.length > 0 ? (
          processedStations.map((station) => (
            <Card
              key={station.id}
              station={station}
              userLocation={userLocation}
              isClosest={station.id === closestStationId}
              isFavorite={favoriteIds.includes(station.id)}
              onToggleFavorite={toggleFavorite}
              onPress={() => navigation.navigate('IndividualPage', { station, userLocation })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="ev-station" size={54} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No Charging Stations Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try selecting a different city like Pune or Mumbai, or adjusting your filter criteria.
            </Text>
            <TouchableOpacity 
              style={styles.emptyResetButton}
              onPress={() => {
                setSelectedBrand('all');
                setOnlyFastDC(false);
                setOnlyAvailable(false);
                setOnlyFavorites(false);
                setSearchQuery('');
                setSortBy('distance');
              }}
            >
              <Text style={styles.emptyResetText}>View All Stations</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ==========================================
          CITY SELECTOR MODAL
         ========================================== */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose City / Region</Text>
                <Text style={styles.modalSubTitle}>Select city to view nearby charging networks</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* GPS Auto-Detect Button in Modal */}
            <TouchableOpacity 
              style={styles.modalGpsAutoBtn}
              onPress={() => {
                setShowCityModal(false);
                autoDetectLocation(true);
              }}
            >
              <Ionicons name="navigate-circle" size={22} color={Colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.modalGpsAutoTitle}>Use Current Live GPS Location</Text>
                <Text style={styles.modalGpsAutoSub}>Detects exact street & nearest charging bays</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.citySectionHeader}>Supported Hub Cities</Text>

            {availableCities.map((city) => {
              const isSelected = selectedCityId === city.id;
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.cityRow, isSelected && styles.cityRowActive]}
                  onPress={() => handleSelectCity(city)}
                >
                  <View style={styles.cityRowLeft}>
                    <Ionicons 
                      name="location" 
                      size={18} 
                      color={isSelected ? Colors.primaryNeon : Colors.textMuted} 
                    />
                    <Text style={[styles.cityName, isSelected && styles.cityNameActive]}>
                      {city.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primaryNeon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ==========================================
          MY BOOKINGS & SESSIONS MODAL
         ========================================== */}
      <Modal
        visible={showBookingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>My Slot Reservations</Text>
                <Text style={styles.modalSubTitle}>Active passes and charging history</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBookingsModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {bookingsList.length > 0 ? (
                bookingsList.map((booking) => {
                  const isCancelled = booking.status === 'cancelled';
                  return (
                    <View key={booking.id} style={[styles.bookingCard, isCancelled && styles.bookingCardCancelled]}>
                      <View style={styles.bookingCardTop}>
                        <View>
                          <Text style={styles.bookingRefText}>Pass #{booking.id}</Text>
                          <Text style={styles.bookingStationName}>{booking.stationName}</Text>
                        </View>
                        <View style={[
                          styles.bookingStatusPill,
                          isCancelled ? styles.statusCancelBg : styles.statusActiveBg
                        ]}>
                          <Text style={[
                            styles.bookingStatusText,
                            isCancelled ? styles.statusCancelText : styles.statusActiveText
                          ]}>
                            {isCancelled ? 'Cancelled' : 'Confirmed'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bookingDetailsRow}>
                        <Text style={styles.bookingDetailItem}>🔌 {booking.portName}</Text>
                        <Text style={styles.bookingDetailItem}>⏱ {booking.durationMins} Mins</Text>
                        <Text style={[styles.bookingDetailItem, { fontWeight: 'bold', color: Colors.primaryDark }]}>
                          ₹{booking.cost}
                        </Text>
                      </View>

                      {!isCancelled && (
                        <View style={styles.bookingActionsRow}>
                          <TouchableOpacity 
                            style={styles.cancelBookingBtn}
                            onPress={() => handleCancelBooking(booking.id, booking.cost)}
                          >
                            <Text style={styles.cancelBookingBtnText}>Cancel & Refund</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', padding: Spacing.xl }}>
                  <Text style={{ color: Colors.textMuted }}>No active bookings yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          WALLET & PAYMENTS MODAL
         ========================================== */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>VoltCharge Wallet</Text>
                <Text style={styles.modalSubTitle}>Instant zero-fee EV charging balance</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Wallet Balance Card */}
            <View style={styles.walletHeroCard}>
              <Text style={styles.walletHeroLabel}>Available Balance</Text>
              <Text style={styles.walletHeroValue}>₹{walletBalance}</Text>
              <Text style={styles.walletHeroSub}>Auto-applied at all verified charging bays</Text>
            </View>

            <Text style={styles.citySectionHeader}>Quick Add Funds (UPI / Card)</Text>
            <View style={styles.topUpRow}>
              {['500', '1000', '2000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.topUpBtn}
                  onPress={() => handleTopUpWallet(amt)}
                >
                  <Text style={styles.topUpBtnText}>+₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.citySectionHeader}>Recent Transactions</Text>
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              {transactionsList.map((txn) => (
                <View key={txn.id} style={styles.txnRow}>
                  <View>
                    <Text style={styles.txnTitle}>{txn.title}</Text>
                    <Text style={styles.txnDate}>{txn.date}</Text>
                  </View>
                  <Text style={[
                    styles.txnAmount,
                    txn.type === 'credit' ? styles.txnCredit : styles.txnDebit
                  ]}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          DRIVER & VEHICLE PROFILE MODAL
         ========================================== */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Driver & Vehicle Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDriverCard}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>AR</Text>
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.modalDriverName}>{userProfile.name}</Text>
                <Text style={styles.modalDriverEmail}>{userProfile.email}</Text>
                <Text style={styles.modalDriverCity}>📍 {locationName}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsGridItem}>
                <MaterialCommunityIcons name="wallet" size={22} color={Colors.primaryDark} />
                <Text style={styles.statsGridValue}>₹{walletBalance}</Text>
                <Text style={styles.statsGridLabel}>Wallet</Text>
              </View>
              <View style={styles.statsGridItem}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color={Colors.accentOrange} />
                <Text style={styles.statsGridValue}>{userProfile.totalKwhCharged} kWh</Text>
                <Text style={styles.statsGridLabel}>Total Charged</Text>
              </View>
              <View style={styles.statsGridItem}>
                <MaterialCommunityIcons name="leaf" size={22} color={Colors.success} />
                <Text style={styles.statsGridValue}>{userProfile.co2SavedKg} kg</Text>
                <Text style={styles.statsGridLabel}>CO2 Offset</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.xs,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.sm,
  },
  greetingText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 165,
  },
  locationText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    marginLeft: 3,
    fontWeight: Typography.weights.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  dotBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  walletBadge: {
    marginLeft: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  walletBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  gpsBanner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    ...Shadows.sm,
  },
  gpsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  gpsPulseCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsBannerTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  gpsBannerSub: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(5, 182, 107, 0.3)',
  },
  gpsRefreshText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
    marginLeft: 4,
  },
  vehicleCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    marginVertical: Spacing.sm,
    ...Shadows.lg,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  portBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 182, 107, 0.18)',
    borderWidth: 1,
    borderColor: Colors.primaryNeon,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  portBadgeText: {
    color: Colors.primaryNeon,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    marginLeft: 4,
  },
  batteryProgressContainer: {
    marginVertical: Spacing.md,
  },
  batteryBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryNeon,
    borderRadius: 4,
  },
  vehicleStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  clearSearch: {
    padding: 4,
  },
  filterSection: {
    marginVertical: Spacing.xs,
  },
  filterScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  brandPillActive: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surfaceDark,
  },
  brandPillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  brandPillTextActive: {
    color: '#FFFFFF',
  },
  quickFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  quickFilterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickFilterText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  sortingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  sortLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
    marginRight: 6,
  },
  sortOptions: {
    gap: 6,
  },
  sortChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surfaceDark,
  },
  sortChipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resetFilterText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyStateSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyResetButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  emptyResetText: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalSubTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalGpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(5, 182, 107, 0.3)',
    marginBottom: Spacing.md,
  },
  modalGpsAutoTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  modalGpsAutoSub: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  citySectionHeader: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: Spacing.xs,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cityRowActive: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  cityNameActive: {
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  bookingCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bookingCardCancelled: {
    opacity: 0.6,
  },
  bookingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingRefText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  bookingStationName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
    maxWidth: 220,
  },
  bookingStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusActiveBg: {
    backgroundColor: Colors.successLight,
  },
  statusActiveText: {
    color: Colors.success,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  statusCancelBg: {
    backgroundColor: Colors.dangerLight,
  },
  statusCancelText: {
    color: Colors.danger,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  bookingDetailItem: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  bookingActionsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  cancelBookingBtn: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  cancelBookingBtnText: {
    color: Colors.danger,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  walletHeroCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.sm,
    ...Shadows.md,
  },
  walletHeroLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  walletHeroValue: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryNeon,
    marginVertical: 4,
  },
  walletHeroSub: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
  },
  topUpRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  topUpBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(5, 182, 107, 0.3)',
  },
  topUpBtnText: {
    color: Colors.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  txnTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  txnDate: {
    fontSize: Typography.sizes.xs - 2,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  txnCredit: {
    color: Colors.success,
  },
  txnDebit: {
    color: Colors.textPrimary,
  },
  modalDriverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  modalAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  },
  modalDriverName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalDriverEmail: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalDriverCity: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
    gap: 8,
  },
  statsGridItem: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statsGridValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 6,
  },
  statsGridLabel: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});

export default Home;