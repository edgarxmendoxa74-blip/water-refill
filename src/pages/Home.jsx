import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ShoppingBag,
    Plus,
    Minus,
    X,
    MessageSquare,
    MapPin,
    Phone,
    Info,
    Facebook,
    Star,
    UtensilsCrossed,
    Clock,
    User,
    Trash2,
    Copy,
    CreditCard,
    AlertCircle,
    QrCode,
    MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories as initialCategories, menuItems as initialMenuItems } from '../data/MenuData';
import { supabase } from '../supabaseClient';

// Order types are now evaluated dynamically inside the component

// Helper to safely parse localized storage data
const getLocalData = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        // Ensure we have actual data, not just an empty array
        if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
            return fallback;
        }
        return parsed || fallback;
    } catch (e) {
        return fallback;
    }
};

// Helper to safely save to localStorage
const setLocalData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn(`Failed to save ${key} to localStorage:`, e.name === 'QuotaExceededError' ? 'Quota exceeded' : e.message);
    }
};

// Normalize menu items (ensure category_id is used for both fallback and DB)
const normalizeItems = (items) => {
    return items.map(item => ({
        ...item,
        category_id: item.category_id || item.categoryId // Handle both camelCase and snake_case
    }));
};

// Memoized menu item component
const MenuItem = React.memo(({ item, openProductSelection }) => {
    return (
        <div className="menu-item-card" style={{ opacity: item.out_of_stock ? 0.6 : 1 }}>
            <div style={{ position: 'relative' }}>
                <img src={item.image} alt={item.name} className="menu-item-image" loading="lazy" />
                {item.promo_price && <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>PROMO</span>}
                {item.out_of_stock && <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '20px' }}>OUT OF STOCK</span>}
            </div>
            <div className="menu-item-info">
                <h3 className="menu-item-name">{item.name}</h3>
                <p className="menu-item-desc">{item.description}</p>
                <div className="menu-item-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.promo_price ? (
                            <>
                                <span className="menu-item-price" style={{ color: '#ef4444' }}>₱{item.promo_price}</span>
                                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>₱{item.price}</span>
                            </>
                        ) : (
                            <span className="menu-item-price">₱{item.price}</span>
                        )}
                    </div>
                    <button
                        className="btn-primary"
                        disabled={item.out_of_stock}
                        onClick={() => openProductSelection(item)}
                        style={{ padding: '10px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.out_of_stock ? 0.5 : 1 }}
                        aria-label="Add to cart"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
});

