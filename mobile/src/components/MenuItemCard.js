import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Plus, Ban, Utensils } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import QuantityStepper from './QuantityStepper';
import { getProductImageUrl, isEmoji } from '../utils/imageUrl';

export default function MenuItemCard({
  item,
  cartQuantity = 0,
  onAddToCart,
  onIncrease,
  onDecrease,
}) {
  const { name, price, description, availability, is_available } = item;
  const isAvailable = availability === 'available' || is_available === true;
  const isVeg = item.is_vegetarian !== undefined && item.is_vegetarian !== null
    ? Boolean(item.is_vegetarian)
    : (!name.toLowerCase().includes('chicken') && !name.toLowerCase().includes('meat') && !name.toLowerCase().includes('beef') && !name.toLowerCase().includes('prawn'));

  const rawImage = item.image || item.image_url || item.imageUrl || item.photo || item.thumbnail;
  const resolvedImageUrl = getProductImageUrl(rawImage);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [rawImage]);

  return (
    <View
      style={[
        styles.card,
        !isAvailable && styles.cardDisabled,
      ]}
    >
      {/* Left Food Image */}
      <View style={[styles.imageWrapper, !isAvailable && styles.imageDisabled]}>
        {resolvedImageUrl && !imageError ? (
          <Image
            source={{ uri: resolvedImageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : isEmoji(rawImage) ? (
          <View style={styles.imageFallback}>
            <Text style={styles.emojiText}>{rawImage}</Text>
          </View>
        ) : (
          <View style={styles.imageFallback}>
            <Utensils size={28} color={colors.onSurfaceVariant} />
          </View>
        )}


        {/* Veg / Non-Veg Pill */}
        <View style={[styles.vegBadge, isVeg ? styles.vegPill : styles.nonVegPill]}>
          <Text style={[styles.vegText, isVeg ? styles.vegTextGreen : styles.nonVegTextRed]}>
            {isVeg ? 'Veg' : 'Non-Veg'}
          </Text>
        </View>

        {!isAvailable && (
          <View style={styles.blockedOverlay}>
            <Ban size={22} color={colors.surfaceContainerLowest} />
          </View>
        )}
      </View>

      {/* Right Content */}
      <View style={styles.contentColumn}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.itemPrice}>
              ₹{parseFloat(price || 0).toFixed(0)}
            </Text>
          </View>

          {description ? (
            <Text style={styles.itemDesc} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>

        {/* Bottom Status & CTA Row */}
        <View style={styles.actionRow}>
          {isAvailable ? (
            <View style={styles.stockStatus}>
              <View style={styles.stockDot} />
              <Text style={styles.stockText}>In Stock</Text>
            </View>
          ) : (
            <View style={styles.outStockBadge}>
              <Text style={styles.outStockText}>Out of stock</Text>
            </View>
          )}

          {isAvailable ? (
            cartQuantity > 0 ? (
              <QuantityStepper
                quantity={cartQuantity}
                onIncrease={() => onIncrease(item)}
                onDecrease={() => onDecrease(item)}
              />
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => onAddToCart(item)}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.onSurface} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.disabledBtn}>
              <Plus size={16} color={colors.outline} />
              <Text style={styles.disabledBtnText}>Add</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
    marginBottom: 10,
  },
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: colors.surfaceContainerLow,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceContainerHigh,
  },
  imageDisabled: {
    opacity: 0.8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 34,
  },
  vegBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  vegPill: {
    borderColor: colors.readyGreen,
  },
  nonVegPill: {
    borderColor: colors.primaryContainer,
  },
  vegText: {
    fontSize: 9,
    fontWeight: '700',
  },
  vegTextGreen: {
    color: colors.readyGreen,
  },
  nonVegTextRed: {
    color: colors.primaryContainer,
  },
  blockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 80,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  itemName: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  itemPrice: {
    ...typography.labelNumeric,
    color: colors.onSurface,
    fontWeight: '700',
  },
  itemDesc: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.readyGreen,
  },
  stockText: {
    ...typography.captionSm,
    color: colors.tertiaryContainer,
    fontWeight: '600',
  },
  outStockBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outStockText: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  addBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    ...typography.labelNumeric,
    color: colors.onSurface,
    fontWeight: '700',
  },
  disabledBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.5,
  },
  disabledBtnText: {
    ...typography.labelNumeric,
    color: colors.outline,
    fontWeight: '600',
  },
});
