-- Land Department Database Schema
CREATE TABLE IF NOT EXISTS land_owners (
    owner_code VARCHAR(50) PRIMARY KEY,
    owner_name VARCHAR(255) NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    property_value NUMERIC(14, 2) NOT NULL,
    ownership_status VARCHAR(50) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed 100 synthetic land records aligned with canonical citizens 1 to 100
DO $$
DECLARE
    i INT;
    v_code VARCHAR(50);
    v_name VARCHAR(255);
    v_survey VARCHAR(100);
    v_val NUMERIC(14, 2);
    v_status VARCHAR(50);
    names TEXT[] := ARRAY[
        'Aarav Sharma', 'Aditi Patel', 'Advait Verma', 'Akanksha Rao', 'Ananya Gupta',
        'Arjun Kumar', 'Bhavya Joshi', 'Chaitanya Reddy', 'Devansh Mehta', 'Diya Singh',
        'Esha Nair', 'Gautam Chopra', 'Ishaan Malhotra', 'Kavya Iyer', 'Madhav Saxena',
        'Meera Bhatnagar', 'Nikhil Deshmukh', 'Nisha Pillai', 'Pranav Chatterjee', 'Rhea Kulkarni',
        'Rohan Kapoor', 'Sanya Agarwal', 'Shlok Mukherjee', 'Tanvi Pandit', 'Utkarsh Trivedi',
        'Vandana Sengupta', 'Varun Bose', 'Yash Raj', 'Zoya Khan', 'Abhinav Nambiar'
    ];
    statuses TEXT[] := ARRAY['CLEAR_TITLE', 'DISPUTED', 'MORTGAGED', 'LEASEHOLD'];
BEGIN
    FOR i IN 1..100 LOOP
        v_code := 'LAND-' || LPAD(i::text, 6, '0');
        v_name := names[(i % array_length(names, 1)) + 1] || ' (' || LPAD(i::text, 3, '0') || ')';
        v_survey := 'SY-' || (1000 + i) || '/' || CHR(65 + (i % 6));
        v_val := 1500000 + (i * 85000.00);
        v_status := statuses[(i % array_length(statuses, 1)) + 1];

        INSERT INTO land_owners (owner_code, owner_name, survey_number, property_value, ownership_status, last_updated)
        VALUES (v_code, v_name, v_survey, v_val, v_status, NOW() - (i || ' hours')::INTERVAL)
        ON CONFLICT (owner_code) DO NOTHING;
    END FOR;
END $$;
