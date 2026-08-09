import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../Components/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Card from '../Components/card';
import { stations, currentUser, manufacturerBrands } from '../Components/data';

function Home({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFastDC, setOnlyFastDC] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(currentUser.savedStations || ['TS1']);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Toggle favorite station
  const toggleFavorite = (stationId) => {
    setFavoriteIds((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId]
    );
  };

  // Filter stations based on search, brand, availability, and speed
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
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
        return matchesName || matchesAddress || matchesBrand;
      }
      return true;
    });
  }, [searchQuery, selectedBrand, onlyAvailable, onlyFastDC]);

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
              <Text style={styles.greetingText}>Hello, {currentUser.name.split(' ')[0]} ⚡</Text>
              <View style={styles.locationPill}>
                <Ionicons name="location-sharp" size={12} color={Colors.primary} />
                <Text style={styles.locationText}>New Delhi & NCR</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.7}
              onPress={() => setShowProfileModal(true)}
            >
              <MaterialCommunityIcons name="wallet-outline" size={20} color={Colors.textPrimary} />
              <View style={styles.walletBadge}>
                <Text style={styles.walletBadgeText}>₹1.4k</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.iconButton, { marginLeft: 8 }]} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected EV Status Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleSub}>Connected Vehicle</Text>
              <Text style={styles.vehicleName}>{currentUser.vehicle.model}</Text>
            </View>
            <View style={styles.portBadge}>
              <MaterialCommunityIcons name="ev-plug-ccs2" size={14} color={Colors.primaryNeon} />
              <Text style={styles.portBadgeText}>{currentUser.vehicle.portType}</Text>
            </View>
          </View>

          <View style={styles.batteryProgressContainer}>
            <View style={styles.batteryBarBg}>
              <View 
                style={[
                  styles.batteryBarFill, 
                  { width: `${currentUser.vehicle.currentBatteryPct}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.vehicleStatsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.vehicle.currentBatteryPct}%</Text>
              <Text style={styles.statLabel}>Battery Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.vehicle.estimatedRangeKm} km</Text>
              <Text style={styles.statLabel}>Remaining Range</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.vehicle.fastChargeSpeedKw} kW</Text>
              <Text style={styles.statLabel}>Max DC Speed</Text>
            </View>
          </View>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations, highway, city, or brand..."
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
              const isSelected = selectedBrand === brand.id;
              return (
                <TouchableOpacity
                  key={brand.id}
                  activeOpacity={0.8}
                  style={[
                    styles.brandPill,
                    isSelected && styles.brandPillActive,
                  ]}
                  onPress={() => setSelectedBrand(brand.id)}
                >
                  <Ionicons 
                    name={brand.icon} 
                    size={16} 
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

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {selectedBrand === 'all' ? 'Nearby Charging Hubs' : `${selectedBrand} Stations`}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Found {filteredStations.length} charging locations
            </Text>
          </View>

          {(selectedBrand !== 'all' || onlyFastDC || onlyAvailable || searchQuery) && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedBrand('all');
                setOnlyFastDC(false);
                setOnlyAvailable(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Station Cards List */}
        {filteredStations.length > 0 ? (
          filteredStations.map((station) => (
            <Card
              key={station.id}
              station={station}
              isFavorite={favoriteIds.includes(station.id)}
              onToggleFavorite={toggleFavorite}
              onPress={() => navigation.navigate('IndividualPage', { station })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="ev-station" size={54} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No Charging Stations Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search terms, changing filters, or selecting a different brand.
            </Text>
            <TouchableOpacity 
              style={styles.emptyResetButton}
              onPress={() => {
                setSelectedBrand('all');
                setOnlyFastDC(false);
                setOnlyAvailable(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.emptyResetText}>View All Stations</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Driver Profile & EV Stats Modal */}
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
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.modalDriverName}>{currentUser.name}</Text>
                <Text style={styles.modalDriverEmail}>{currentUser.email}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsGridItem}>
                <MaterialCommunityIcons name="wallet" size={22} color={Colors.primaryDark} />
                <Text style={styles.statsGridValue}>₹{currentUser.walletBalance}</Text>
                <Text style={styles.statsGridLabel}>Wallet Balance</Text>
              </View>
              <View style={styles.statsGridItem}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color={Colors.accentOrange} />
                <Text style={styles.statsGridValue}>{currentUser.totalKwhCharged} kWh</Text>
                <Text style={styles.statsGridLabel}>Total Charged</Text>
              </View>
              <View style={styles.statsGridItem}>
                <MaterialCommunityIcons name="leaf" size={22} color={Colors.success} />
                <Text style={styles.statsGridValue}>{currentUser.co2SavedKg} kg</Text>
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
  },
  locationText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginLeft: 3,
    fontWeight: Typography.weights.medium,
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
  vehicleCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    marginVertical: Spacing.sm + 2,
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
    marginVertical: Spacing.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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