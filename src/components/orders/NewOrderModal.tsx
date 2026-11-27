'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  UtensilsCrossed,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { FoodItem, Order } from '../../types';
import { useToast } from '../common/ToastContext';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

interface SelectedItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const { success, error } = useToast();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'dine-in' | 'pickup' | 'delivery'>('dine-in');
  const [deliveryAddress, setDeliveryAddress] = useState('Table #');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'online'>('cod');
  const [notes, setNotes] = useState('');

  // Dish Picker State
  const [availableDishes, setAvailableDishes] = useState<FoodItem[]>([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(false);
  const [dishSearch, setDishSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Dishes on open
  useEffect(() => {
    if (!isOpen) return;
    const fetchDishes = async () => {
      try {
        setIsLoadingDishes(true);
        const res = await adminApi.getAllDishes({ available: 'true', limit: 100 });
        if (res.success && res.dishes) {
          setAvailableDishes(res.dishes);
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch dishes.');
      } finally {
        setIsLoadingDishes(false);
      }
    };
    fetchDishes();
  }, [isOpen]);

  // Adjust default address when fulfillmentType changes
  const handleFulfillmentChange = (type: 'dine-in' | 'pickup' | 'delivery') => {
    setFulfillmentType(type);
    if (type === 'dine-in' && (!deliveryAddress || deliveryAddress.toLowerCase().includes('counter'))) {
      setDeliveryAddress('Table #');
    } else if (type === 'pickup') {
      setDeliveryAddress('Hestiia Pickup Counter');
    } else if (type === 'delivery' && deliveryAddress.startsWith('Table #')) {
      setDeliveryAddress('');
    }
  };

  // Add Item to Order
  const handleAddItem = (dish: FoodItem) => {
    const existing = selectedItems.find((i) => i.dishId === dish.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.dishId === dish.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          image: dish.image,
        },
      ]);
    }
  };

  // Update Quantity
  const handleUpdateQuantity = (dishId: string, delta: number) => {
    setSelectedItems(
      selectedItems
        .map((i) => {
          if (i.dishId === dishId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as SelectedItem[]
    );
  };

  const handleRemoveItem = (dishId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.dishId !== dishId));
  };

  // Financial Computations
  const subtotal = useMemo(
    () => selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
    [selectedItems]
  );
  const taxAmount = useMemo(() => Math.round(subtotal * 0.05 * 100) / 100, [subtotal]);
  const deliveryCharge = fulfillmentType === 'delivery' ? 40 : 0;
  const grandTotal = Math.round((subtotal + taxAmount + deliveryCharge) * 100) / 100;

  // Filter Dishes by search
  const filteredDishes = useMemo(() => {
    if (!dishSearch.trim()) return availableDishes.slice(0, 8);
    const q = dishSearch.toLowerCase();
    return availableDishes.filter(
      (d) => d.name.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)
    );
  }, [availableDishes, dishSearch]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      error('Please enter the customer name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      error('Please enter a valid 10-digit phone number.');
      return;
    }
    if (selectedItems.length === 0) {
      error('Please add at least one dish to the order.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminApi.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        fulfillmentType,
        deliveryAddress: deliveryAddress.trim() || (fulfillmentType === 'dine-in' ? 'Dine-In Table' : 'Counter'),
        paymentMethod,
        notes: notes.trim() || undefined,
        items: selectedItems.map((item) => ({
          dishId: item.dishId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      if (res.success && res.order) {
        success(`Order #${res.order.orderNumber} placed successfully!`);
        onOrderCreated(res.order);
        onClose();
      }
    } catch (err: any) {
      error(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-charcoal-card border border-gold/40 text-warmwhite p-6 rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal-border pb-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-warmwhite flex items-center space-x-2">
                <span>Create Walk-In / Phone Order</span>
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 uppercase">
                  POS
                </span>
              </h3>
              <p className="text-xs text-beige-muted">Direct counter, dining room, or telephone order entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-beige-muted hover:text-warmwhite transition-colors p-1 rounded-lg hover:bg-charcoal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {/* Customer Details */}
          <div className="p-4 rounded-2xl bg-charcoal/80 border border-charcoal-border space-y-3">
            <h4 className="font-serif font-bold text-sm text-gold flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>Customer Credentials</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-beige-muted mb-1 font-medium">Patron Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swatantra Singh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-card border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-beige-muted mb-1 font-medium">Contact Phone *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-beige-muted absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-charcoal-card border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-beige-muted mb-1 font-medium">Email (Optional)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-beige-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="patron@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-charcoal-card border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment & Payment Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fulfillment Type */}
            <div className="p-4 rounded-2xl bg-charcoal/80 border border-charcoal-border space-y-3">
              <label className="block text-[11px] text-beige-muted font-semibold">Fulfillment Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {(['dine-in', 'pickup', 'delivery'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFulfillmentChange(type)}
                    className={`py-2 px-1 text-center rounded-xl border font-bold capitalize transition-all ${
                      fulfillmentType === type
                        ? 'bg-gold text-charcoal-950 border-gold shadow-md'
                        : 'bg-charcoal-card text-beige border-charcoal-border hover:border-gold/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] text-beige-muted mb-1 font-medium">
                  {fulfillmentType === 'dine-in' ? 'Table Number / Section' : 'Delivery / Counter Destination'}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-gold absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={fulfillmentType === 'dine-in' ? 'Table #4' : 'Delivery Address...'}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-charcoal-card border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-2xl bg-charcoal/80 border border-charcoal-border space-y-3">
              <label className="block text-[11px] text-beige-muted font-semibold">Settlement / Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cod', label: 'Cash (COD)' },
                  { id: 'upi', label: 'UPI / QR' },
                  { id: 'online', label: 'Card / Net' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-1 text-center rounded-xl border font-bold text-[11px] transition-all ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-charcoal-card text-beige border-charcoal-border hover:border-charcoal-border/80'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] text-beige-muted mb-1 font-medium">Chef / Preparation Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Less spicy, extra butter"
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-card border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dish Catalog & Item Selection */}
          <div className="p-4 rounded-2xl bg-charcoal/80 border border-charcoal-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-sm text-gold flex items-center space-x-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Select Menu Items</span>
              </h4>
              <span className="text-[11px] text-beige-muted">
                {selectedItems.reduce((acc, i) => acc + i.quantity, 0)} items added
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-beige-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search culinary items by name or category..."
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-charcoal-card border border-charcoal-border text-xs text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            {/* Quick Dish Pills */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {isLoadingDishes ? (
                <div className="text-beige-muted text-xs py-2">Loading restaurant menu...</div>
              ) : filteredDishes.length === 0 ? (
                <div className="text-beige-muted text-xs py-2">No available dishes found.</div>
              ) : (
                filteredDishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleAddItem(dish)}
                    className="px-3 py-1.5 rounded-xl bg-charcoal-card border border-charcoal-border hover:border-gold/60 text-warmwhite text-xs flex items-center space-x-2 transition-all hover:bg-gold/10"
                  >
                    <span>{dish.name}</span>
                    <span className="text-gold font-bold">₹{dish.price}</span>
                    <Plus className="w-3 h-3 text-gold" />
                  </button>
                ))
              )}
            </div>

            {/* Selected Items Table */}
            {selectedItems.length > 0 && (
              <div className="mt-3 border-t border-charcoal-border pt-3 space-y-2">
                <h5 className="font-bold text-beige text-xs">Current Cart Items:</h5>
                <div className="divide-y divide-charcoal-border/50 max-h-40 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.dishId} className="py-2 flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <span className="font-medium text-warmwhite block">{item.name}</span>
                        <span className="text-[11px] text-beige-muted">₹{item.price} each</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.dishId, -1)}
                          className="w-6 h-6 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige flex items-center justify-center transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-warmwhite w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.dishId, 1)}
                          className="w-6 h-6 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige flex items-center justify-center transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-gold w-14 text-right">₹{item.price * item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.dishId)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-2xl bg-charcoal/90 border border-gold/30 space-y-1.5">
            <div className="flex justify-between text-beige text-xs">
              <span>Subtotal</span>
              <span className="font-medium text-warmwhite">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-beige text-xs">
              <span>GST (5.0% Restaurant Services)</span>
              <span className="font-medium text-warmwhite">₹{taxAmount}</span>
            </div>
            {deliveryCharge > 0 && (
              <div className="flex justify-between text-beige text-xs">
                <span>Delivery Charge</span>
                <span className="font-medium text-warmwhite">₹{deliveryCharge}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-warmwhite pt-2 border-t border-charcoal-border/70 font-serif">
              <span>Grand Total</span>
              <span className="text-base text-gold font-bold">₹{grandTotal}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-warmwhite text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Place Order (₹{grandTotal})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
