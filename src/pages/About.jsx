import React, { useState, useEffect } from 'react';
import { Droplet, Shield, Heart, Star, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const About = () => {
    const [storeSettings, setStoreSettings] = useState({
        store_name: 'Water Refill Station',
        logo_url: '/logo.png'
    });

    useEffect(() => {
        const fetchStoreSettings = async () => {
            const { data } = await supabase.from('store_settings').select('*').limit(1).single();
            if (data) setStoreSettings(data);
        };
        fetchStoreSettings();
    }, []);

    return (
        <div className="page-wrapper">
            <header className="app-header">
                <div className="container header-container">
                    <Link to="/" className="brand">
                        <img src={storeSettings.logo_url || "/logo.png"} alt="Water Refill Station Logo" style={{ height: '50px' }} />
                    </Link>
                    <nav className="header-nav" style={{ display: 'flex', gap: '20px' }}>
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/contact" className="nav-link">Contact</Link>
                    </nav>
                </div>
            </header>

            <main className="container" style={{ padding: '80px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px' }}>Our <span style={{ color: 'var(--accent)' }}>Story</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>Providing clean, safe, and affordable drinking water to our community.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px', alignItems: 'center', marginBottom: '100px' }}>
                    <div style={{ order: 2 }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '30px', color: 'var(--primary)', fontWeight: 800 }}>Pure <span style={{ color: 'var(--accent)' }}>Water</span> for Everyone</h2>
                        <p style={{ marginBottom: '20px', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                            {storeSettings.store_name} was established with a mission to provide accessible, high-quality drinking water to every household. We believe that clean water is not a luxury—it's a fundamental right.
                        </p>
                        <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                            Specializing in <strong>Purified Water</strong>, <strong>Alkaline Water</strong>, and <strong>Distilled Water</strong>, we use advanced 5-stage filtration systems and regular quality testing. Our commitment is to deliver safe, great-tasting water at prices everyone can afford.
                        </p>
                    </div>
                    <div style={{ order: 1 }}>
                        <img
                            src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1200&q=80"
                            alt="Clean Water"
                            style={{ width: '100%', borderRadius: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', objectFit: 'cover', height: '500px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '80px' }}>
                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Star size={40} fill="var(--accent)" /></div>
                        <h3 style={{ marginBottom: '10px' }}>Quality Assured</h3>
                        <p style={{ color: 'var(--text-muted)' }}>5-stage filtration system with regular water quality testing to ensure purity.</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Shield size={40} fill="var(--accent)" /></div>
                        <h3 style={{ marginBottom: '10px' }}>Health & Safety</h3>
                        <p style={{ color: 'var(--text-muted)' }}>FDA-approved facilities with strict sanitation and hygiene protocols.</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Users size={40} fill="var(--accent)" /></div>
                        <h3 style={{ marginBottom: '10px' }}>Community First</h3>
                        <p style={{ color: 'var(--text-muted)' }}>We are proud to serve our community with affordable, accessible clean water.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default About;
