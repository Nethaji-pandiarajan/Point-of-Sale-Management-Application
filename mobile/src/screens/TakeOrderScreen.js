import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  Utensils,
  Search,
  CheckCircle2,
  X,
  Send,
  ShoppingBag,
  ArrowRight,
  FileText,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { layout } from '../constants/layout';
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import CategoryPills from '../components/CategoryPills';
import MenuItemCard from '../components/MenuItemCard';
import OrderSummaryBar from '../components/OrderSummaryBar';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { menuApi } from '../api/menuApi';
import { orderApi } from '../api/orderApi';

export default function TakeOrderScreen({ navigation, route }) {
  const { table: routeTable, isAddMore, guestCount: routeGuestCount } = route.params || {};
  const {
    selectedTable,
    guestCount,
    setGuests,
    cart,
    cartCount,
    cartTotal,
    cartItemsList,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setActiveOrder,
    triggerRefresh,
  } = useOrder();

  const { showToast } = useToast();

  const effectiveGuestCount = routeGuestCount !== undefined ? routeGuestCount : (guestCount || 1);

  useEffect(() => {
    if (routeGuestCount !== undefined && routeGuestCount !== guestCount) {
      setGuests(routeGuestCount);
    }
  }, [routeGuestCount]);

  const currentTable = routeTable || selectedTable || {
    tableCode: 'TAB03',
    tableNumber: 'Table 3',
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Review & Fire Modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        menuApi.getProducts(),
        menuApi.getCategories(),
      ]);

      let items = [];
      if (prodRes.status === 'fulfilled' && prodRes.value?.data) {
        items = prodRes.value.data;
        setProducts(items);
      }

      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        const catList = catRes.value.data.map((c) => ({
          id: c.id,
          name: c.name,
          count: items.filter((p) => p.categoryId === c.id).length,
        }));
        setCategories([{ id: 'all', name: 'All', count: items.length }, ...catList]);
      } else {
        setCategories([
          { id: 'all', name: 'All', count: items.length || 38 },
          { id: 'starters', name: 'Starters', count: 8 },
          { id: 'main', name: 'Main Course', count: 14 },
          { id: 'pizza', name: 'Pizza', count: 6 },
          { id: 'beverages', name: 'Beverages', count: 7 },
          { id: 'desserts', name: 'Desserts', count: 3 },
        ]);
      }
    } catch (err) {
      if (err.status !== 401) {
        console.warn('Failed to load menu products:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'all' ? true : p.categoryId === selectedCategory;
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const handleAddItem = (item) => {
    addToCart(item, 1);
    showToast({
      message: `1× ${item.name} added to tab`,
      type: 'success',
      duration: 2500,
    });
  };

  const handleIncreaseItem = (item) => {
    const cur = cart[item.id]?.quantity || 0;
    updateQuantity(item.id, cur + 1);
  };

  const handleDecreaseItem = (item) => {
    const cur = cart[item.id]?.quantity || 0;
    updateQuantity(item.id, cur - 1);
  };

  const handleFireOrder = async () => {
    if (cartItemsList.length === 0) {
      showToast({ message: 'Cart is empty. Please add food items.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cartItemsList.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      let orderResult;
      if (isAddMore && currentTable.activeOrderId) {
        // Add items to existing active order
        orderResult = await orderApi.addItemsToOrder(currentTable.activeOrderId, {
          items: itemsPayload,
          notes: orderNotes,
        });
        showToast({ message: 'Additional items fired to Kitchen KDS!', type: 'success' });
      } else {
        // Create new order
        orderResult = await orderApi.createOrder({
          items: itemsPayload,
          orderType: 'dine_in',
          tableNo: currentTable.tableNumber || currentTable.tableCode,
          guestCount: effectiveGuestCount,
          notes: orderNotes,
        });
        showToast({ message: `Order sent to kitchen for ${currentTable.tableCode}!`, type: 'success' });
      }

      clearCart();
      setReviewModalVisible(false);
      triggerRefresh();

      // Navigate to Kitchen Status screen
      const orderData = orderResult?.data || {
        id: orderResult?.id || 125,
        tableNo: currentTable.tableNumber || currentTable.tableCode,
        tableCode: currentTable.tableCode,
        guestCount: effectiveGuestCount,
      };
      setActiveOrder(orderData);
      navigation.navigate('KitchenStatus', {
        orderId: orderData.id,
        tableNo: currentTable.tableNumber || currentTable.tableCode,
        order: orderData,
      });
    } catch (err) {
      console.warn('Failed to submit order:', err.message);
      showToast({ message: `Order created offline for ${currentTable.tableCode}`, type: 'info' });
      clearCart();
      setReviewModalVisible(false);
      navigation.navigate('KitchenStatus', {
        tableNo: currentTable.tableNumber || currentTable.tableCode,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Order Entry"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Table Meta Strip */}
        <View style={styles.tableStrip}>
          <View style={styles.tableStripLeft}>
            <View style={styles.menuIconBox}>
              <Utensils size={20} color={colors.primaryContainer} />
            </View>
            <View>
              <View style={styles.tableCodeTitleRow}>
                <Text style={styles.tableStripTitle}>
                  {currentTable.tableNumber || `Table ${currentTable.tableCode?.replace(/\D/g, '')}`}
                </Text>
                <View style={styles.tableCodeTag}>
                  <Text style={styles.tableCodeTagText}>{currentTable.tableCode}</Text>
                </View>
              </View>
              <Text style={styles.tableStripSub}>
                {isAddMore
                  ? 'Add More Items to Active Tab'
                  : `New Dine-In Order · ${effectiveGuestCount} ${effectiveGuestCount === 1 ? 'Guest' : 'Guests'}`}
              </Text>
            </View>
          </View>

          <View style={styles.activePill}>
            <View style={styles.activePillDot} />
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </View>

        {/* Search Bar with QR scanner icon */}
        <View style={styles.searchBox}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search dishes, drinks, codes..."
            showScan={true}
            onScanPress={() => showToast({ message: 'Barcode scanner active', type: 'info' })}
          />
        </View>

        {/* Horizontal Category Chips */}
        <View style={styles.categoriesSection}>
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        {/* Food Items List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
            <Text style={styles.loadingText}>Loading restaurant menu...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MenuItemCard
                item={item}
                cartQuantity={cart[item.id]?.quantity || 0}
                onAddToCart={handleAddItem}
                onIncrease={handleIncreaseItem}
                onDecrease={handleDecreaseItem}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No dishes found</Text>
                <Text style={styles.emptySub}>Try searching another item or category</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Sticky Bottom Order Summary Bar */}
      <OrderSummaryBar
        itemCount={cartCount}
        totalAmount={cartTotal}
        buttonLabel="View Order"
        onPress={() => setReviewModalVisible(true)}
      />

      {/* Review Cart & Send to Kitchen Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <ShoppingBag size={22} color={colors.primaryContainer} />
                <Text style={styles.modalTitle}>Review Order</Text>
                <View style={styles.modalTableTag}>
                  <Text style={styles.modalTableTagText}>{currentTable.tableCode}</Text>
                </View>
                <View style={[styles.modalTableTag, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <Text style={[styles.modalTableTagText, { color: colors.onSurface }]}>
                    {effectiveGuestCount} {effectiveGuestCount === 1 ? 'Guest' : 'Guests'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Itemized Order List in Cart */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.cartItemsContainer}>
                {cartItemsList.map(({ product, quantity, unitPrice }) => (
                  <View key={product.id} style={styles.cartItemRow}>
                    <View style={styles.cartItemLeft}>
                      <View style={styles.cartItemQtyBox}>
                        <Text style={styles.cartItemQtyText}>{quantity}×</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.cartItemUnit}>
                          ₹{unitPrice.toFixed(0)} each
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cartItemTotal}>
                      ₹{(quantity * unitPrice).toFixed(0)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Kitchen Special Notes */}
              <View style={styles.notesContainer}>
                <View style={styles.notesLabelRow}>
                  <FileText size={15} color={colors.onSurfaceVariant} />
                  <Text style={styles.notesLabel}>Special Instructions for Kitchen</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. Less spicy, dressing on the side, extra crispy..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  multiline
                />
              </View>

              {/* Cost Summary */}
              <View style={styles.costBox}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Items Total ({cartCount})</Text>
                  <Text style={styles.costVal}>₹{cartTotal.toFixed(0)}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Estimated Tax (5%)</Text>
                  <Text style={styles.costVal}>₹{(cartTotal * 0.05).toFixed(0)}</Text>
                </View>
                <View style={styles.costDivider} />
                <View style={styles.costRowTotal}>
                  <Text style={styles.costLabelTotal}>Estimated Total</Text>
                  <Text style={styles.costValTotal}>₹{(cartTotal * 1.05).toFixed(0)}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Fire Order Button */}
            <TouchableOpacity
              style={styles.fireOrderBtn}
              onPress={handleFireOrder}
              disabled={submitting}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <Send size={18} color={colors.onPrimary} />
                  <Text style={styles.fireOrderBtnText}>
                    {isAddMore ? 'Fire Additional Items to Kitchen' : 'Fire Order to Kitchen (KOT)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tableStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  tableStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.selectedTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableStripTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
    fontSize: 18,
  },
  tableCodeTag: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tableCodeTagText: {
    ...typography.labelBadge,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  tableStripSub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.readyTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.readyGreen,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.readyGreen,
  },
  searchBox: {
    marginBottom: 6,
  },
  categoriesSection: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 90,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
  },
  emptySub: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
  },
  modalTableTag: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalTableTagText: {
    ...typography.captionSm,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginVertical: 12,
  },
  cartItemsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 12,
  },
  cartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cartItemQtyBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQtyText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  cartItemName: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 14,
  },
  cartItemUnit: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  cartItemTotal: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
    marginLeft: 8,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesLabel: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    minHeight: 60,
    ...typography.bodyMd,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
  costBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costLabel: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
  },
  costVal: {
    ...typography.captionSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  costRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabelTotal: {
    ...typography.bodyMdBold,
    color: colors.onSurface,
  },
  costValTotal: {
    ...typography.headlineMd,
    color: colors.primaryContainer,
    fontWeight: '800',
  },
  fireOrderBtn: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...layout.shadows.md,
  },
  fireOrderBtnText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '800',
  },
});
