-- ============================================================
-- Farmer Marketplace - Demo Products
-- Run this in Supabase SQL Editor after creating tables
-- ============================================================

-- Create demo farmer user profile if not exists
-- Farmer: prathameshyewale26@gmail.com
INSERT INTO public.user_profiles (id, full_name, role, phone, address)
VALUES ('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Prathamesh Yewale', 'farmer', '+91 9876543210', 'Pune, Maharashtra')
ON CONFLICT (id) DO NOTHING;

-- Sample demo products for marketplace

INSERT INTO public.products (farmer_id, name, description, category, price, unit, stock_qty, image_url, is_active) VALUES
-- Vegetables (Realistic Indian Market Prices)
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Organic Tomatoes', 'Vine-ripened organic tomatoes grown without pesticides. Perfect for salads and cooking.', 'vegetables', 40.00, 'kg', 50, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Green Spinach Bunch', 'Fresh, crisp spinach leaves. Harvested daily for maximum freshness.', 'vegetables', 15.00, 'bunch', 100, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Red Onions', 'Sweet and crisp red onions. Ideal for salads and grilling.', 'vegetables', 30.00, 'kg', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Okra (Bhindi)', 'Tender green okra, perfect for curries and stir-fries.', 'vegetables', 60.00, 'kg', 60, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Brinjal (Eggplant)', 'Purple, glossy brinjals. Great for baingan bharta and curries.', 'vegetables', 35.00, 'kg', 40, 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400', true),

-- Fruits (Realistic Indian Market Prices)
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Alphonso Mangoes', 'Premium Ratnagiri Alphonso mangoes. Sweet, aromatic, and fiberless.', 'fruits', 450.00, 'dozen', 25, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Bananas', 'Organic Cavendish bananas. Naturally ripened, no chemicals.', 'fruits', 40.00, 'dozen', 100, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Sweet Oranges', 'Juicy Nagpur oranges. Rich in Vitamin C and perfect for fresh juice.', 'fruits', 70.00, 'kg', 45, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Pomegranates', 'Ruby-red pomegranates with sweet arils. Great for salads and juicing.', 'fruits', 150.00, 'kg', 30, 'https://images.unsplash.com/photo-1541344999736-83eca6f8d61c?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Guava (Amrood)', 'Fresh white guavas with soft seeds. Sweet and aromatic.', 'fruits', 60.00, 'kg', 50, 'https://images.unsplash.com/photo-1536511132770-e5058c7feef2?w=400', true),

-- Dairy (Realistic Indian Market Prices)
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Cow Milk', 'Farm-fresh cow milk, pasteurized and delivered daily.', 'dairy', 55.00, 'liter', 200, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Pure Desi Ghee', 'Traditional clarified butter made from cow milk. Aromatic and nutritious.', 'dairy', 580.00, 'kg', 20, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Paneer', 'Soft, creamy paneer made from fresh milk. Perfect for curries.', 'dairy', 320.00, 'kg', 15, 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Natural Curd (Dahi)', 'Thick, creamy curd made from farm-fresh milk. Probiotic and healthy.', 'dairy', 60.00, 'kg', 40, 'https://images.unsplash.com/photo-1488477181946-6428a029177b?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Butter', 'Creamy, unsalted butter. Perfect for cooking and spreading.', 'dairy', 450.00, 'kg', 10, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', true),

-- Grains (Realistic Indian Market Prices)
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Organic Basmati Rice', 'Long-grain aromatic basmati rice. Perfect for biryanis and pulao.', 'grains', 160.00, 'kg', 100, 'https://images.unsplash.com/photo-1626804475297-411d863b5285?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Whole Wheat Flour (Atta)', 'Stone-ground whole wheat flour. High fiber and nutritious.', 'grains', 42.00, 'kg', 150, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Yellow Moong Dal', 'Split yellow moong lentils. Easy to digest and protein-rich.', 'grains', 140.00, 'kg', 80, 'https://images.unsplash.com/photo-1612929633738-8a9dd7d92c5f?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Organic Red Rice', 'Nutrient-rich red rice with high fiber content. Traditional variety.', 'grains', 120.00, 'kg', 60, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Chana Dal (Split Chickpeas)', 'Premium quality chana dal. Perfect for dal and snacks.', 'grains', 95.00, 'kg', 90, 'https://images.unsplash.com/photo-1612929633738-8a9dd7d92c5f?w=400', true),

-- Herbs (Realistic Indian Market Prices)
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Coriander (Dhania)', 'Aromatic coriander bunches. Essential for garnishing and chutneys.', 'herbs', 12.00, 'bunch', 200, 'https://images.unsplash.com/photo-1629157247277-37f43c5f5020?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Mint (Pudina)', 'Fragrant mint leaves. Perfect for chutneys, raita, and beverages.', 'herbs', 10.00, 'bunch', 150, 'https://images.unsplash.com/photo-1628556270448-4d4e6a4d57c1?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Curry Leaves', 'Fresh curry leaves for authentic Indian cooking. Fragrant and flavorful.', 'herbs', 8.00, 'bunch', 100, 'https://images.unsplash.com/photo-1605218427368-35b0f99606f4?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Tulsi (Holy Basil)', 'Sacred tulsi leaves. Used in Ayurveda and traditional cooking.', 'herbs', 20.00, 'bunch', 80, 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=400', true),
('d5ae8fb1-792c-43c6-96cd-b3cdb6bf9b4d', 'Fresh Fenugreek (Methi)', 'Bitter, aromatic methi leaves. Great for curries and parathas.', 'herbs', 18.00, 'bunch', 70, 'https://images.unsplash.com/photo-1609424572698-22b9767e1388?w=400', true);
