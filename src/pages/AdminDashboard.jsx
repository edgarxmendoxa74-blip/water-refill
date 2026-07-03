import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    LayoutDashboard,
    LogOut,
    Save,
    Plus,
    Trash2,
    Edit2,
    Package,
    Tag,
    Settings,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    X,
    List,
    CreditCard,
    ShoppingBag,
    Copy,
    Clock,
    MapPin,
    Phone,
    Printer,
    FileText,
    Camera,
    Utensils,
    Truck,
    BarChart2,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Users,
    Download,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { categories as initialCategories, menuItems as initialItems } from '../data/MenuData';

const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' };

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics'); // analytics, menu, categories, orders, payment, orderTypes
    const [message, setMessage] = useState('');

    // --- STATE MANAGEMENT ---
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('menuItems');
        return saved ? JSON.parse(saved) : initialItems;
    });

    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('categories');
        return saved ? JSON.parse(saved) : initialCategories;
    });

    const [orders, setOrders] = useState(() => {
        const saved = localStorage.getItem('orders');
        return saved ? JSON.parse(saved) : [];
    });

    const [orderTypes, setOrderTypes] = useState(() => {
        const saved = localStorage.getItem('orderTypes');
        return saved ? JSON.parse(saved) : [
            { id: 'delivery', name: 'Delivery', is_active: true },
            { id: 'pickup', name: 'Pick Up', is_active: true }
        ];
    });

    const [paymentSettings, setPaymentSettings] = useState(() => {
        const saved = localStorage.getItem('paymentSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                // Migration for existing users
                return [
                    { id: 'gcash', name: 'GCash', accountNumber: parsed.gcash?.number || '', accountName: parsed.gcash?.name || '', qrUrl: parsed.gcash?.qrUrl || '' },
                    { id: 'paymaya', name: 'PayMaya', accountNumber: parsed.paymaya?.number || '', accountName: parsed.paymaya?.name || '', qrUrl: parsed.paymaya?.qrUrl || '' }
                ];
            }
            return parsed;
        }
        return [
            { id: 'gcash', name: 'GCash', accountNumber: '', accountName: '', qrUrl: '' },
            { id: 'paymaya', name: 'PayMaya', accountNumber: '', accountName: '', qrUrl: '' }
        ];
    });

    const [storeSettings, setStoreSettings] = useState(() => {
        const saved = localStorage.getItem('storeSettings');
        return saved ? JSON.parse(saved) : {
            manual_status: 'auto', // auto, open, closed
            open_time: '10:00',
            close_time: '01:00',
            store_name: '',
            address: 'Poblacion, El Nido, Palawan',
            contact: '09563713967',
            logo_url: '',
            facebook_messenger_link: '61579032505526', // Facebook Page ID or messenger link
            banner_images: [
                'https://images.unsplash.com/photo-1517701604599-bb29b565094d?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
            ]
        };
    });

    const [deliveryBarangays, setDeliveryBarangays] = useState(() => {
        const saved = localStorage.getItem('deliveryBarangays');
        return saved ? JSON.parse(saved) : [];
    });

    // --- FETCH DATA FROM SUPABASE ---
    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const { data: catData, error: catError } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
                if (catError) throw catError;
                if (catData) setCategories(catData);

                const { data: itemData, error: itemError } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
                if (itemError) throw itemError;
                if (itemData) setItems(itemData);

                const { data: payData, error: payError } = await supabase.from('payment_settings').select('*');
                if (payError) throw payError;
                if (payData) setPaymentSettings(payData);

                const { data: typeData, error: typeError } = await supabase.from('order_types').select('*');
                if (typeError) throw typeError;
                if (typeData) setOrderTypes(typeData);

                const { data: storeData, error: storeError } = await supabase.from('store_settings').select('*').limit(1).single();
                if (storeError && storeError.code !== 'PGRST116') throw storeError; // Ignore if no settings record yet
                if (storeData) setStoreSettings(storeData);

                const { data: bgData, error: bgError } = await supabase.from('delivery_barangays').select('*').order('barangay_name', { ascending: true });
                if (bgError && bgError.code !== '42P01') throw bgError; // Ignore if table missing initially
                if (bgData) {
                    setDeliveryBarangays(bgData);
                    localStorage.setItem('deliveryBarangays', JSON.stringify(bgData));
                }

                const { data: orderData, error: orderError } = await supabase.from('orders').select('*').order('timestamp', { ascending: false });
                if (orderError) throw orderError;
                if (orderData) setOrders(orderData);
            } catch (err) {
                console.error('Error fetching admin data:', err);
                showMessage(`Error loading data: ${err.message || 'Unknown error'}`);
            }
        };
        fetchAdminData();
    }, []);

    // --- HELPERS ---
    const compressImage = (base64Str, maxWidth = 1200, quality = 0.7) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        });
    };

    // --- HELPER FUNC ---
    const handleFileUpload = async (e, methodId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const qr_url = reader.result;
                const { error } = await supabase.from('payment_settings').update({ qr_url }).eq('id', methodId);
                if (error) {
                    console.error(error);
                    showMessage(`Error saving QR code: ${error.message}`);
                    return;
                }
                setPaymentSettings(prev => prev.map(m => m.id === methodId ? { ...m, qr_url } : m));
                showMessage('QR code updated!');
            };
            reader.readAsDataURL(file);
        }
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_bypass');
        navigate('/admin');
    };

    // --- COMPONENT: MENU MANAGER ---
    const MenuManager = () => {
        const [editingItem, setEditingItem] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [filterCategory, setFilterCategory] = useState('all');
        const [tempVariations, setTempVariations] = useState([]);

        useEffect(() => {
            if (editingItem) {
                setTempVariations(editingItem.variations || []);
            }
        }, [editingItem]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const itemData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: Number(formData.get('price')),
                promo_price: formData.get('promoPrice') ? Number(formData.get('promoPrice')) : null,
                category_id: formData.get('categoryId'),
                image: editingItem.image || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80',
                variations: tempVariations,
                out_of_stock: formData.get('outOfStock') === 'on'
            };

            let finalItem;
            if (editingItem.id === 'new') {
                if (!itemData.category_id) { showMessage('Please select a category first.'); return; }
                const { data, error } = await supabase.from('menu_items').insert([itemData]).select().single();
                if (error) { console.error(error); showMessage(`Error saving: ${error.message}`); return; }
                finalItem = data;
                setItems([...items, finalItem]);
            } else {
                const { data, error } = await supabase.from('menu_items').update(itemData).eq('id', editingItem.id).select().single();
                if (error) { console.error(error); showMessage(`Error updating: ${error.message}`); return; }
                finalItem = data;
                setItems(items.map(i => i.id === finalItem.id ? finalItem : i));
            }

            setEditingItem(null);
            showMessage('Product saved successfully!');
        };

        const deleteItem = async (id) => {
            if (window.confirm('Delete this product?')) {
                const { error } = await supabase.from('menu_items').delete().eq('id', id);
                if (error) { console.error(error); showMessage(`Error deleting: ${error.message}`); return; }
                setItems(items.filter(i => i.id !== id));
                showMessage('Product deleted.');
            }
        };

        const moveItem = async (id, direction) => {
            const index = items.findIndex(i => i.id === id);
            if (index === -1) return;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= items.length) return;

            const newItems = [...items];
            const [removed] = newItems.splice(index, 1);
            newItems.splice(newIndex, 0, removed);

            // Re-index all items to ensure consistent sort_order
            const updatedItems = newItems.map((item, idx) => ({ ...item, sort_order: idx }));
            setItems(updatedItems);

            // Update Supabase for all items (batch update)
            const { error } = await supabase.from('menu_items').upsert(updatedItems);
            if (error) {
                console.error('Error syncing order:', error);
                showMessage('Error saving item order.');
            } else {
                showMessage('Item order updated!');
            }
        };

        const filteredItems = items.filter(item => {
            const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
            return matchesSearch && matchesCategory;
        });

        // Render List
        if (!editingItem) return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Menu Items</h2>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, width: '250px' }}
                        />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ ...inputStyle, width: '180px' }}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => setEditingItem({ id: 'new', category_id: categories[0]?.id })} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                            <Plus size={18} /> Add Product
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}><th style={{ padding: '10px' }}>Product</th><th style={{ padding: '10px' }}>Category</th><th style={{ padding: '10px' }}>Price</th><th style={{ padding: '10px' }}>Status</th><th style={{ padding: '10px' }}>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products found matching your criteria.</td></tr>
                            ) : filteredItems.map(item => (
                                <tr key={item.id} style={{ background: '#f8fafc' }}>
                                    <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <img src={item.image} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{ padding: '4px 10px', background: '#e2e8f0', borderRadius: '20px', fontSize: '0.8rem' }}>
                                            {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {item.promo_price ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#ef4444', fontWeight: 700 }}>₱{item.promo_price}</span>
                                                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>₱{item.price}</span>
                                            </div>
                                        ) : <span style={{ fontWeight: 700 }}>₱{item.price}</span>}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <button
                                            onClick={async () => {
                                                const newStatus = !item.out_of_stock;
                                                setItems(items.map(i => i.id === item.id ? { ...i, out_of_stock: newStatus } : i));
                                                const { error } = await supabase.from('menu_items').update({ out_of_stock: newStatus }).eq('id', item.id);
                                                if (error) {
                                                    console.error(error);
                                                    showMessage(`Error updating status: ${error.message}`);
                                                    setItems(items.map(i => i.id === item.id ? { ...i, out_of_stock: !newStatus } : i));
                                                } else {
                                                    showMessage(`${item.name} is now ${newStatus ? 'Not Available' : 'Available'}`);
                                                }
                                            }}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: item.out_of_stock ? '#fee2e2' : '#dcfce7',
                                                color: item.out_of_stock ? '#dc2626' : '#16a34a'
                                            }}
                                        >
                                            {item.out_of_stock ? '❌ Not Available' : '✅ Available'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '15px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => moveItem(item.id, 'up')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Move Up"><ChevronUp size={18} /></button>
                                            <button onClick={() => moveItem(item.id, 'down')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Move Down"><ChevronDown size={18} /></button>
                                            <button onClick={() => setEditingItem(item)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Edit"><Edit2 size={18} /></button>
                                            <button onClick={() => deleteItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

        // Render Editor (Simplified for brevity but functional)
        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3>{editingItem.id === 'new' ? 'New Product' : 'Edit Product'}</h3>
                    <button onClick={() => setEditingItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
                        <input name="name" defaultValue={editingItem.name} placeholder="Product Name" required style={inputStyle} />
                        <textarea name="description" defaultValue={editingItem.description} placeholder="Description" style={inputStyle} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <input name="price" type="number" defaultValue={editingItem.price} placeholder="Price" required style={inputStyle} />
                            <input name="promoPrice" type="number" defaultValue={editingItem.promo_price} placeholder="Promo Price (Optional)" style={inputStyle} />
                        </div>
                        <select name="categoryId" defaultValue={editingItem.category_id} style={inputStyle}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontWeight: 600 }}>Product Image</label>
                            {editingItem.image && <img src={editingItem.image} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} />}
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEditingItem({ ...editingItem, image: reader.result });
                                    reader.readAsDataURL(file);
                                }
                            }} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input name="outOfStock" type="checkbox" defaultChecked={editingItem.out_of_stock} style={{ width: '20px', height: '20px' }} />
                            <label style={{ fontWeight: 600 }}>Mark as Out of Stock</label>
                        </div>
                    </div>

                    {/* Variations */}
                    <SectionLabel title="Variations" onAdd={() => setTempVariations([...tempVariations, { name: 'Size', price: 0 }])} />
                    {tempVariations.map((v, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <input value={v.name} onChange={e => { const n = [...tempVariations]; n[i].name = e.target.value; setTempVariations(n); }} placeholder="Name" style={inputStyle} />
                            <input type="number" value={v.price} onChange={e => { const n = [...tempVariations]; n[i].price = Number(e.target.value); setTempVariations(n); }} placeholder="Price" style={inputStyle} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={v.disabled} onChange={e => { const n = [...tempVariations]; n[i].disabled = e.target.checked; setTempVariations(n); }} />
                                <label style={{ fontSize: '0.75rem' }}>Disabled</label>
                            </div>
                            <button type="button" onClick={() => setTempVariations(tempVariations.filter((_, idx) => idx !== i))} style={{ color: 'red', border: 'none', background: 'none' }}><X size={18} /></button>
                        </div>
                    ))}

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>Save Product</button>
                </form>
            </div>
        );
    };

    // --- COMPONENT: CATEGORY MANAGER ---
    const CategoryManager = () => {
        const [newCat, setNewCat] = useState('');
        const [editingCatId, setEditingCatId] = useState(null);
        const [editCatName, setEditCatName] = useState('');

        const addCategory = async (e) => {
            e.preventDefault();
            if (!newCat.trim()) return;
            const { data, error } = await supabase.from('categories').insert([{ name: newCat, sort_order: categories.length }]).select().single();
            if (error) { console.error(error); showMessage(`Error adding category: ${error.message}`); return; }
            setCategories([...categories, data]);
            setNewCat('');
            showMessage('Category added!');
        };

        const startEdit = (cat) => {
            setEditingCatId(cat.id);
            setEditCatName(cat.name);
        };

        const saveEdit = async (id) => {
            if (!editCatName.trim()) return;
            const { data, error } = await supabase.from('categories').update({ name: editCatName }).eq('id', id).select().single();
            if (error) { console.error(error); showMessage(`Error updating: ${error.message}`); return; }
            setCategories(categories.map(c => c.id === id ? data : c));
            setEditingCatId(null);
            showMessage('Category updated!');
        };

        const moveCategory = async (id, direction) => {
            const index = categories.findIndex(c => c.id === id);
            if (index === -1) return;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= categories.length) return;

            const newCats = [...categories];
            const [removed] = newCats.splice(index, 1);
            newCats.splice(newIndex, 0, removed);

            const updatedCats = newCats.map((cat, idx) => ({ ...cat, sort_order: idx }));
            setCategories(updatedCats);

            const { error } = await supabase.from('categories').upsert(updatedCats);
            if (error) {
                console.error('Error syncing order:', error);
                showMessage('Error saving category order.');
            } else {
                showMessage('Category order updated!');
            }
        };

        const deleteCategory = async (id) => {
            if (items.some(i => i.category_id === id)) {
                alert('Cannot delete category because it has products.');
                return;
            }
            if (window.confirm('Delete category?')) {
                const { error } = await supabase.from('categories').delete().eq('id', id);
                if (error) { console.error(error); showMessage(`Error deleting: ${error.message}`); return; }
                setCategories(categories.filter(c => c.id !== id));
                showMessage('Category deleted.');
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <h2 style={{ marginBottom: '30px' }}>Categories Management</h2>
                <form onSubmit={addCategory} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New Category Name (e.g. Desserts)" style={{ ...inputStyle, flex: 1 }} />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }}>Add Category</button>
                </form>
                <div style={{ display: 'grid', gap: '15px' }}>
                    {categories.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            {editingCatId === c.id ? (
                                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                    <input value={editCatName} onChange={e => setEditCatName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <button onClick={() => saveEdit(c.id)} className="btn-primary" style={{ padding: '5px 15px' }}>Save</button>
                                    <button onClick={() => setEditingCatId(null)} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '10px', padding: '5px 15px' }}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{items.filter(i => i.category_id === c.id).length} products</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => moveCategory(c.id, 'up')} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }} title="Move Up"><ChevronUp size={20} /></button>
                                        <button onClick={() => moveCategory(c.id, 'down')} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }} title="Move Down"><ChevronDown size={20} /></button>
                                        <button onClick={() => startEdit(c)} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }} title="Edit"><Edit2 size={20} /></button>
                                        <button onClick={() => deleteCategory(c.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={20} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- COMPONENT: ORDER TYPE MANAGER ---
    const OrderTypeManager = () => {
        const FIXED_TYPES = [
            { id: 'delivery', name: 'Delivery', defaultActive: true },
            { id: 'pickup', name: 'Pick Up', defaultActive: true }
        ];

        const [localTypes, setLocalTypes] = useState([]);

        useEffect(() => {
            // Merge fixed types with db state
            const merged = FIXED_TYPES.map(ft => {
                const existing = orderTypes.find(t => t.id === ft.id);
                return existing ? existing : { ...ft, is_active: ft.defaultActive };
            });
            setLocalTypes(merged);
        }, [orderTypes]);

        const toggleType = async (type) => {
            const newStatus = !type.is_active;

            // Optimistic update
            const updated = localTypes.map(t => t.id === type.id ? { ...t, is_active: newStatus, name: type.name } : t);
            setLocalTypes(updated);
            setOrderTypes(updated);

            // Update DB
            const { error } = await supabase.from('order_types').upsert({
                id: type.id,
                name: type.name, // Ensure name is saved (e.g. "Pick Up")
                is_active: newStatus
            });

            if (error) {
                console.error(error);
                showMessage(`Error updating: ${error.message}`);
                // Revert on error would go here
            } else {
                showMessage(`${type.name} is now ${newStatus ? 'Active' : 'Inactive'}`);
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <h2 style={{ marginBottom: '10px' }}>Order Types Management</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Manage the availability of service options.</p>

                <div style={{ display: 'grid', gap: '15px' }}>
                    {localTypes.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: t.is_active ? 'var(--primary)' : '#cbd5e1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    {t.id === 'dine-in' && <Utensils size={20} />}
                                    {t.id === 'pickup' && <ShoppingBag size={20} />}
                                    {t.id === 'delivery' && <Truck size={20} />}
                                </div>
                                <div>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem', display: 'block' }}>{t.name}</span>
                                    <span style={{ fontSize: '0.85rem', color: t.is_active ? '#166534' : 'var(--text-muted)' }}>
                                        {t.is_active ? 'Currently Available' : 'Unavailable'}
                                    </span>
                                </div>
                            </div>

                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={t.is_active !== false}
                                    onChange={() => toggleType(t)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: t.is_active ? 'var(--primary)' : '#ccc',
                                    transition: '.4s', borderRadius: '34px'
                                }}></span>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px', left: '3px', bottom: '3px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                    transform: t.is_active ? 'translateX(24px)' : 'translateX(0)'
                                }}></span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- COMPONENT: PAYMENT SETTINGS ---
    const PaymentSettings = () => {
        const [editingMethodId, setEditingMethodId] = useState(null);
        const [showAddMethod, setShowAddMethod] = useState(false);
        const [isCompressing, setIsCompressing] = useState(false);

        const handleSaveMethod = async (e, methodId) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updateData = {
                name: formData.get('name'),
                account_number: formData.get('accountNumber'),
                account_name: formData.get('accountName'),
            };
            const { data, error } = await supabase.from('payment_settings').update(updateData).eq('id', methodId).select().single();
            if (error) { console.error(error); showMessage(`Error updating: ${error.message}`); return; }
            setPaymentSettings(paymentSettings.map(m => m.id === methodId ? data : m));
            setEditingMethodId(null);
            showMessage('Payment method updated!');
        };

        const handleFileUpload = (e, methodId) => {
            const file = e.target.files[0];
            if (!file) return;

            setIsCompressing(true);
            showMessage('Compressing image...');

            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64Str = reader.result;
                    // Compress image before uploading
                    const compressed = await compressImage(base64Str, 600, 0.8);
                    
                    const { data, error } = await supabase.from('payment_settings').update({ qr_url: compressed }).eq('id', methodId).select().single();
                    if (error) { 
                        console.error(error); 
                        showMessage(`Error uploading image: ${error.message}`); 
                        setIsCompressing(false);
                        return; 
                    }
                    setPaymentSettings(paymentSettings.map(m => m.id === methodId ? data : m));
                    showMessage('QR Code/Image uploaded successfully!');
                    setIsCompressing(false);
                } catch (err) {
                    console.error('Compression error:', err);
                    showMessage('Error processing image');
                    setIsCompressing(false);
                }
            };
            reader.readAsDataURL(file);
        };

        const removeQRImage = async (methodId) => {
            if (window.confirm('Remove this QR code image?')) {
                const { error } = await supabase.from('payment_settings').update({ qr_url: null }).eq('id', methodId);
                if (error) { console.error(error); showMessage(`Error removing image: ${error.message}`); return; }
                setPaymentSettings(paymentSettings.map(m => m.id === methodId ? { ...m, qr_url: null } : m));
                showMessage('QR code removed.');
            }
        };

        const handleAddMethod = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newMethod = {
                name: formData.get('name'),
                account_number: formData.get('accountNumber'),
                account_name: formData.get('accountName'),
                qr_url: ''
            };
            const { data, error } = await supabase.from('payment_settings').insert([newMethod]).select().single();
            if (error) { console.error(error); showMessage(`Error adding: ${error.message}`); return; }
            setPaymentSettings([...paymentSettings, data]);
            setShowAddMethod(false);
            showMessage('Payment method added!');
        };

        const deleteMethod = async (id) => {
            if (window.confirm('Delete this payment method?')) {
                const { error } = await supabase.from('payment_settings').delete().eq('id', id);
                if (error) { console.error(error); showMessage(`Error deleting: ${error.message}`); return; }
                setPaymentSettings(paymentSettings.filter(m => m.id !== id));
                showMessage('Payment method deleted.');
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0 }}>Payment Methods Management</h2>
                    <button onClick={() => setShowAddMethod(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                        <Plus size={18} /> Add Method
                    </button>
                </div>

                {showAddMethod && (
                    <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Add New Payment Method</h3>
                            <button onClick={() => setShowAddMethod(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form 
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const fileInput = e.target.querySelector('input[type="file"]');
                                const file = fileInput.files[0];
                                
                                let qr_url = '';
                                if (file) {
                                    setIsCompressing(true);
                                    showMessage('Processing image...');
                                    qr_url = await new Promise((resolve) => {
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                            const compressed = await compressImage(reader.result, 600, 0.8);
                                            resolve(compressed);
                                        };
                                        reader.readAsDataURL(file);
                                    });
                                    setIsCompressing(false);
                                }

                                const newMethod = {
                                    name: formData.get('name'),
                                    account_number: formData.get('accountNumber'),
                                    account_name: formData.get('accountName'),
                                    qr_url: qr_url
                                };
                                const { data, error } = await supabase.from('payment_settings').insert([newMethod]).select().single();
                                if (error) { console.error(error); showMessage(`Error adding: ${error.message}`); return; }
                                setPaymentSettings([...paymentSettings, data]);
                                setShowAddMethod(false);
                                showMessage('Payment method added!');
                            }} 
                            style={{ display: 'grid', gap: '15px' }}
                        >
                            <input name="name" placeholder="Method Name (e.g. Bank Transfer, GCash)" required style={inputStyle} />
                            <input name="accountNumber" placeholder="Account Number" required style={inputStyle} />
                            <input name="accountName" placeholder="Account Name" required style={inputStyle} />
                            
                            <div style={{ display: 'grid', gap: '10px', padding: '15px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
                                    <ImageIcon size={18} color='var(--primary)' />
                                    QR Code/Payment Image (Optional)
                                </label>
                                
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    name="qrImage"
                                    disabled={isCompressing}
                                    style={{ ...inputStyle, fontSize: '0.85rem' }} 
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                                    Recommended: PNG/JPG format, Max 5MB. Will be automatically compressed.
                                </p>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isCompressing}>
                                {isCompressing ? 'Processing Image...' : 'Save Method'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '20px' }}>
                    {paymentSettings.map(method => (
                        <div key={method.id} style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            {editingMethodId === method.id ? (
                                <form onSubmit={(e) => handleSaveMethod(e, method.id)} style={{ display: 'grid', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0 }}>Edit {method.name}</h3>
                                        <button type="button" onClick={() => setEditingMethodId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                                    </div>
                                    <input name="name" defaultValue={method.name} placeholder="Method Name" required style={inputStyle} />
                                    <input name="accountNumber" defaultValue={method.account_number} placeholder="Account Number" required style={inputStyle} />
                                    <input name="accountName" defaultValue={method.account_name} placeholder="Account Name" required style={inputStyle} />

                                    {/* QR Image Upload in Edit Mode */}
                                    <div style={{ display: 'grid', gap: '10px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
                                            <ImageIcon size={18} color='var(--primary)' />
                                            QR Code/Payment Image
                                        </label>
                                        
                                        {method.qr_url && (
                                            <div style={{ position: 'relative', display: 'inline-width', width: '120px' }}>
                                                <img src={method.qr_url} style={{ width: '120px', height: '120px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #e2e8f0', display: 'block' }} alt="Current QR" />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeQRImage(method.id)} 
                                                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    title="Remove image"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                        
                                        <div style={{ marginTop: method.qr_url ? '10px' : '0' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                                                {method.qr_url ? 'Update Image' : 'Choose Image'}
                                            </label>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleFileUpload(e, method.id)} 
                                                disabled={isCompressing}
                                                style={{ ...inputStyle, fontSize: '0.85rem' }} 
                                            />
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                                                Recommended: PNG/JPG format, Max 5MB. Will be automatically compressed.
                                            </p>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary">Save Changes</button>
                                </form>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {method.name}
                                            </h3>
                                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{method.account_number}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(method.account_number); showMessage('Number copied!'); }} style={{ border: 'none', background: '#e2e8f0', color: 'var(--primary)', borderRadius: '5px', padding: '5px', cursor: 'pointer' }} title="Copy Number">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>{method.account_name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => setEditingMethodId(method.id)} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }}><Edit2 size={20} /></button>
                                            <button onClick={() => deleteMethod(method.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                                        </div>
                                    </div>

                                    {/* QR Code/Image Section */}
                                    <div style={{ marginTop: '15px', padding: '20px', background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '12px' }}>
                                        {method.qr_url ? (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)' }}>QR Code/Payment Image</h4>
                                                    <button 
                                                        onClick={() => removeQRImage(method.id)} 
                                                        style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
                                                        title="Remove image"
                                                    >
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                </div>
                                                <img src={method.qr_url} style={{ width: '180px', height: '180px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #e2e8f0', display: 'block', margin: '0 auto 15px' }} alt="QR Code" />
                                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Update Image</label>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleFileUpload(e, method.id)} 
                                                    disabled={isCompressing}
                                                    style={{ ...inputStyle, fontSize: '0.85rem', color: isCompressing ? 'var(--text-muted)' : 'var(--text-color)' }} 
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                <div style={{ background: '#eff6ff', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                                    <ImageIcon size={32} color='var(--primary)' />
                                                </div>
                                                <h4 style={{ margin: '0 0 5px 0', fontWeight: 600, color: 'var(--text-color)' }}>Add QR Code/Payment Image</h4>
                                                <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload a QR code or payment screenshot</p>
                                                <label style={{ display: 'inline-block' }}>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleFileUpload(e, method.id)} 
                                                        disabled={isCompressing}
                                                        style={{ display: 'none' }} 
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
                                                        disabled={isCompressing}
                                                        className="btn-primary" 
                                                        style={{ padding: '10px 20px', borderRadius: '8px', cursor: isCompressing ? 'not-allowed' : 'pointer', opacity: isCompressing ? 0.6 : 1 }}
                                                    >
                                                        {isCompressing ? 'Uploading...' : 'Choose Image'}
                                                    </button>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- COMPONENT: ORDERS LIST ---
    const OrderHistory = () => {
        const [orderTypes, setOrderTypes] = useState([]);
        
        useEffect(() => {
            const fetchTypes = async () => {
                const { data } = await supabase.from('order_types').select('*');
                if (data) setOrderTypes(data);
            };
            fetchTypes();
        }, []);

        const getOrderTypeName = (typeIdOrName) => {
            if (!typeIdOrName) return 'N/A';
            const found = orderTypes.find(t => t.id === typeIdOrName);
            return found ? found.name : typeIdOrName;
        };

        const stats = orders.reduce((acc, order) => {
            acc.totalOrders++;
            if (order.status !== 'Cancelled') {
                acc.totalSales += Number(order.total_amount || 0);
            }
            if (order.status === 'Pending' || !order.status) acc.pendingOrders++;
            return acc;
        }, { totalOrders: 0, totalSales: 0, pendingOrders: 0 });

        const updateOrderStatus = async (orderId, newStatus) => {
            const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            if (error) { console.error(error); showMessage(`Error updating status: ${error.message}`); return; }
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            showMessage('Order status updated!');
        };

        const deleteOrder = async (orderId) => {
            if (window.confirm('Are you sure you want to delete this order?')) {
                const { error } = await supabase.from('orders').delete().eq('id', orderId);
                if (error) { console.error(error); showMessage(`Error deleting: ${error.message}`); return; }
                setOrders(orders.filter(o => o.id !== orderId));
                showMessage('Order deleted.');
            }
        };

        const printReceipt = (order) => {
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Receipt - ${order.id}</title>
                        <style>
                            body { font-family: 'Courier New', Courier, monospace; padding: 10px; width: 57mm; margin: 0; font-size: 11px; line-height: 1.2; color: #000; }
                            .center { text-align: center; }
                            .logo { max-width: 30mm; max-height: 30mm; margin: 0 auto 5px; display: block; object-fit: contain; }
                            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                            .item { display: flex; justify-content: space-between; margin-bottom: 3px; }
                            .total { font-weight: bold; font-size: 13px; margin-top: 5px; }
                            @media print { 
                                body { width: 57mm; padding: 0; }
                                @page { margin: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="center">
                            ${storeSettings.logo_url ? `<img src="${storeSettings.logo_url}" class="logo">` : ''}
                            <div style="font-weight:bold; font-size: 14px; text-transform: uppercase;">${storeSettings.store_name}</div>
                            <div style="margin-top: 2px;">${storeSettings.address}</div>
                            <div>Tel: ${storeSettings.contact}</div>
                        </div>
                        <div class="divider"></div>
                        <div>
                            <strong>OR#:</strong> ${order.id.toString().slice(-6).toUpperCase()}<br>
                            <strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}<br>
                            <strong>Type:</strong> ${getOrderTypeName(order.order_type).toUpperCase()}<br>
                            <strong>Cust:</strong> ${order.customer_details?.name}
                            ${order.customer_details?.table_number ? `<br><strong>Table:</strong> ${order.customer_details.table_number}` : ''}
                        </div>
                        <div class="divider"></div>
                        <div style="font-weight:bold; margin-bottom: 5px;">ITEMS:</div>
                        ${(order.items || []).map(item => `<div class="item"><span>• ${item}</span></div>`).join('')}
                        <div class="divider"></div>
                        <div class="item total">
                            <span>TOTAL</span>
                            <span>₱${order.total_amount}</span>
                        </div>
                        <div class="divider"></div>
                        <div class="center" style="margin-top: 10px; font-style: italic;">
                            *** THANK YOU! ***<br>
                            Please come again.
                        </div>
                        <script>
                            window.onload = () => {
                                window.print();
                                setTimeout(() => window.close(), 500);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
            showMessage('Receipt generated! Check your print window.');
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0 }}>Orders Management</h2>
                </div>

                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '15px', border: '1px solid #dbeafe' }}>
                        <div style={{ color: '#1e40af', fontSize: '0.9rem', fontWeight: 600 }}>Total Orders</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a' }}>{stats.totalOrders}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '15px', border: '1px solid #dcfce7' }}>
                        <div style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>Total Sales</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#14532d' }}>₱{stats.totalSales}</div>
                    </div>
                    <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '15px', border: '1px solid #ffedd5' }}>
                        <div style={{ color: '#9a3412', fontSize: '0.9rem', fontWeight: 600 }}>Pending Orders</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c2d12' }}>{stats.pendingOrders}</div>
                    </div>
                </div>

                {orders.length === 0 ? <p className="text-muted">No orders recorded yet.</p> : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {orders.slice().reverse().map((order, idx) => (
                            <div key={order.id || idx} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <span style={{ fontWeight: 800, color: 'var(--primary)', marginRight: '10px' }}>{getOrderTypeName(order.order_type).toUpperCase()}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(order.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <select
                                                id={`status-${order.id}`}
                                                defaultValue={order.status || 'Pending'}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #cbd5e1',
                                                    fontSize: '0.85rem',
                                                    outline: 'none',
                                                    background: order.status === 'Completed' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#f8fafc',
                                                    color: order.status === 'Completed' ? '#166534' : order.status === 'Cancelled' ? '#991b1b' : 'inherit',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Preparing">Preparing</option>
                                                <option value="Ready">Ready</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, document.getElementById(`status-${order.id}`).value)}
                                                className="btn-primary"
                                                style={{ padding: '6px 15px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <Save size={14} /> Save
                                            </button>
                                        </div>
                                        <button onClick={() => printReceipt(order)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} title="Print Receipt"><Printer size={18} /></button>
                                        <button onClick={() => deleteOrder(order.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} title="Delete Order"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px', fontSize: '0.95rem' }}>
                                    <strong>{order.customer_details?.name}</strong> • {order.payment_method}
                                    {order.customer_details?.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.customer_details.phone}</div>}
                                    {order.customer_details?.tableNumber && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Table: {order.customer_details.tableNumber}</div>}
                                    {order.customer_details?.address && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Address: {order.customer_details.address}</div>}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{ marginBottom: '4px' }}>• {item}</div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '15px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem' }}>
                                    Total Amount: ₱{order.total_amount}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };



    // --- COMPONENT: DELIVERY COVERAGE MANAGER ---
    const DeliveryCoverageManager = () => {
        const [showAddForm, setShowAddForm] = useState(false);
        const [editingId, setEditingId] = useState(null);

        const handleSave = async (e, id = null) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = {
                barangay_name: formData.get('barangayName'),
                delivery_fee: Number(formData.get('deliveryFee')),
                status: formData.get('status')
            };

            if (payload.delivery_fee < 0) {
                showMessage('Error: Delivery fee cannot be negative.');
                return;
            }

            try {
                let savedData;
                if (id) {
                    const { data, error } = await supabase.from('delivery_barangays').update(payload).eq('id', id).select().single();
                    if (error) throw error;
                    savedData = data;
                    setDeliveryBarangays(deliveryBarangays.map(b => b.id === id ? savedData : b));
                    setEditingId(null);
                    showMessage('Barangay updated successfully!');
                } else {
                    const { data, error } = await supabase.from('delivery_barangays').insert([payload]).select().single();
                    if (error) throw error;
                    savedData = data;
                    setDeliveryBarangays([...deliveryBarangays, savedData].sort((a, b) => a.barangay_name.localeCompare(b.barangay_name)));
                    setShowAddForm(false);
                    showMessage('Barangay added successfully!');
                }
            } catch (err) {
                console.error(err);
                if (err.code === '23505') {
                    showMessage('Error: Barangay name must be unique.');
                } else {
                    showMessage(`Error: ${err.message}`);
                }
            }
        };

        const toggleStatus = async (barangay) => {
            const newStatus = barangay.status === 'Active' ? 'Inactive' : 'Active';
            try {
                const { error } = await supabase.from('delivery_barangays').update({ status: newStatus }).eq('id', barangay.id);
                if (error) throw error;
                setDeliveryBarangays(deliveryBarangays.map(b => b.id === barangay.id ? { ...b, status: newStatus } : b));
                showMessage(`Barangay marked as ${newStatus}.`);
            } catch (err) {
                console.error(err);
                showMessage(`Error updating status: ${err.message}`);
            }
        };

        const deleteBarangay = async (id) => {
            if (window.confirm('Delete this barangay? This will remove it from the delivery options.')) {
                try {
                    const { error } = await supabase.from('delivery_barangays').delete().eq('id', id);
                    if (error) throw error;
                    setDeliveryBarangays(deliveryBarangays.filter(b => b.id !== id));
                    showMessage('Barangay deleted.');
                } catch (err) {
                    console.error(err);
                    showMessage(`Error deleting: ${err.message}`);
                }
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0 }}>Delivery Coverage Management</h2>
                    <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                        <Plus size={18} /> Add Barangay
                    </button>
                </div>

                {showAddForm && (
                    <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Add New Barangay</h3>
                            <button onClick={() => setShowAddForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={(e) => handleSave(e)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Barangay Name *</label>
                                <input name="barangayName" placeholder="e.g. Poblacion" required style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Delivery Fee (₱) *</label>
                                <input type="number" name="deliveryFee" placeholder="0.00" min="0" step="0.01" required style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Status</label>
                                <select name="status" defaultValue="Active" style={inputStyle}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 30px' }}>Save</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '10px' }}>Barangay</th>
                                <th style={{ padding: '10px' }}>Delivery Fee</th>
                                <th style={{ padding: '10px' }}>Status</th>
                                <th style={{ padding: '10px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryBarangays.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No barangays added yet.</td></tr>
                            ) : deliveryBarangays.map(b => (
                                <tr key={b.id} style={{ background: '#f8fafc' }}>
                                    {editingId === b.id ? (
                                        <td colSpan="4" style={{ padding: '15px', borderRadius: '12px' }}>
                                            <form onSubmit={(e) => handleSave(e, b.id)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'center' }}>
                                                <input name="barangayName" defaultValue={b.barangay_name} required style={inputStyle} />
                                                <input type="number" name="deliveryFee" defaultValue={b.delivery_fee} min="0" step="0.01" required style={inputStyle} />
                                                <select name="status" defaultValue={b.status} style={inputStyle}>
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                                <button type="submit" className="btn-primary" style={{ padding: '12px 20px' }}>Save</button>
                                                <button type="button" onClick={() => setEditingId(null)} style={{ padding: '12px 20px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                                            </form>
                                        </td>
                                    ) : (
                                        <>
                                            <td style={{ padding: '15px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontWeight: 600 }}>
                                                {b.barangay_name}
                                            </td>
                                            <td style={{ padding: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                                                ₱{b.delivery_fee}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ 
                                                    padding: '5px 12px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    background: b.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                                    color: b.status === 'Active' ? '#166534' : '#991b1b'
                                                }}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => toggleStatus(b)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title={b.status === 'Active' ? 'Deactivate' : 'Activate'}>
                                                        {b.status === 'Active' ? <X size={18} /> : <Save size={18} />}
                                                    </button>
                                                    <button onClick={() => setEditingId(b.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Edit"><Edit2 size={18} /></button>
                                                    <button onClick={() => deleteBarangay(b.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };



    // --- COMPONENT: ANALYTICS DASHBOARD ---
    const AnalyticsDashboard = () => {
        const [dateRange, setDateRange] = useState('7days');

        const now = new Date();
        const getStartDate = () => {
            if (dateRange === 'today') {
                const d = new Date(now); d.setHours(0,0,0,0); return d;
            }
            if (dateRange === '7days') {
                const d = new Date(now); d.setDate(d.getDate() - 7); return d;
            }
            if (dateRange === '30days') {
                const d = new Date(now); d.setDate(d.getDate() - 30); return d;
            }
            return new Date(0); // all time
        };

        const startDate = getStartDate();
        const filteredOrders = orders.filter(o => {
            const ts = o.timestamp || o.created_at;
            if (!ts) return true;
            return new Date(ts) >= startDate;
        });

        // --- KPIs ---
        const totalRevenue = filteredOrders
            .filter(o => o.status !== 'Cancelled')
            .reduce((s, o) => s + Number(o.total_amount || 0), 0);
        const totalOrders = filteredOrders.length;
        const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
        const pendingOrders = filteredOrders.filter(o => o.status === 'Pending' || !o.status).length;
        const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / Math.max(completedOrders || totalOrders, 1)).toFixed(0) : 0;
        const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(0) : 0;

        // --- REVENUE BY DAY (last 7 or 30 days) ---
        const days = dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : null;
        const dailyRevenue = (() => {
            if (!days) return [];
            const map = {};
            const dateMap = {}; // Store full date info
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const month = d.toLocaleDateString('en-PH', { month: 'short' });
                const day = d.getDate();
                const key = `${month} ${day}`;
                map[key] = 0;
                dateMap[key] = { month, day };
            }
            filteredOrders.filter(o => o.status !== 'Cancelled').forEach(o => {
                const ts = o.timestamp || o.created_at;
                if (!ts) return;
                const d = new Date(ts);
                const month = d.toLocaleDateString('en-PH', { month: 'short' });
                const day = d.getDate();
                const key = `${month} ${day}`;
                if (map[key] !== undefined) map[key] += Number(o.total_amount || 0);
            });
            return Object.entries(map).map(([k, v]) => [k, v, dateMap[k]]);
        })();

        const maxRevDay = Math.max(...dailyRevenue.map(([,v]) => v), 1);

        // --- ORDER TYPE BREAKDOWN ---
        const typeBreakdown = filteredOrders.reduce((acc, o) => {
            const t = (o.order_type || 'unknown').toLowerCase();
            const label = t.includes('delivery') ? 'Delivery' : t.includes('pickup') || t.includes('pick') ? 'Pick Up' : t;
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        const typeTotal = Object.values(typeBreakdown).reduce((s, v) => s + v, 0) || 1;
        const typeColors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

        // --- TOP PRODUCTS ---
        const productCount = {};
        filteredOrders.forEach(o => {
            (o.items || []).forEach(item => {
                const name = item.split(' (x')[0].trim();
                productCount[name] = (productCount[name] || 0) + (parseInt(item.match(/\(x(\d+)\)/)?.[1]) || 1);
            });
        });
        const topProducts = Object.entries(productCount)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 5);
        const maxProd = Math.max(...topProducts.map(([,v]) => v), 1);

        // --- PAYMENT METHOD BREAKDOWN ---
        const payBreakdown = filteredOrders.reduce((acc, o) => {
            const pm = o.payment_method === 'Cash/COD' ? 'Cash/COD' : (o.payment_method || 'Unknown');
            acc[pm] = (acc[pm] || 0) + 1;
            return acc;
        }, {});

        const cardStyle = (bg, border) => ({
            background: bg, padding: '20px', borderRadius: '16px', border: `1px solid ${border}`
        });

        const rangeBtns = [
            { key: 'today', label: 'Today' },
            { key: '7days', label: '7 Days' },
            { key: '30days', label: '30 Days' },
            { key: 'all', label: 'All Time' }
        ];

        return (
            <div style={{ display: 'grid', gap: '24px' }}>
                {/* Header */}
                <div style={{ background: 'white', padding: '24px 30px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Analytics Overview</h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track your store performance</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
                        {rangeBtns.map(btn => (
                            <button
                                key={btn.key}
                                onClick={() => setDateRange(btn.key)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                                    background: dateRange === btn.key ? 'var(--primary)' : 'transparent',
                                    color: dateRange === btn.key ? 'white' : 'var(--text-muted)'
                                }}
                            >{btn.label}</button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {[
                        { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, sub: 'excl. cancelled', bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: <TrendingUp size={22} /> },
                        { label: 'Total Orders', value: totalOrders, sub: `${pendingOrders} pending`, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: <ShoppingBag size={22} /> },
                        { label: 'Avg Order Value', value: `₱${avgOrderValue}`, sub: 'per completed order', bg: '#fefce8', border: '#fde68a', color: '#b45309', icon: <BarChart2 size={22} /> },
                        { label: 'Completion Rate', value: `${completionRate}%`, sub: `${completedOrders} completed`, bg: '#fdf4ff', border: '#e9d5ff', color: '#7c3aed', icon: <ArrowUpRight size={22} /> },
                        { label: 'Cancelled', value: cancelledOrders, sub: 'orders', bg: '#fff1f2', border: '#fecdd3', color: '#be123c', icon: <TrendingDown size={22} /> },
                    ].map((kpi, i) => (
                        <div key={i} style={{ background: kpi.bg, padding: '20px', borderRadius: '16px', border: `1px solid ${kpi.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: kpi.color, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                                    <div style={{ fontSize: '0.78rem', color: kpi.color, opacity: 0.7, marginTop: '6px' }}>{kpi.sub}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '8px', color: kpi.color }}>{kpi.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart + Order Type Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                    {/* Bar Chart */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700 }}>Revenue Over Time</h3>
                        {dailyRevenue.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No time-range chart available for All Time</div>
                        ) : (() => {
                            const barCount = dailyRevenue.length;
                            const isMany = barCount > 10;
                            const labelEvery = barCount > 20 ? 5 : barCount > 10 ? 3 : 1;
                            const showValues = barCount <= 10;
                            const chartGap = isMany ? '2px' : '6px';
                            const minBarWidth = isMany ? '12px' : 'auto';
                            const scrollRef = React.createRef();
                            const scroll = (dir) => {
                                if (scrollRef.current) {
                                    scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
                                }
                            };
                            return (
                                <div style={{ position: 'relative' }}>
                                    {/* Left arrow */}
                                    {isMany && (
                                        <button
                                            onClick={() => scroll(-1)}
                                            style={{
                                                position: 'absolute', left: '-4px', top: '50%', transform: 'translateY(-50%)',
                                                zIndex: 2, width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: 'var(--primary)'
                                            }}
                                            aria-label="Scroll left"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                    )}
                                    {/* Right arrow */}
                                    {isMany && (
                                        <button
                                            onClick={() => scroll(1)}
                                            style={{
                                                position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)',
                                                zIndex: 2, width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: 'var(--primary)'
                                            }}
                                            aria-label="Scroll right"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    )}
                                    <div
                                        ref={scrollRef}
                                        style={{
                                            overflowX: isMany ? 'auto' : 'visible',
                                            margin: isMany ? '0 28px' : '0 -4px',
                                            padding: '0 4px',
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none'
                                        }}
                                    >
                                        <style>{`
                                            .rev-chart-scroll::-webkit-scrollbar { display: none; }
                                        `}</style>
                                        <div className="rev-chart-scroll" style={{ display: 'flex', alignItems: 'flex-end', gap: chartGap, height: '180px', minWidth: isMany ? `${barCount * 22}px` : 'auto' }}>
                                            {dailyRevenue.map(([label, value, dateInfo], idx) => (
                                                <div key={label} style={{ flex: isMany ? 'none' : 1, width: isMany ? minBarWidth : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMany ? '3px' : '6px', height: '100%', justifyContent: 'flex-end' }}>
                                                    {showValues && (
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                            {value > 0 ? `₱${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}` : ''}
                                                        </div>
                                                    )}
                                                    <div
                                                        title={`${label}: ₱${value.toLocaleString()}`}
                                                        style={{
                                                            width: '100%',
                                                            height: `${Math.max((value / maxRevDay) * (showValues ? 140 : 155), value > 0 ? 6 : 2)}px`,
                                                            background: value > 0 ? 'linear-gradient(180deg, #0ea5e9, #0284c7)' : '#e2e8f0',
                                                            borderRadius: isMany ? '3px 3px 2px 2px' : '6px 6px 4px 4px',
                                                            transition: 'height 0.4s ease',
                                                            minHeight: '2px'
                                                        }}
                                                    />
                                                    <div style={{ fontSize: isMany ? '0.55rem' : '0.6rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', visibility: (idx % labelEvery === 0 || idx === barCount - 1) ? 'visible' : 'hidden' }}>
                                                        <span style={{ fontSize: isMany ? '0.65rem' : '0.7rem', fontWeight: 700, color: 'var(--text-color)' }}>{dateInfo?.day}</span>
                                                        <span style={{ fontSize: isMany ? '0.5rem' : '0.55rem' }}>{dateInfo?.month}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Order Type Donut */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700 }}>Order Types</h3>
                        {Object.keys(typeBreakdown).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders yet</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.entries(typeBreakdown).map(([type, count], i) => {
                                    const pct = ((count / typeTotal) * 100).toFixed(0);
                                    return (
                                        <div key={type}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{type}</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: typeColors[i % typeColors.length] }}>{count} ({pct}%)</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pct}%`, background: typeColors[i % typeColors.length], borderRadius: '99px', transition: 'width 0.5s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Products + Payment Methods */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    {/* Top Products */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700 }}>🏆 Top Products</h3>
                        {topProducts.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>No products ordered yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {topProducts.map(([name, qty], i) => (
                                    <div key={name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1, marginRight: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`} {name}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{qty} sold</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(qty / maxProd) * 100}%`, background: 'linear-gradient(90deg, var(--primary), #38bdf8)', borderRadius: '99px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Method Breakdown */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700 }}>💳 Payment Methods</h3>
                        {Object.keys(payBreakdown).length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>No payment data yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.entries(payBreakdown)
                                    .sort(([,a],[,b]) => b - a)
                                    .map(([method, count], i) => {
                                        const pct = ((count / totalOrders) * 100).toFixed(0);
                                        const pmColors = ['#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ef4444'];
                                        return (
                                            <div key={method}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{method}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pmColors[i % pmColors.length] }}>{count} ({pct}%)</span>
                                                </div>
                                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: pmColors[i % pmColors.length], borderRadius: '99px' }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders Summary Table */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Recent Orders</h3>
                        {filteredOrders.length > 0 && (
                            <button
                                onClick={() => {
                                    const headers = ['Customer', 'Phone', 'Type', 'Payment Method', 'Items', 'Amount', 'Delivery Fee', 'Status', 'Date'];
                                    const escapeCSV = (val) => {
                                        const str = String(val ?? '');
                                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                                            return '"' + str.replace(/"/g, '""') + '"';
                                        }
                                        return str;
                                    };
                                    const rows = filteredOrders.map(o => [
                                        escapeCSV(o.customer_details?.name),
                                        escapeCSV(o.customer_details?.phone),
                                        escapeCSV((o.order_type || '').toUpperCase()),
                                        escapeCSV(o.payment_method),
                                        escapeCSV((o.items || []).join('; ')),
                                        o.total_amount || 0,
                                        o.delivery_fee || 0,
                                        escapeCSV(o.status || 'Pending'),
                                        escapeCSV(o.timestamp ? new Date(o.timestamp).toLocaleString('en-PH') : 'N/A')
                                    ]);
                                    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `orders_${dateRange}_${new Date().toISOString().slice(0,10)}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    showMessage('CSV downloaded!');
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                    background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                    color: 'var(--primary)', transition: 'all 0.2s'
                                }}
                            >
                                <Download size={16} /> Download CSV
                            </button>
                        )}
                    </div>
                    {filteredOrders.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>No orders in this period.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Customer</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Type</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Amount</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Date</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.slice(0, 10).map((order, idx) => {
                                        const statusStyle = {
                                            Completed: { bg: '#dcfce7', color: '#15803d' },
                                            Pending: { bg: '#fef9c3', color: '#854d0e' },
                                            Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
                                            Preparing: { bg: '#e0f2fe', color: '#0369a1' },
                                            Ready: { bg: '#e9d5ff', color: '#6d28d9' },
                                        }[order.status] || { bg: '#f1f5f9', color: '#64748b' };
                                        return (
                                            <tr key={order.id || idx} style={{ background: '#f8fafc' }}>
                                                <td style={{ padding: '12px', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', fontWeight: 600 }}>{order.customer_details?.name || 'N/A'}</td>
                                                <td style={{ padding: '12px', fontSize: '0.85rem' }}>{(order.order_type || 'N/A').toUpperCase()}</td>
                                                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>₱{Number(order.total_amount || 0).toLocaleString()}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>
                                                        {order.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                    {order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </td>
                                                <td style={{ padding: '12px', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`Delete order from ${order.customer_details?.name || 'unknown'}?`)) {
                                                                const { error } = await supabase.from('orders').delete().eq('id', order.id);
                                                                if (error) {
                                                                    console.error(error);
                                                                    showMessage(`Error deleting: ${error.message}`);
                                                                    return;
                                                                }
                                                                setOrders(orders.filter(o => o.id !== order.id));
                                                                showMessage('Order deleted.');
                                                            }
                                                        }}
                                                        title="Delete order"
                                                        style={{
                                                            background: '#fee2e2', border: 'none', borderRadius: '8px',
                                                            padding: '6px 10px', cursor: 'pointer', color: '#ef4444',
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    <img src={storeSettings.logo_url || '/logo.png'} alt={storeSettings.store_name} className="admin-sidebar-logo" />
                    <span className="admin-sidebar-title">{storeSettings.store_name || 'Admin Portal'}</span>
                </div>

                <nav className="admin-sidebar-nav">
                    <SidebarItem icon={<BarChart2 size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <SidebarItem icon={<List size={20} />} label="Menu Items" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
                    <SidebarItem icon={<Tag size={20} />} label="Categories" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                    <SidebarItem icon={<ShoppingBag size={20} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <SidebarItem icon={<Settings size={20} />} label="Order Types" active={activeTab === 'orderTypes'} onClick={() => setActiveTab('orderTypes')} />
                    <SidebarItem icon={<MapPin size={20} />} label="Delivery Coverage" active={activeTab === 'delivery'} onClick={() => setActiveTab('delivery')} />
                    <SidebarItem icon={<CreditCard size={20} />} label="Payment Methods" active={activeTab === 'payment'} onClick={() => setActiveTab('payment')} />
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="General Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                <button onClick={handleLogout} className="admin-sidebar-logout">
                    <LogOut size={20} /> Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="admin-main-content">
                {message && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: message.toLowerCase().includes('error') ? '#ef4444' : '#10b981',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        zIndex: 5000,
                        fontWeight: 700,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'slideDown 0.3s ease-out forwards'
                    }}>
                        {message.toLowerCase().includes('error') ? <X size={18} /> : <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '2px' }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></div>}
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

                {activeTab === 'analytics' && <AnalyticsDashboard />}
                {activeTab === 'menu' && <MenuManager />}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'orders' && <OrderHistory />}
                {activeTab === 'orderTypes' && <OrderTypeManager />}
                {activeTab === 'delivery' && <DeliveryCoverageManager />}
                {activeTab === 'payment' && <PaymentSettings />}
                {activeTab === 'settings' && (
                    <StoreGeneralSettings
                        storeSettings={storeSettings}
                        setStoreSettings={setStoreSettings}
                        showMessage={showMessage}
                        compressImage={compressImage}
                    />
                )}
            </main>
        </div>
    );
};

// --- COMPONENT: STORE GENERAL SETTINGS ---
const StoreGeneralSettings = ({ storeSettings, setStoreSettings, showMessage, compressImage }) => {
    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updateData = {
            store_name: formData.get('storeName'),
            address: formData.get('address'),
            contact: formData.get('contact'),
            open_time: formData.get('openTime'),
            close_time: formData.get('closeTime'),
            manual_status: formData.get('manualStatus'),
            facebook_messenger_link: formData.get('facebookMessengerLink')
        };

        const payload = storeSettings.id ? { id: storeSettings.id, ...updateData } : updateData;
        const { data, error } = await supabase.from('store_settings').upsert(payload).select().single();
        if (error) {
            console.error(error);
            showMessage(`Error saving: ${error.message}`);
            return;
        }
        setStoreSettings(data);
        showMessage('General settings saved!');
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        showMessage('Compressing and uploading...');

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const compressed = await compressImage(reader.result, 1200, 0.7);
                    const newBanners = [...(storeSettings.banner_images || []), compressed];

                    let updatedData;
                    let error;

                    if (storeSettings.id) {
                        const { data, error: updateErr } = await supabase
                            .from('store_settings')
                            .update({ banner_images: newBanners })
                            .eq('id', storeSettings.id)
                            .select()
                            .single();
                        error = updateErr;
                        updatedData = data;
                    } else {
                        const { data, error: upsertErr } = await supabase
                            .from('store_settings')
                            .upsert({ banner_images: newBanners })
                            .select()
                            .single();
                        error = upsertErr;
                        updatedData = data;
                    }

                    if (error) throw error;

                    if (updatedData) {
                        setStoreSettings(updatedData);
                        showMessage('Banner uploaded successfully!');
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    showMessage(`Upload failed: ${err.message}`);
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('File reading error:', err);
            showMessage('Error reading file.');
            setIsUploading(false);
        }
    };

    const removeBanner = async (index) => {
        const newBanners = (storeSettings.banner_images || []).filter((_, i) => i !== index);
        if (!storeSettings.id) {
            setStoreSettings({ ...storeSettings, banner_images: newBanners });
            return;
        }
        const { error } = await supabase.from('store_settings').update({ banner_images: newBanners }).eq('id', storeSettings.id);
        if (error) {
            console.error(error);
            showMessage(`Error removing: ${error.message}`);
            return;
        }
        setStoreSettings({ ...storeSettings, banner_images: newBanners });
        showMessage('Banner removed.');
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const logo_url = reader.result;
                let error;
                if (storeSettings.id) {
                    const res = await supabase.from('store_settings').update({ logo_url }).eq('id', storeSettings.id);
                    error = res.error;
                } else {
                    const res = await supabase.from('store_settings').upsert({ logo_url }).select().single();
                    error = res.error;
                    if (res.data) setStoreSettings(res.data);
                }
                if (error) {
                    console.error(error);
                    showMessage(`Error saving logo: ${error.message}`);
                    return;
                }
                if (storeSettings.id) setStoreSettings({ ...storeSettings, logo_url });
                showMessage('Logo updated!');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
            <h2 style={{ marginBottom: '30px' }}>Store Settings</h2>

            <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={20} /> Store Information
                        </h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Store Name</label><input name="storeName" defaultValue={storeSettings.store_name} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Address</label><input name="address" defaultValue={storeSettings.address} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Contact Number</label><input name="contact" defaultValue={storeSettings.contact} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Facebook Messenger Page ID</label><input name="facebookMessengerLink" placeholder="e.g. 61579032505526" defaultValue={storeSettings.facebook_messenger_link} style={inputStyle} /><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Your Facebook page ID or messenger link for order notifications</p></div>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Camera size={20} /> Store Logo
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {storeSettings.logo_url && <img src={storeSettings.logo_url} style={{ width: '120px', height: '120px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '10px' }} />}
                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={inputStyle} />
                        </div>
                    </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '40px', width: '100%', padding: '15px' }}>Save All Settings</button>
            </form>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`admin-sidebar-item ${active ? 'active' : ''}`}>
        {icon} <span>{label}</span>
    </button>
);

const SectionLabel = ({ title, onAdd }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid #eee' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</label>
        <button type="button" onClick={onAdd} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Add</button>
    </div>
);


export default AdminDashboard;
