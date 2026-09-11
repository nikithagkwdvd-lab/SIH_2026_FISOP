-- Welfare Department Database Schema
CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id VARCHAR(50) PRIMARY KEY,
    beneficiary_name VARCHAR(255) NOT NULL,
    scheme_code VARCHAR(100) NOT NULL,
    eligibility_status VARCHAR(50) NOT NULL,
    benefit_status VARCHAR(50) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed 100 synthetic beneficiary records (using both BEN- and WEL- prefixes for interoperability flexibility)
DO $$
DECLARE
    i INT;
    v_id VARCHAR(50);
    v_wel_id VARCHAR(50);
    v_name VARCHAR(255);
    v_scheme VARCHAR(100);
    v_eligibility VARCHAR(50);
    v_benefit VARCHAR(50);
    names TEXT[] := ARRAY[
        'Aarav Sharma', 'Aditi Patel', 'Advait Verma', 'Akanksha Rao', 'Ananya Gupta',
        'Arjun Kumar', 'Bhavya Joshi', 'Chaitanya Reddy', 'Devansh Mehta', 'Diya Singh',
        'Esha Nair', 'Gautam Chopra', 'Ishaan Malhotra', 'Kavya Iyer', 'Madhav Saxena',
        'Meera Bhatnagar', 'Nikhil Deshmukh', 'Nisha Pillai', 'Pranav Chatterjee', 'Rhea Kulkarni',
        'Rohan Kapoor', 'Sanya Agarwal', 'Shlok Mukherjee', 'Tanvi Pandit', 'Utkarsh Trivedi',
        'Vandana Sengupta', 'Varun Bose', 'Yash Raj', 'Zoya Khan', 'Abhinav Nambiar'
    ];
    schemes TEXT[] := ARRAY['SCHOLARSHIP_2026', 'HOUSING_SUBSIDY', 'SENIOR_PENSION', 'DISABILITY_BENEFIT'];
    eligibilities TEXT[] := ARRAY['ELIGIBLE', 'PENDING', 'INELIGIBLE'];
    benefits TEXT[] := ARRAY['DISBURSED', 'HOLD', 'APPLIED', 'REJECTED'];
BEGIN
    FOR i IN 1..100 LOOP
        v_id := 'BEN-' || LPAD(i::text, 6, '0');
        v_wel_id := 'WEL-' || LPAD(i::text, 6, '0');
        v_name := names[(i % array_length(names, 1)) + 1] || ' (' || LPAD(i::text, 3, '0') || ')';
        v_scheme := schemes[(i % array_length(schemes, 1)) + 1];
        v_eligibility := eligibilities[(i % array_length(eligibilities, 1)) + 1];
        v_benefit := benefits[(i % array_length(benefits, 1)) + 1];

        -- Primary BEN- record
        INSERT INTO beneficiaries (beneficiary_id, beneficiary_name, scheme_code, eligibility_status, benefit_status, last_updated)
        VALUES (v_id, v_name, v_scheme, v_eligibility, v_benefit, NOW() - (i || ' hours')::INTERVAL)
        ON CONFLICT (beneficiary_id) DO NOTHING;

        -- Alias WEL- record for identity registry compatibility
        INSERT INTO beneficiaries (beneficiary_id, beneficiary_name, scheme_code, eligibility_status, benefit_status, last_updated)
        VALUES (v_wel_id, v_name, v_scheme, v_eligibility, v_benefit, NOW() - (i || ' hours')::INTERVAL)
        ON CONFLICT (beneficiary_id) DO NOTHING;
    END FOR;
END $$;
