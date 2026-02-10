-- CORE  --

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('adopter', 'shelter_admin') NOT NULL DEFAULT 'adopter',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shelters (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT shelters_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    shelter_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    breed VARCHAR(255),
    age_years INT,
    sex VARCHAR(50),
    size VARCHAR(50),
    description TEXT,
    status ENUM('available', 'adopted', 'pending') NOT NULL DEFAULT 'available',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pets_shelter_fk FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pet_photos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pet_id CHAR(36) NOT NULL,
    url VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_photos_pet_fk FOREIGN KEY (pet_id)
        REFERENCES pets(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ENGAGEMENT -- 

CREATE TABLE IF NOT EXISTS shelter_follows (
    user_id CHAR(36) NOT NULL,
    shelter_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id , shelter_id),
    CONSTRAINT shelter_follows_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT shelter_follows_shelter_fk FOREIGN KEY (shelter_id)
        REFERENCES shelters (id)
        ON DELETE CASCADE
)  ENGINE=INNODB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS shelter_posts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    shelter_id CHAR(36) NOT NULL,
    pet_id CHAR(36) NULL DEFAULT NULL,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    published_at DATETIME NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT shelter_posts_shelter_fk FOREIGN KEY (shelter_id)
        REFERENCES shelters (id)
        ON DELETE CASCADE,
    CONSTRAINT shelter_follows_pet_fk FOREIGN KEY (pet_id)
        REFERENCES pets (id)
        ON DELETE CASCADE
)  ENGINE=INNODB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS email_notifications (
    user_id CHAR(36) PRIMARY KEY,
    adoption_updates BOOLEAN NOT NULL DEFAULT TRUE,
    new_match_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    saved_animal_updates BOOLEAN NOT NULL DEFAULT TRUE,
    reminders BOOLEAN NOT NULL DEFAULT TRUE,
    digest_frequency ENUM('immediately', 'daily', 'weekly', 'monthly', 'none') NOT NULL DEFAULT 'none',
    digest_last_sent DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    CONSTRAINT email_notifications_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
)  ENGINE=INNODB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS feed_events (
	id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
	event_type VARCHAR(50) NOT NULL,
	shelter_id CHAR(36)  DEFAULT NULL,
	pet_id CHAR(36)  DEFAULT NULL,
	post_id CHAR(36)  DEFAULT NULL,
	payload JSON DEFAULT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT feed_events_shelter_fk FOREIGN KEY (shelter_id)
		REFERENCES shelters (id)
		ON DELETE CASCADE,
	CONSTRAINT feed_events_pet_fk FOREIGN KEY (pet_id)
		REFERENCES pets (id)
		ON DELETE CASCADE,
	CONSTRAINT feed_events_post_fk FOREIGN KEY (post_id)
		REFERENCES shelter_posts (id)
		ON DELETE CASCADE
)  ENGINE=INNODB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS favorites (
    user_id CHAR(36) NOT NULL,
    pet_id CHAR(36) NOT NULL,
    favorited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id , pet_id),
    CONSTRAINT favorites_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT favorites_pet_fk FOREIGN KEY (pet_id)
        REFERENCES pets (id)
        ON DELETE CASCADE
)  ENGINE=INNODB DEFAULT CHARSET=UTF8MB4;
