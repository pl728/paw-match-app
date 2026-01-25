INSERT INTO users (email, password_hash, role)
VALUES
    ('shelter1@pawmatch.test', 'dev_hash_1', 'shelter_admin'),
    ('adopter1@pawmatch.test', 'dev_hash_2', 'adopter')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO shelters (user_id, name, description, phone, email, city, state, postal_code)
SELECT u.id, 'Happy Tails Shelter', 'Rescue and adoption center.', '555-0101', 'hello@happytails.test', 'Corvallis', 'OR', '97330'
FROM users u
WHERE u.email = 'shelter1@pawmatch.test'
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO pets (shelter_id, name, species, breed, age_years, sex, size, description, status)
SELECT s.id, 'Milo', 'Dog', 'Lab Mix', 3, 'M', 'Medium', 'Friendly and energetic.', 'available'
FROM shelters s
WHERE s.name = 'Happy Tails Shelter';