const Home = () => {
    const [cartItems, setCartItems] = useState([]);
    // INSTANT LOAD: Initialize states from LocalStorage or Fallback
    const [categories, setCategories] = useState(() => getLocalData('categories', initialCategories));
    const [items, setItems] = useState(() => normalizeItems(getLocalData('menuItems', initialMenuItems)));

    // Message state for branded toasts
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // success, error, warning

    // Branded message function
    const showBrandedMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 4000);
    };

    // Only show loading if we have ABSOLUTELY no items (rare if initialMenuItems exists)
    const [isLoading, setIsLoading] = useState(items.length === 0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id || '');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    const [paymentSettings, setPaymentSettings] = useState(() => getLocalData('paymentSettings', []));
    const [deliveryBarangays, setDeliveryBarangays] = useState(() => getLocalData('deliveryBarangays', []));

    const [orderTypes, setOrderTypes] = useState(() => getLocalData('orderTypes', [
        { id: 'delivery', name: 'Delivery', is_active: true },
        { id: 'pickup', name: 'Pick Up', is_active: true }
    ]));

    const [storeSettings, setStoreSettings] = useState(() => {
        const fallback = {
            manual_status: 'auto',
            open_time: '08:00',
            close_time: '20:00',
            store_name: 'Water Refill Station',
            address: '123 Main Street, Your City',
            contact: '09123456789',
            logo_url: '/logo.png',
            banner_images: []
        };
        const saved = getLocalData('storeSettings', fallback);
        // Merge saved with fallback to ensure all keys exist
        return {
            ...fallback,
            ...saved
        };
    });

    const getOrderType = (id) => {
        const type = orderTypes.find(t => t.id === id);
        return type ? type.name : '';
    };

    const isPickupType = (id) => {
        const name = getOrderType(id).toLowerCase();
        return id === 'pickup' || id === 'take-out' || name.includes('pick') || name.includes('take');
    };

    const isDeliveryType = (id) => {
        const name = getOrderType(id).toLowerCase();
        return id === 'delivery' || name.includes('delivery');
    };
    const isStoreOpen = () => {
        if (storeSettings.manual_status === 'open') return true;
        if (storeSettings.manual_status === 'closed') return false;

        try {
            const manilaTimeParts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Manila',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }).formatToParts(new Date());

            const hours = parseInt(manilaTimeParts.find(p => p.type === 'hour').value);
            const minutes = parseInt(manilaTimeParts.find(p => p.type === 'minute').value);
            const currentTime = hours * 60 + minutes;

            const [openH, openM] = (storeSettings.open_time || '10:00').split(':').map(Number);
            const [closeH, closeM] = (storeSettings.close_time || '01:00').split(':').map(Number);

            const openMinutes = openH * 60 + openM;
            const closeMinutes = closeH * 60 + closeM;

            if (closeMinutes < openMinutes) {
                return currentTime >= openMinutes || currentTime < closeMinutes;
            }
            return currentTime >= openMinutes && currentTime < closeMinutes;
        } catch (e) {
            return true;
        }
    };

    const isOpen = isStoreOpen();

    // Background fetching with LocalStorage sync
    useEffect(() => {
        const fetchUpdates = async () => {
            if (items.length === 0) setIsLoading(true);

            try {
                const [
                    { data: catData, error: catErr },
                    { data: itemData, error: itemErr },
                    { data: payData },
                    { data: typeData },
                    { data: storeData },
                    { data: bgData }
                ] = await Promise.all([
                    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
                    supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
                    supabase.from('payment_settings').select('*').eq('is_active', true).order('created_at', { ascending: true }),
                    supabase.from('order_types').select('*').eq('is_active', true).order('created_at', { ascending: true }),
                    supabase.from('store_settings').select('*').limit(1).maybeSingle(),
                    supabase.from('delivery_barangays').select('*').eq('status', 'Active').order('barangay_name', { ascending: true })
                ]);

                if (catErr || itemErr) throw new Error("Supabase fetch failed");

                if (catData && catData.length > 0) {
                    setCategories(catData);
                    setLocalData('categories', catData);
                    if (!activeCategory) {
                        setActiveCategory(catData[0].id);
                    }
                }

                if (itemData && itemData.length > 0) {
                    setItems(normalizeItems(itemData));
                    setLocalData('menuItems', itemData);
                }

                // Other settings
                if (payData && payData.length > 0) { setPaymentSettings(payData); setLocalData('paymentSettings', payData); }
                if (typeData && typeData.length > 0) {
                    // Merge with default types to ensure Delivery & Pick Up always exist
                    const defaultTypes = [
                        { id: 'delivery', name: 'Delivery', is_active: true },
                        { id: 'pickup', name: 'Pick Up', is_active: true }
                    ];
                    const merged = defaultTypes.map(dt => {
                        const fromDb = typeData.find(t => t.id === dt.id);
                        return fromDb || dt;
                    });
                    // Add any extra types from DB that aren't in defaults
                    typeData.forEach(t => {
                        if (!merged.find(m => m.id === t.id)) merged.push(t);
                    });
                    const activeTypes = merged.filter(t => t.is_active !== false);
                    setOrderTypes(activeTypes);
                    setLocalData('orderTypes', activeTypes);
                }
                if (bgData) { setDeliveryBarangays(bgData); setLocalData('deliveryBarangays', bgData); }
                if (storeData) {
                    setStoreSettings(prev => ({
                        ...prev,
                        ...storeData,
                        banner_images: (storeData.banner_images && storeData.banner_images.length > 0) ? storeData.banner_images : prev.banner_images
                    }));
                    setLocalData('storeSettings', storeData);
                }

            } catch (error) {
                console.error("Background fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpdates();
    }, []);

    // Slideshow functions removed - no longer using banners

    // Selection state for products with options
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectionOptions, setSelectionOptions] = useState({
        variation: null
    });
    const [modalQty, setModalQty] = useState(1);

    // Order type and payment state
    const [orderType, setOrderType] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        table_number: '',
        address: '',
        landmark: '',
        pickup_time: '',
        preferred_time: '',
        selectedBarangayId: ''
    });

    const openProductSelection = useCallback((item) => {
        const firstVariation = (item.variations || []).find(v => !v.disabled);
        setSelectedProduct(item);
        setSelectionOptions({
            variation: firstVariation || null
        });
        setModalQty(1);
    }, []);

    const addToCart = (item, options, qty = 1) => {
        const cartItemId = `${item.id}-${options.variation?.name || ''}`;
        const existing = cartItems.find(i => i.cartItemId === cartItemId);

        const variationPrice = options.variation ? Number(options.variation.price) : 0;
        const basePrice = Number(item.promo_price || item.price);

        let price;
        if (item.name?.toLowerCase().includes('pork ribs')) {
            price = basePrice + variationPrice;
        } else {
            price = variationPrice > 0 ? variationPrice : basePrice;
        }
        const finalPrice = price;

        if (existing) {
            setCartItems(cartItems.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + qty } : i));
        } else {
            setCartItems([...cartItems, {
                ...item,
                cartItemId,
                selectedVariation: options.variation,
                finalPrice,
                quantity: qty
            }]);
        }
        setSelectedProduct(null);
    };

    const removeFromCart = (cartItemId) => {
        setCartItems(cartItems.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity > 1 ? i.quantity - 1 : i.quantity } : i));
    };

    const deleteFromCart = (cartItemId) => {
        setCartItems(cartItems.filter(i => i.cartItemId !== cartItemId));
    };

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const selectedBarangay = isDeliveryType(orderType) ? deliveryBarangays.find(b => b.id === customerDetails.selectedBarangayId) : null;
    const deliveryFee = selectedBarangay ? Number(selectedBarangay.delivery_fee) : 0;
    const grandTotal = cartTotal + deliveryFee;

    const handlePlaceOrder = async () => {
        if (!orderType) {
            showBrandedMessage('Please select an order type (Dine-in, Pickup, or Delivery).', 'error');
            return;
        }

        const { name, phone, table_number, address, pickup_time, preferred_time, selectedBarangayId } = customerDetails;
        const typeName = getOrderType(orderType).toLowerCase();

        if (isPickupType(orderType) && (!name || !phone || !pickup_time)) { 
            showBrandedMessage('Please provide Name, Phone Number, and Pickup Time.', 'error'); 
            return; 
        }
        if (isDeliveryType(orderType)) {
            if (!name || !phone || !address) { 
                showBrandedMessage('Please provide Name, Phone Number, and Delivery Address.', 'error'); 
                return; 
            }
            if (!selectedBarangayId) { 
                showBrandedMessage('Please select a Delivery Barangay.', 'error'); 
                return; 
            }
        }

        if (!paymentMethod) { 
            showBrandedMessage('Please select a payment method.', 'error'); 
            return; 
        }

        setIsSubmitting(true);

        try {
            const itemDetails = cartItems.map(item => {
                let d = `${item.name} (x${item.quantity})`;
                if (item.selectedVariation) d += ` - ${item.selectedVariation.name}`;
                return d;
            });

            const newOrder = {
                order_type: orderType,
                payment_method: paymentMethod,
                customer_details: customerDetails,
                items: itemDetails,
                total_amount: grandTotal,
                delivery_barangay: selectedBarangay ? selectedBarangay.barangay_name : null,
                delivery_fee: deliveryFee,
                status: 'Pending'
            };

            const { error } = await supabase.from('orders').insert([newOrder]);
            if (error) {
                console.error('Error saving order to Supabase:', error);
            }

            // Backup to LocalStorage
            const localOrder = { ...newOrder, id: Date.now(), timestamp: new Date().toISOString() };
            try {
                const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                setLocalData('orders', [...existingOrders, localOrder]);
            } catch (e) {
                console.warn("Failed to backup order to localStorage");
            }

            // Prepare Messenger message (simplified to avoid spam detection)
            const summary = itemDetails.join('\n');
            let info = `${isDeliveryType(orderType) ? 'Designated Name' : 'Name'}: ${customerDetails.name}`;
            if (isPickupType(orderType)) {
                info += ` | Phone: ${customerDetails.phone} | Pickup Time: ${customerDetails.pickup_time}`;
            }
            if (isDeliveryType(orderType)) {
                info += ` | Phone: ${customerDetails.phone} | Address: ${customerDetails.address}`;
                info += ` | Barangay: ${selectedBarangay?.barangay_name || 'N/A'}`;
                if (customerDetails.preferred_time) info += ` | Preferred Delivery Time: ${customerDetails.preferred_time}`;
            }

            let message = `Hi! New order for ${customerDetails.name}:
            
${summary}

Subtotal: P${cartTotal}`;

            if (isDeliveryType(orderType) && deliveryFee > 0) {
                message += `\nDelivery Fee: P${deliveryFee}`;
            }

            message += `\nGrand Total: P${grandTotal}
Type: ${getOrderType(orderType)}
${info}`.trim();

            const messengerUrl = `https://m.me/${storeSettings.facebook_messenger_link || '61579032505526'}?text=${encodeURIComponent(message)}`;

            setOrderSuccess(true);
            setCartItems([]);

            window.open(messengerUrl, '_blank');
        } catch (err) {
            console.error('Order process error:', err);
            showBrandedMessage('Something went wrong. Please try again or contact us directly.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${minutes} ${ampm}`;
    };

    // MEMO: Filtered items memoized to prevent expensive re-filtering
    const filteredItems = useMemo(() => {
        if (!activeCategory || activeCategory === 'all') return items;
        return items.filter(item => item.category_id === activeCategory);
    }, [items, activeCategory]);

    return (
        <div className="page-wrapper">
            {/* Branded Toast Notification */}
            {message && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: messageType === 'success' ? 'var(--primary)' : messageType === 'error' ? '#ef4444' : '#f59e0b',
                    color: messageType === 'success' ? 'var(--text-dark)' : 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    zIndex: 5000,
                    fontWeight: 700,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'slideDown 0.3s ease-out forwards',
                    fontSize: '0.95rem'
                }}>
                    {messageType === 'success' && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
                    )}
                    {messageType === 'error' && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>!</div>
                    )}
                    {messageType === 'warning' && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚠</div>
                    )}
                    {message}
                    <style>{`
                        @keyframes slideDown {
                            0% { transform: translate(-50%, -100%); opacity: 0; }
                            80% { transform: translate(-50%, 10px); }
                            100% { transform: translate(-50%, 0); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}



            <header className="app-header">
                <div className="container header-container">
                    <Link to="/" className="brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={storeSettings.logo_url || '/logo.png'} alt={storeSettings.store_name} style={{ height: '40px', width: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{storeSettings.store_name}</span>
                    </Link>

                    <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button className="btn-accent" onClick={() => setIsCartOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                            <ShoppingBag size={18} />
                            <span>Cart ({cartCount})</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Sticky Category Slider */}
            <div className="category-slider-wrapper">
                <div className="container">
                    <div className="category-slider">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-slide-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* How to Use QR Order Section */}
            <section className="hero-section" style={{ background: '#ffffff', color: 'var(--text-color)', padding: '60px 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-color)' }}>How to order</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>Fast, easy, and convenient ordering through your mobile device</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', maxWidth: '600px', margin: '0 auto', paddingBottom: '20px' }}>
                        {/* Step 1 */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ background: '#e0f2fe', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--primary)' }}><QrCode size={24} /></div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '5px', fontWeight: 700 }}>Scan QR</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.3', fontSize: '0.8rem', margin: 0 }}>Scan the QR code.</p>
                        </div>

                        {/* Step 2 */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ background: '#e0f2fe', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--primary)' }}><MessageCircle size={24} /></div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '5px', fontWeight: 700 }}>Order</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.3', fontSize: '0.8rem', margin: 0 }}>Select items & sizes.</p>
                        </div>

                        {/* Step 3 */}
                        <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ background: '#e0f2fe', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--primary)' }}><MessageCircle size={24} /></div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '5px', fontWeight: 700 }}>Send Orders</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.3', fontSize: '0.8rem', margin: 0 }}>Send via Messenger.</p>
                        </div>
                    </div>
                </div>
            </section>


            <main className="container" id="menu" style={{ padding: '80px 0' }}>


                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p style={{ color: 'var(--text-muted)' }}>Loading delicious menu...</p>
                    </div>
                ) : (
                    <>
                        {filteredItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                <UtensilsCrossed size={48} style={{ color: 'var(--text-muted)', marginBottom: '20px', opacity: 0.5 }} />
                                <h3>No items found in this category</h3>
                                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setActiveCategory('all')}>View All Items</button>
                            </div>
                        ) : (
                            <div className="menu-grid">
                                {filteredItems.map(item => (
                                    <MenuItem
                                        key={item.id}
                                        item={item}
                                        openProductSelection={openProductSelection}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Selection Modal (Remains same) */}
            {selectedProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <img src={selectedProduct.image} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                            <div><h2 style={{ margin: 0 }}>{selectedProduct.name}</h2><p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedProduct.description}</p></div>
                        </div>

                        {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '10px' }}>Select Size/Variation</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {selectedProduct.variations.map(v => (
                                        <button
                                            key={v.name}
                                            disabled={v.disabled}
                                            onClick={() => setSelectionOptions({ ...selectionOptions, variation: v })}
                                            style={{
                                                padding: '8px 15px', borderRadius: '10px', border: '1px solid var(--primary)',
                                                background: selectionOptions.variation?.name === v.name ? 'var(--primary)' : 'white',
                                                color: selectionOptions.variation?.name === v.name ? 'white' : 'var(--primary)',
                                                cursor: v.disabled ? 'not-allowed' : 'pointer',
                                                opacity: v.disabled ? 0.3 : 1
                                            }}
                                        >
                                            {v.name} (+₱{v.price}) {v.disabled && '(Out of Stock)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Quantity Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '14px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quantity</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <button
                                    type="button"
                                    onClick={() => setModalQty(q => Math.max(1, q - 1))}
                                    style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--primary)', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700 }}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={16} />
                                </button>
                                <span style={{ fontWeight: 800, fontSize: '1.2rem', minWidth: '20px', textAlign: 'center' }}>{modalQty}</span>
                                <button
                                    type="button"
                                    onClick={() => setModalQty(q => q + 1)}
                                    style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--primary)', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700 }}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', padding: '15px', fontWeight: 700, fontSize: '1.1rem' }} onClick={() => addToCart(selectedProduct, selectionOptions, modalQty)}>
                            Add {modalQty > 1 ? `${modalQty}x ` : ''}to Cart - ₱{(
                                ((selectionOptions.variation && Number(selectionOptions.variation.price) > 0)
                                    ? (selectedProduct.name?.toLowerCase().includes('pork ribs')
                                        ? Number(selectedProduct.promo_price || selectedProduct.price) + Number(selectionOptions.variation.price)
                                        : Number(selectionOptions.variation.price))
                                    : Number(selectedProduct.promo_price || selectedProduct.price)) * modalQty
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Checkout Modal (Remains same) */}
            {isCheckoutOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(false); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>

                        {orderSuccess ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
                                <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Order Placed!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Your order has been recorded and sent to our Messenger chat. Thank you for your order!</p>
                                <button
                                    onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(false); }}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 800 }}
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ marginBottom: '30px', fontSize: '1.8rem', color: 'var(--primary)' }}>Checkout</h2>

                                <div style={{ marginBottom: '30px' }}>
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '1rem', display: 'block', marginBottom: '15px' }}>Payment Method</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                            <button
                                                onClick={() => setPaymentMethod('Cash/COD')}
                                                style={{
                                                    padding: '15px', borderRadius: '15px', border: '2px solid',
                                                    borderColor: paymentMethod === 'Cash/COD' ? 'var(--primary)' : '#e2e8f0',
                                                    background: paymentMethod === 'Cash/COD' ? '#f0f9ff' : 'white',
                                                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>💵</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Cash / COD</div>
                                            </button>
                                            {paymentSettings.map(method => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    style={{
                                                        padding: '15px', borderRadius: '15px', border: '2px solid',
                                                        borderColor: paymentMethod === method.id ? 'var(--primary)' : '#e2e8f0',
                                                        background: paymentMethod === method.id ? '#f0f9ff' : 'white',
                                                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>💳</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{method.name}</div>
                                                </button>
                                            ))}
                                        </div>

                                        {paymentMethod && paymentMethod !== 'Cash/COD' && (
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                {paymentSettings.find(m => m.id === paymentMethod) ? (
                                                    (() => {
                                                        const method = paymentSettings.find(m => m.id === paymentMethod);
                                                        const hasDetails = method.qr_url || method.account_number || method.account_name;
                                                        if (!hasDetails) {
                                                            return <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Please prepare the payment upon delivery/pickup.</p>;
                                                        }
                                                        return (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Send {method.name} Payment</h4>
                                                                {method.qr_url && (
                                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                                                                        <img src={method.qr_url} style={{ width: '180px', height: '180px', borderRadius: '10px', objectFit: 'contain' }} alt="QR Code" />
                                                                    </div>
                                                                )}
                                                                {(method.account_number || method.account_name) && (
                                                                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                        {method.account_number && (
                                                                            <>
                                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Account Number</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                                                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{method.account_number}</div>
                                                                                    <button
                                                                                        onClick={() => { navigator.clipboard.writeText(method.account_number); alert('Copied!'); }}
                                                                                        style={{ border: 'none', background: 'var(--primary)', color: 'white', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}
                                                                                    >
                                                                                        <Copy size={14} /> Copy
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {method.account_name && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{method.account_name}</div>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Details not found.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '1rem', display: 'block', marginBottom: '15px' }}>Select Order Type</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                                            {orderTypes.filter(t => t.id !== 'dine-in' && !t.name.toLowerCase().includes('dine')).map(type => {
                                                const displayName = type.name.toLowerCase().includes('take') ? 'Pick Up' : type.name;
                                                const emoji = (type.id === 'delivery' || type.name.toLowerCase().includes('delivery')) ? '🏍️' : '🛍️';
                                                return (
                                                    <button key={type.id} onClick={() => setOrderType(type.id)} style={{ padding: '12px 8px', fontSize: '0.9rem', borderRadius: '12px', border: '1px solid var(--primary)', background: orderType === type.id ? 'var(--primary)' : 'white', color: orderType === type.id ? 'white' : 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '1.1rem' }}>{emoji}</span> {displayName}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {orderType && (
                                        <div style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>{isDeliveryType(orderType) ? 'Designated Name' : 'Full Name'}</label><input type="text" value={customerDetails.name} onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>
                                                <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Phone</label><input type="tel" value={customerDetails.phone} onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>
                                                {isPickupType(orderType) && (
                                                    <>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Pickup Time</label>
                                                            <input type="time" value={customerDetails.pickup_time} onChange={(e) => setCustomerDetails({ ...customerDetails, pickup_time: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {isDeliveryType(orderType) && (
                                                    <>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Barangay</label>
                                                            {deliveryBarangays.length > 0 ? (
                                                                <select value={customerDetails.selectedBarangayId} onChange={(e) => setCustomerDetails({ ...customerDetails, selectedBarangayId: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}>
                                                                    <option value="" disabled>Select Barangay ▼</option>
                                                                    {deliveryBarangays.map(b => (
                                                                        <option key={b.id} value={b.id}>{b.barangay_name}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>Sorry, delivery is currently unavailable as no active barangays are set up.</div>
                                                            )}
                                                        </div>
                                                        <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Address Details</label><textarea value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Preferred Delivery Time <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                                            <input type="text" value={customerDetails.preferred_time} onChange={(e) => setCustomerDetails({ ...customerDetails, preferred_time: e.target.value })} placeholder="e.g. Morning, Afternoon, 2:00 PM" style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {!isPickupType(orderType) && !isDeliveryType(orderType) && <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Notes / Instructions</label><textarea value={customerDetails.landmark} onChange={(e) => setCustomerDetails({ ...customerDetails, landmark: e.target.value })} placeholder="Any specific requests..." style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
                                            </div>
                                        </div>
                                    )}

                                    {isDeliveryType(orderType) ? (
                                        <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Subtotal:</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 700 }}>₱{cartTotal}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Delivery Fee:</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 700 }}>₱{deliveryFee}</span>
                                            </div>
                                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Grand Total:</span>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>₱{grandTotal}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount:</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>₱{grandTotal}</span>
                                        </div>
                                    )}

                                    <button
                                        className="btn-accent"
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting || (isDeliveryType(orderType) && deliveryBarangays.length === 0)}
                                        style={{ width: '100%', padding: '18px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800, fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
                                    >
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <><MessageSquare size={22} /> Confirm Order</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isCartOpen && (
                <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '450px', height: '100vh', background: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1100, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}><h2>Your Cart</h2><button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button></div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {cartItems.map(item => (
                            <div key={item.cartItemId} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start' }}>
                                <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{item.name} {item.quantity > 1 && <span style={{ color: 'var(--primary)', fontWeight: 800 }}>x{item.quantity}</span>}</h4>
                                    {item.selectedVariation && (
                                        <p style={{ margin: '2px 0 5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {item.selectedVariation.name}
                                        </p>
                                    )}
                                    <span style={{ fontWeight: 700 }}>₱{item.finalPrice * item.quantity}</span>
                                </div>
                                <button onClick={() => deleteFromCart(item.cartItemId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} style={{ width: '100%', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800 }}>Proceed to Checkout</button>
                </div>
            )}
            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '40px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '10px', fontWeight: 800 }}>Contact Us</h4>
                    <p style={{ margin: '5px 0' }}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> {storeSettings.contact || '09123456789'}</p>
                    <p style={{ margin: '5px 0' }}><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> {storeSettings.address || '123 Main Street, Your City'}</p>
                </div>
                <div>
                    Powered by: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Aquascale</span>
                </div>
            </footer>

        </div>
    );
};

export default Home;
