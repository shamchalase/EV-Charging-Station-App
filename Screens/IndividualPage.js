import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Modal,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../Components/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { stations, currentUser } from '../Components/data';
import { formatDistance, estimateTravelTime } from '../Components/locationUtils';
import { DB } from '../Components/db';

function IndividualPage({ route, navigation }) {
  // Grab station and userLocation from route params or fallback to first station
  const station = route.params?.station || stations[0];
  const userLocation = route.params?.userLocation || currentUser.defaultLocation;

  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPort, setSelectedPort] = useState(
    station.ports?.find((p) => p.status === 'available') || station.ports?.[0]
  );
  const [selectedDurationMins, setSelectedDurationMins] = useState(30);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showChargingModal, setShowChargingModal] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Live charging simulator state
  const [chargePct, setChargePct] = useState(currentUser.vehicle.currentBatteryPct);
  const [energyDeliveredKwh, setEnergyDeliveredKwh] = useState(0);
  const [runningCost, setRunningCost] = useState(0);
  const [chargingSeconds, setChargingSeconds] = useState(0);

  // Check initial favorite status
  useEffect(() => {
    DB.getFavorites().then((favs) => {
      setIsFavorite(favs.includes(station.id));
    });
  }, [station.id]);

  const toggleFavorite = async () => {
    const updated = await DB.toggleFavorite(station.id);
    setIsFavorite(updated.includes(station.id));
  };

  // Dynamic calculated distance
  const displayDistance = station.calculatedDistanceKm !== undefined 
    ? formatDistance(station.calculatedDistanceKm) 
    : `${station.distanceKm} km`;
  const displayTime = station.calculatedTime || station.time;

  // Calculate estimated energy (kWh), cost, and range added
  const chargingPowerKw = Math.min(
    selectedPort?.powerKw || station.maxPowerKw || 50,
    currentUser.vehicle.fastChargeSpeedKw || 50
  );
  const estimatedKwh = ((chargingPowerKw * selectedDurationMins) / 60).toFixed(1);
  const estimatedCost = Math.round(estimatedKwh * (selectedPort?.pricePerKwh || station.pricePerKwh || 18));
  const estimatedRangeAddedKm = Math.round(
    (estimatedKwh / currentUser.vehicle.batteryCapacityKwh) * currentUser.vehicle.maxRangeKm
  );

  // Share station details
  const handleShare = async () => {
    try {
      await Share.share({
        message: `⚡ Check out ${station.stationName} in ${station.cityName || 'Pune'} on VoltCharge!\nAddress: ${station.address}\nDistance: ${displayDistance} (${displayTime})\nMax Speed: ${station.maxPowerKw} kW • Rate: ₹${station.pricePerKwh}/kWh`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Open direct turn-by-turn navigation in Maps
  const handleDirections = () => {
    const lat = station.latitude || 18.5204;
    const lon = station.longitude || 73.8567;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        }
      })
      .catch(() => {
        Alert.alert(
          'Starting Turn-by-Turn Navigation',
          `Routing to ${station.stationName} (${displayDistance} away, ETA: ${displayTime}).`
        );
      });
  };

  // Confirm booking & save to Persistent Database
  const handleConfirmBooking = async () => {
    const randomCode = 'VC-' + Math.floor(100000 + Math.random() * 900000);
    setBookingRef(randomCode);

    const bookingObject = {
      id: randomCode,
      stationId: station.id,
      stationName: station.stationName,
      portName: selectedPort?.name || 'Fast Port 01',
      durationMins: selectedDurationMins,
      kwhCharged: parseFloat(estimatedKwh),
      cost: estimatedCost,
      date: new Date().toISOString(),
      status: 'confirmed',
      vehicle: currentUser.vehicle.model,
    };

    // Save to AsyncStorage local database
    await DB.saveBooking(bookingObject);
    setShowBookingModal(true);
  };

  // Start live simulated charging session
  const startLiveCharging = () => {
    setShowBookingModal(false);
    setChargePct(currentUser.vehicle.currentBatteryPct);
    setEnergyDeliveredKwh(0);
    setRunningCost(0);
    setChargingSeconds(0);
    setShowChargingModal(true);
  };

  // Simulation timer effect
  useEffect(() => {
    let interval = null;
    if (showChargingModal) {
      interval = setInterval(() => {
        setChargingSeconds((prev) => prev + 1);
        setEnergyDeliveredKwh((prev) => +(prev + 0.15).toFixed(2));
        setRunningCost((prev) => Math.round(prev + 2.7));
        setChargePct((prev) => (prev < 100 ? prev + 1 : 100));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showChargingModal]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <ImageBackground 
          source={station.image} 
          style={styles.heroImage}
          imageStyle={styles.heroImageRadius}
        >
          <View style={styles.heroOverlay} />

          {/* Top Floating App Bar */}
          <View style={styles.appBar}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.rightNavActions}>
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={toggleFavorite}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isFavorite ? "#EF4444" : "#FFFFFF"} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navButton, { marginLeft: 8 }]} 
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Bottom Info */}
          <View style={styles.heroBottomInfo}>
            <View style={styles.statusBadgesRow}>
              <View style={styles.openBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.openBadgeText}>{station.openHours}</Text>
              </View>
              <View style={styles.powerBadge}>
                <Ionicons name="flash" size={13} color="#FFFFFF" />
                <Text style={styles.powerBadgeText}>{station.maxPowerKw} kW Ultra-Fast</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{station.stationName}</Text>
          </View>
        </ImageBackground>

        {/* Content Sheet */}
        <View style={styles.contentSheet}>
          {/* Quick Metrics Bar with Live Distance */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metricValue}>{station.rating}</Text>
              <Text style={styles.metricLabel}>{station.reviewsCount} reviews</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Ionicons name="navigate-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.metricValue}>{displayDistance}</Text>
              <Text style={styles.metricLabel}>ETA {displayTime}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <MaterialCommunityIcons name="ev-station" size={18} color={Colors.success} />
              <Text style={styles.metricValue}>
                {station.availablePortsCount}/{station.totalPorts}
              </Text>
              <Text style={styles.metricLabel}>Ports Free</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValuePrice}>₹{station.pricePerKwh}</Text>
              <Text style={styles.metricLabel}>per kWh</Text>
            </View>
          </View>

          {/* Location & Real-Time Directions Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationIconBox}>
              <Ionicons name="location" size={22} color={Colors.primary} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{station.address}</Text>
              <Text style={styles.locationDistance}>
                {displayDistance} away from your current location • {displayTime} drive
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.directionsBtn}
              onPress={handleDirections}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={15} color="#FFFFFF" />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </TouchableOpacity>
          </View>

          {/* Charging Ports Selector */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Select Charging Bay / Port</Text>
              <Text style={styles.sectionSubBadge}>
                {station.availablePortsCount} Available Now
              </Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.portsScroll}
            >
              {station.ports?.map((port) => {
                const isSelected = selectedPort?.id === port.id;
                const isAvailable = port.status === 'available';

                return (
                  <TouchableOpacity
                    key={port.id}
                    disabled={!isAvailable}
                    activeOpacity={0.85}
                    style={[
                      styles.portCard,
                      isSelected && styles.portCardSelected,
                      !isAvailable && styles.portCardDisabled,
                    ]}
                    onPress={() => setSelectedPort(port)}
                  >
                    <View style={styles.portTopRow}>
                      <MaterialCommunityIcons 
                        name="ev-plug-ccs2" 
                        size={20} 
                        color={isSelected ? Colors.primaryDark : isAvailable ? Colors.textPrimary : Colors.textMuted} 
                      />
                      <View style={[
                        styles.portStatusBadge,
                        isAvailable ? styles.statusAvailBg : styles.statusBusyBg
                      ]}>
                        <Text style={[
                          styles.portStatusText,
                          isAvailable ? styles.statusAvailText : styles.statusBusyText
                        ]}>
                          {isAvailable ? 'Available' : 'Occupied'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.portName, isSelected && styles.portNameSelected]}>
                      {port.name}
                    </Text>

                    <View style={styles.portSpecs}>
                      <Text style={styles.portPower}>{port.powerKw} kW • {port.type}</Text>
                      <Text style={styles.portPrice}>₹{port.pricePerKwh}/kWh</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Charging Slot Duration Picker */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Duration & Energy Goal</Text>
            <View style={styles.durationOptionsRow}>
              {[15, 30, 45, 60].map((mins) => {
                const isSelected = selectedDurationMins === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    activeOpacity={0.8}
                    style={[
                      styles.durationPill,
                      isSelected && styles.durationPillSelected,
                    ]}
                    onPress={() => setSelectedDurationMins(mins)}
                  >
                    <Text style={[
                      styles.durationMinsText,
                      isSelected && styles.durationMinsTextSelected,
                    ]}>
                      {mins}
                    </Text>
                    <Text style={[
                      styles.durationUnitText,
                      isSelected && styles.durationUnitTextSelected,
                    ]}>
                      Mins
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Cost & Battery Gain Estimator */}
            <View style={styles.estimatorCard}>
              <View style={styles.estimatorHeader}>
                <Ionicons name="calculator-outline" size={18} color={Colors.primaryDark} />
                <Text style={styles.estimatorTitle}>Estimated Session Projection</Text>
              </View>

              <View style={styles.estimatorRow}>
                <View style={styles.estimatorItem}>
                  <Text style={styles.estimatorValue}>+{estimatedKwh} kWh</Text>
                  <Text style={styles.estimatorLabel}>Energy Added</Text>
                </View>
                <View style={styles.estimatorDivider} />
                <View style={styles.estimatorItem}>
                  <Text style={styles.estimatorValue}>+{estimatedRangeAddedKm} km</Text>
                  <Text style={styles.estimatorLabel}>Estimated Range</Text>
                </View>
                <View style={styles.estimatorDivider} />
                <View style={styles.estimatorItem}>
                  <Text style={[styles.estimatorValue, { color: Colors.primaryDark }]}>₹{estimatedCost}</Text>
                  <Text style={styles.estimatorLabel}>Estimated Cost</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Amenities Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Station Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {station.amenities?.map((amenity, idx) => (
                <View key={idx} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Station Overview & Notes */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>About This Hub</Text>
            <Text style={styles.aboutText}>{station.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarTotal}>Est. ₹{estimatedCost}</Text>
          <Text style={styles.bottomBarSub}>
            {selectedDurationMins} Mins • {selectedPort?.name?.split(' ')[0] || 'Port 01'} • {displayDistance}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.reserveButton}
          onPress={handleConfirmBooking}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.reserveButtonText}>Reserve Spot Now</Text>
        </TouchableOpacity>
      </View>

      {/* Digital QR Booking Pass Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModalCard}>
            <View style={styles.passHeader}>
              <View style={styles.passHeaderBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.passHeaderTitle}>Slot Reserved & Saved!</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.passSub}>
              Pass #{bookingRef} is saved to your bookings database. Present this QR at the terminal.
            </Text>

            {/* QR Ticket Container */}
            <View style={styles.qrTicketBox}>
              <View style={styles.qrVisual}>
                <MaterialCommunityIcons name="qrcode-scan" size={90} color={Colors.surfaceDark} />
                <Text style={styles.qrCodeText}>{bookingRef}</Text>
              </View>

              <View style={styles.ticketDetails}>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Station</Text>
                  <Text style={styles.ticketValue} numberOfLines={1}>{station.stationName}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Distance</Text>
                  <Text style={styles.ticketValue}>{displayDistance} ({displayTime})</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Reserved Port</Text>
                  <Text style={styles.ticketValue}>{selectedPort?.name}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Duration</Text>
                  <Text style={styles.ticketValue}>{selectedDurationMins} Minutes</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Vehicle</Text>
                  <Text style={styles.ticketValue}>{currentUser.vehicle.model}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons in Modal */}
            <TouchableOpacity 
              style={styles.startChargeBtn}
              onPress={startLiveCharging}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.startChargeBtnText}>Start Live Charging Simulator</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalBtn}
              onPress={() => setShowBookingModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Done & View In My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Live Charging Session Simulator Modal */}
      <Modal
        visible={showChargingModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowChargingModal(false)}
      >
        <View style={styles.chargingSessionOverlay}>
          <View style={styles.chargingSessionCard}>
            <View style={styles.chargingHeader}>
              <View style={styles.chargingPulse}>
                <Ionicons name="flash" size={24} color={Colors.primaryNeon} />
              </View>
              <Text style={styles.chargingHeaderTitle}>Charging in Progress</Text>
              <Text style={styles.chargingHeaderSub}>{station.stationName}</Text>
            </View>

            {/* Battery Ring Display */}
            <View style={styles.batteryDial}>
              <Text style={styles.batteryDialPct}>{chargePct}%</Text>
              <Text style={styles.batteryDialLabel}>Battery Level</Text>
              <Text style={styles.batteryDialSpeed}>⚡ {chargingPowerKw} kW Speed</Text>
            </View>

            {/* Session Live Telemetry */}
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryValue}>{energyDeliveredKwh} kWh</Text>
                <Text style={styles.telemetryLabel}>Energy Delivered</Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryValue}>₹{runningCost}</Text>
                <Text style={styles.telemetryLabel}>Running Cost</Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryValue}>{chargingSeconds}s</Text>
                <Text style={styles.telemetryLabel}>Elapsed Time</Text>
              </View>
            </View>

            {/* Stop Charging Button */}
            <TouchableOpacity 
              style={styles.stopChargingBtn}
              onPress={() => {
                setShowChargingModal(false);
                Alert.alert(
                  'Charging Complete! ⚡',
                  `Delivered: ${energyDeliveredKwh} kWh\nTotal Charged: ₹${runningCost}\nFinal Battery: ${chargePct}%\nYour receipt has been recorded and saved in your database.`
                );
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="stop-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.stopChargingBtnText}>Stop Charging & Save Receipt</Text>
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
    paddingBottom: 110,
  },
  heroImage: {
    width: '100%',
    height: 300,
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  heroImageRadius: {
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroBottomInfo: {
    paddingBottom: Spacing.sm,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 182, 107, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  openBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  powerBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    marginLeft: 4,
  },
  heroTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentSheet: {
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.lg,
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metricValuePrice: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  locationIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm + 2,
  },
  locationDetails: {
    flex: 1,
    marginRight: 6,
  },
  locationAddress: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  locationDistance: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  directionsBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    marginLeft: 4,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubBadge: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  portsScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  portCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 170,
    ...Shadows.sm,
  },
  portCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  portCardDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.surfaceElevated,
  },
  portTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  portStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusAvailBg: {
    backgroundColor: Colors.successLight,
  },
  statusBusyBg: {
    backgroundColor: Colors.dangerLight,
  },
  portStatusText: {
    fontSize: Typography.sizes.xs - 1,
    fontWeight: Typography.weights.bold,
  },
  statusAvailText: {
    color: Colors.success,
  },
  statusBusyText: {
    color: Colors.danger,
  },
  portName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  portNameSelected: {
    color: Colors.primaryDark,
  },
  portSpecs: {
    marginTop: 6,
  },
  portPower: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  portPrice: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    marginTop: 2,
  },
  durationOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
    gap: 8,
  },
  durationPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    ...Shadows.sm,
  },
  durationPillSelected: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surfaceDark,
  },
  durationMinsText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  durationMinsTextSelected: {
    color: '#FFFFFF',
  },
  durationUnitText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  durationUnitTextSelected: {
    color: Colors.primaryNeon,
  },
  estimatorCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  estimatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  estimatorTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estimatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estimatorItem: {
    alignItems: 'center',
    flex: 1,
  },
  estimatorValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  estimatorLabel: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  estimatorDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.xs,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  amenityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  aboutText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarTotal: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  bottomBarSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    ...Shadows.glow,
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  bookingModalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passHeaderTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  passSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  qrTicketBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  qrVisual: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  qrCodeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    letterSpacing: 2,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  ticketDetails: {
    paddingTop: Spacing.sm,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  ticketLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  ticketValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  startChargeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadows.glow,
  },
  startChargeBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  closeModalBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  closeModalBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
  },
  chargingSessionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  chargingSessionCard: {
    width: '100%',
    backgroundColor: Colors.surfaceDarkCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(5, 182, 107, 0.3)',
    ...Shadows.lg,
  },
  chargingHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chargingPulse: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(5, 182, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryNeon,
    marginBottom: 8,
  },
  chargingHeaderTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
  },
  chargingHeaderSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  batteryDial: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.primaryNeon,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.md,
    backgroundColor: 'rgba(5, 182, 107, 0.1)',
  },
  batteryDialPct: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
  },
  batteryDialLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  batteryDialSpeed: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryNeon,
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  telemetryItem: {
    alignItems: 'center',
    flex: 1,
  },
  telemetryValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  telemetryLabel: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  telemetryDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
  },
  stopChargingBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  stopChargingBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});

export default IndividualPage;