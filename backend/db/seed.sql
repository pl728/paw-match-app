-- CORE --

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

INSERT INTO pet_photos (pet_id, url)
SELECT p.id, 'https://placedog.net/500/400?id=1'
FROM pets p
WHERE p.name = 'Milo';

-- ENGAGEMENT --
INSERT INTO shelter_posts (shelter_id, type, title, body, published_at)
SELECT s.id, 'SHELTER_POST', 'Adoption Event This Weekend', 'Join us Saturday from 12–4 PM!', CURRENT_TIMESTAMP 
FROM shelters s
WHERE s.name = 'Happy Tails Shelter';

INSERT INTO shelter_follows (user_id, shelter_id)
SELECT u.id, s.id
FROM users u
JOIN shelters s
	ON s.name = 'Happy Tails Shelter'
WHERE u.email = 'adopter1@pawmatch.test';

INSERT INTO favorites (user_id, pet_id)
SELECT u.id, p.id
FROM users u
JOIN pets p
	ON p.name = 'Milo'
WHERE u.email = 'adopter1@pawmatch.test';

INSERT INTO feed_events (event_type, shelter_id, post_id)
SELECT type, shelter_id, id
FROM shelter_posts sp
WHERE sp.title = 'Adoption Event This Weekend';

INSERT INTO feed_events (event_type, shelter_id, pet_id, payload)
SELECT 'PET_CREATED', s.id, p.id, JSON_OBJECT('pet_name', p.name)
FROM shelters s
JOIN pets p 
	ON p.shelter_id = s.id
WHERE s.name = 'Happy Tails Shelter';

INSERT INTO email_notifications (user_id)
SELECT u.id
FROM users u
WHERE u.email = 'adopter1@pawmatch.test';