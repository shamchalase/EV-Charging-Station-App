import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from './theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function Card({ station, onPress, onToggleFavorite, isFavorite = false }) {
  if (!station) return null;

  const isFastCharger = station.maxPowerKw >= 50;
  const isHighAvailability = station.availablePortsCount > 0;

  return (
    <TouchableOpacity 
      activeOpacity={0.88} 
      style={styles.cardWrapper} 
      onPress={onPress}
    >
      <View style={styles.cardContainer}>
        {/* Cover Image Header */}
        <ImageBackground 
          source={station.image} 
          style={styles.imageBackground}
          imageStyle={styles.imageRadius}
        >
          {/* Dark gradient overlay for readability */}
          <View style={styles.imageOverlay} />

          {/* Top Row: Speed Tag & Favorite Button */}
          <View style={styles.topRow}>
            <View style={[styles.badge, styles.speedBadge]}>
              <Ionicons name="flash" size={13} color="#FFFFFF" />
              <Text style={styles.badgeText}>{station.maxPowerKw} kW Fast</Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                if (onToggleFavorite) onToggleFavorite(station.id);
              }}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={18} 
                color={isFavorite ? "#EF4444" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Floating Bar inside Image: Distance & Availability */}
          <View style={styles.imageBottomBar}>
            <View style={styles.etaPill}>
              <Ionicons name="time-outline" size={13} color={Colors.textPrimary} />
              <Text style={styles.etaText}>{station.time}</Text>
            </View>

            <View style={[
              styles.availabilityPill, 
              isHighAvailability ? styles.availGreen : styles.availRed
            ]}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: isHighAvailability ? Colors.success : Colors.danger }
              ]} />
              <Text style={styles.availText}>
                {station.availablePortsCount}/{station.totalPorts} Free
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Card Content Details */}
        <View style={styles.contentContainer}>
          {/* Brand & Rating Row */}
          <View style={styles.brandRow}>
            <View style={styles.brandTag}>
              <View style={[styles.brandDot, { backgroundColor: station.brandColor || Colors.primary }]} />
              <Text style={styles.brandText}>{station.company}</Text>
            </View>

            <View style={styles.ratingBox}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingScore}>{station.rating}</Text>
              <Text style={styles.ratingCount}>({station.reviewsCount})</Text>
            </View>
          </View>

          {/* Station Title */}
          <Text style={styles.stationTitle} numberOfLines={1}>
            {station.stationName}
          </Text>

          {/* Short Address & Distance */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>
              {station.shortAddress || station.address} • <Text style={styles.distanceHighlight}>{station.distanceKm} km</Text>
            </Text>
          </View>

          {/* Connectors & Pricing Footer */}
          <View style={styles.footerRow}>
            <View style={styles.connectorChips}>
              {station.connectorTypes?.slice(0, 2).map((type, idx) => (
                <View key={idx} style={styles.connectorChip}>
                  <MaterialCommunityIcons name="ev-plug-ccs2" size={12} color={Colors.textSecondary} />
                  <Text style={styles.connectorText}>{type}</Text>
                </View>
              ))}
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceCurrency}>₹{station.pricePerKwh}</Text>
              <Text style={styles.priceUnit}>/kWh</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: Spacing.sm,
    width: '100%',
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  imageBackground: {
    width: '100%',
    height: 160,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  imageRadius: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  speedBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    marginLeft: 4,
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  etaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  availText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  brandText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  stationTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  addressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  distanceHighlight: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.semiBold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm + 2,
    marginTop: 2,
  },
  connectorChips: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  connectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  connectorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    marginLeft: 3,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  priceUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
});

export default Card;