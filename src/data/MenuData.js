export const categories = [
    { id: 1, name: 'Purified Water', sortOrder: 1 },
    { id: 2, name: 'Alkaline Water', sortOrder: 2 },
    { id: 3, name: 'Distilled Water', sortOrder: 3 },
    { id: 4, name: 'Mineral Water', sortOrder: 4 },
    { id: 5, name: 'Containers & Accessories', sortOrder: 5 }
];

export const menuItems = [
    // Purified Water
    {
        id: 101,
        categoryId: 1,
        name: 'Purified Drinking Water',
        description: 'Premium 5-stage purified water, safe for daily consumption',
        price: 25,
        promoPrice: null,
        image: null,
        outOfStock: false,
        variations: [
            { name: '5 Gallons', price: 25, disabled: false },
            { name: '1 Gallon', price: 10, disabled: false },
            { name: '500ml', price: 5, disabled: false }
        ],
        flavors: [],
        addons: [
            { name: 'Free Delivery (Min 5 containers)', price: 0, disabled: false },
            { name: 'Rush Delivery', price: 50, disabled: false }
        ]
    },
    
    // Alkaline Water
    {
        id: 201,
        categoryId: 2,
        name: 'Alkaline Water pH 8.5-9.5',
        description: 'Enhanced alkaline water with antioxidants and minerals for better health',
        price: 40,
        promoPrice: 35,
        image: null,
        outOfStock: false,
        variations: [
            { name: '5 Gallons', price: 40, disabled: false },
            { name: '1 Gallon', price: 15, disabled: false },
            { name: '500ml', price: 8, disabled: false }
        ],
        flavors: [],
        addons: [
            { name: 'Free Delivery (Min 5 containers)', price: 0, disabled: false },
            { name: 'Rush Delivery', price: 50, disabled: false }
        ]
    },
    
    // Distilled Water
    {
        id: 301,
        categoryId: 3,
        name: 'Distilled Water',
        description: 'Pure distilled water for medical devices, irons, and laboratory use',
        price: 30,
        promoPrice: null,
        image: null,
        outOfStock: false,
        variations: [
            { name: '5 Gallons', price: 30, disabled: false },
            { name: '1 Gallon', price: 12, disabled: false },
            { name: '500ml', price: 6, disabled: false }
        ],
        flavors: [],
        addons: [
            { name: 'Free Delivery (Min 5 containers)', price: 0, disabled: false }
        ]
    },
    
    // Mineral Water
    {
        id: 401,
        categoryId: 4,
        name: 'Mineral Water',
        description: 'Natural mineral water enriched with essential minerals and electrolytes',
        price: 35,
        promoPrice: null,
        image: null,
        outOfStock: false,
        variations: [
            { name: '5 Gallons', price: 35, disabled: false },
            { name: '1 Gallon', price: 13, disabled: false },
            { name: '500ml', price: 7, disabled: false }
        ],
        flavors: [],
        addons: [
            { name: 'Free Delivery (Min 5 containers)', price: 0, disabled: false },
            { name: 'Rush Delivery', price: 50, disabled: false }
        ]
    },
    
    // Containers & Accessories
    {
        id: 501,
        categoryId: 5,
        name: 'Water Dispenser',
        description: 'Hot and cold water dispenser with stainless steel tanks',
        price: 2500,
        promoPrice: 2200,
        image: null,
        outOfStock: false,
        variations: [
            { name: 'Top Load', price: 2200, disabled: false },
            { name: 'Bottom Load', price: 3500, disabled: false }
        ],
        flavors: [],
        addons: []
    },
    {
        id: 502,
        categoryId: 5,
        name: '5-Gallon Container',
        description: 'Food-grade plastic container for water storage',
        price: 250,
        promoPrice: null,
        image: null,
        outOfStock: false,
        variations: [],
        flavors: [],
        addons: []
    },
    {
        id: 503,
        categoryId: 5,
        name: 'Water Pump',
        description: 'Manual water pump for 5-gallon containers',
        price: 150,
        promoPrice: null,
        image: null,
        outOfStock: false,
        variations: [
            { name: 'Manual Pump', price: 150, disabled: false },
            { name: 'Electric Pump', price: 450, disabled: false }
        ],
        flavors: [],
        addons: []
    }
];

