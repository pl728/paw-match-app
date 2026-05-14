-- CORE --

INSERT INTO users (username, password_hash, role, email)
VALUES
    ('shelter1', 'dev_hash_1', 'shelter_admin', 'shelter1@example.test'),
    ('adopter1', 'dev_hash_2', 'adopter', 'adopter1@example.test')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO shelters (user_id, name, description, phone, email, city, state, postal_code, latitude, longitude, geocoded_at)
SELECT u.id, 'Happy Tails Shelter', 'Rescue and adoption center.', '555-0101', 'hello@happytails.test', 'Corvallis', 'OR', '97330', 44.5646000, -123.2620000, CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'shelter1'
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
WHERE u.username = 'adopter1';

INSERT INTO favorites (user_id, pet_id)
SELECT u.id, p.id
FROM users u
JOIN pets p
	ON p.name = 'Milo'
WHERE u.username = 'adopter1';

INSERT INTO feed_events (event_type, shelter_id, post_id)
SELECT 'shelter_post', shelter_id, id
FROM shelter_posts sp
WHERE sp.title = 'Adoption Event This Weekend';

INSERT INTO feed_events (event_type, shelter_id, pet_id, payload)
SELECT 'new_pet', s.id, p.id, JSON_OBJECT('title', CONCAT('New pet: ', p.name), 'body', p.description, 'primaryPhotoUrl', NULL)
FROM shelters s
JOIN pets p
	ON p.shelter_id = s.id
WHERE s.name = 'Happy Tails Shelter';

INSERT INTO email_notifications (user_id)
SELECT u.id
FROM users u
WHERE u.username = 'adopter1';

INSERT INTO user_pet_preferences (user_id, city, state, postal_code, latitude, longitude, geocoded_at, radius_miles)
SELECT u.id, 'Corvallis', 'OR', '97330', 44.5646000, -123.2620000, CURRENT_TIMESTAMP, 50
FROM users u
WHERE u.username = 'adopter1'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- MESSAGING --

INSERT INTO conversations (adopter_user_id, shelter_id, pet_id)
SELECT u.id, s.id, p.id
FROM users u
JOIN shelters s
    ON s.name = 'Happy Tails Shelter'
JOIN pets p
    ON p.name = 'Milo'
WHERE u.username = 'adopter1';

INSERT INTO messages (conversation_id, sender_user_id, body)
SELECT c.id, u.id, 'Hi! Is Milo still available?'
FROM conversations c
JOIN users u
    ON u.username = 'adopter1';

INSERT INTO messages (conversation_id, sender_user_id, body)
SELECT c.id, u.id, 'Yes, Milo is still available! Would you like to schedule a visit?'
FROM conversations c
JOIN shelters s
    ON s.id = c.shelter_id
JOIN users u
    ON u.id = s.user_id;
