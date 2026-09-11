-- Revenue Department Database Schema
CREATE TABLE IF NOT EXISTS revenue_persons (
    revenue_person_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    annual_income NUMERIC(12, 2) NOT NULL,
    tax_status VARCHAR(50) NOT NULL,
    income_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed 100 synthetic revenue records aligned with canonical citizens 1 to 100
DO $$
DECLARE
    i INT;
    v_id VARCHAR(50);
    v_name VARCHAR(255);
    v_income NUMERIC(12, 2);
    v_status VARCHAR(50);
    v_verified BOOLEAN;
    names TEXT[] := ARRAY[
        'Aarav Sharma', 'Aditi Patel', 'Advait Verma', 'Akanksha Rao', 'Ananya Gupta',
        'Arjun Kumar', 'Bhavya Joshi', 'Chaitanya Reddy', 'Devansh Mehta', 'Diya Singh',
        'Esha Nair', 'Gautam Chopra', 'Ishaan Malhotra', 'Kavya Iyer', 'Madhav Saxena',
        'Meera Bhatnagar', 'Nikhil Deshmukh', 'Nisha Pillai', 'Pranav Chatterjee', 'Rhea Kulkarni',
        'Rohan Kapoor', 'Sanya Agarwal', 'Shlok Mukherjee', 'Tanvi Pandit', 'Utkarsh Trivedi',
        'Vandana Sengupta', 'Varun Bose', 'Yash Raj', 'Zoya Khan', 'Abhinav Nambiar'
    ];
    statuses TEXT[] := ARRAY['FILED', 'PENDING', 'EXEMPT', 'AUDIT_FLAGGED'];
BEGIN
    FOR i IN 1..100 LOOP
        v_id := 'REV-' || LPAD(i::text, 6, '0');
        v_name := names[(i % array_length(names, 1)) + 1] || ' (' || LPAD(i::text, 3, '0') || ')';
        v_income := 250000 + (i * 12500.50);
        v_status := statuses[(i % array_length(statuses, 1)) + 1];
        v_verified := (i % 2 = 0);

        INSERT INTO revenue_persons (revenue_person_id, full_name, annual_income, tax_status, income_verified, last_updated)
        VALUES (v_id, v_name, v_income, v_status, v_verified, NOW() - (i || ' hours')::INTERVAL)
        ON CONFLICT (revenue_person_id) DO NOTHING;
    END FOR;
END $$;
