import 'dotenv/config';
import crypto from 'node:crypto';
import db from '../db/index.js';

// ── Data pools ────────────────────────────────────────────────────────────────

const SHELTER_ADJECTIVES = [
  'Happy', 'Hopeful', 'Sunny', 'Gentle', 'Loving', 'Safe', 'Bright', 'Warm',
  'Kind', 'Peaceful', 'Cozy', 'Golden', 'Silver', 'Lucky', 'Tender', 'Caring',
  'Joyful', 'Humble', 'Brave', 'Faithful',
];
const SHELTER_NOUNS = [
  'Tails', 'Paws', 'Hearts', 'Haven', 'Home', 'Refuge', 'Nest', 'Harbor',
  'Sanctuary', 'Place', 'Corner', 'Landing', 'Den', 'Retreat', 'Acres',
];
const SHELTER_TYPES = [
  'Animal Shelter', 'Rescue Center', 'Humane Society', 'Animal Haven',
  'Pet Rescue', 'Animal Refuge', 'Adoption Center',
];

const CITIES = [
  ['Portland', 'OR', '97201'], ['Seattle', 'WA', '98101'], ['Denver', 'CO', '80201'],
  ['Austin', 'TX', '78701'], ['Chicago', 'IL', '60601'], ['Phoenix', 'AZ', '85001'],
  ['Atlanta', 'GA', '30301'], ['Boston', 'MA', '02101'], ['Nashville', 'TN', '37201'],
  ['Minneapolis', 'MN', '55401'], ['Corvallis', 'OR', '97330'], ['Eugene', 'OR', '97401'],
  ['Bend', 'OR', '97701'], ['Boise', 'ID', '83701'], ['Salt Lake City', 'UT', '84101'],
  ['Albuquerque', 'NM', '87101'], ['Tucson', 'AZ', '85701'], ['Reno', 'NV', '89501'],
  ['Sacramento', 'CA', '95814'], ['San Diego', 'CA', '92101'],
];

const DOG_BREEDS = [
  'Labrador Mix', 'Golden Retriever', 'German Shepherd', 'Beagle', 'Poodle Mix',
  'Bulldog', 'Husky', 'Border Collie', 'Australian Shepherd', 'Chihuahua',
  'Dachshund', 'Boxer', 'Shih Tzu', 'Corgi', 'Pit Bull Mix', 'Great Dane',
  'Dalmatian', 'Cocker Spaniel', 'Schnauzer', 'Terrier Mix',
];
const CAT_BREEDS = [
  'Domestic Shorthair', 'Domestic Longhair', 'Siamese Mix', 'Tabby', 'Calico',
  'Maine Coon Mix', 'Persian Mix', 'Ragdoll Mix', 'Tuxedo', 'Orange Tabby',
  'Russian Blue Mix', 'Scottish Fold Mix', 'Bengal Mix', 'Tortoiseshell', 'Snowshoe Mix',
];
const RABBIT_BREEDS = [
  'Holland Lop', 'Mini Rex', 'Dutch', 'Lionhead', 'Flemish Giant',
  'Angora Mix', 'New Zealand', 'Californian', 'Cottontail Mix', 'Rex',
];
const BIRD_BREEDS = [
  'Parakeet', 'Cockatiel', 'Conure', 'Lovebird', 'Canary',
  'Finch', 'Dove', 'African Grey Mix', 'Macaw Mix', 'Parrotlet',
];
const OTHER_SPECIES = [
  { species: 'Guinea Pig', breed: 'American' },
  { species: 'Guinea Pig', breed: 'Peruvian' },
  { species: 'Hamster', breed: 'Syrian' },
  { species: 'Hamster', breed: 'Dwarf' },
  { species: 'Ferret', breed: 'Domestic' },
  { species: 'Turtle', breed: 'Red-Eared Slider' },
  { species: 'Lizard', breed: 'Bearded Dragon' },
  { species: 'Snake', breed: 'Ball Python' },
  { species: 'Hedgehog', breed: 'African Pygmy' },
  { species: 'Chinchilla', breed: 'Standard' },
];

const PET_NAMES = [
  'Milo', 'Bella', 'Max', 'Luna', 'Charlie', 'Lucy', 'Buddy', 'Daisy', 'Cooper',
  'Molly', 'Rocky', 'Maggie', 'Bear', 'Sophie', 'Duke', 'Sadie', 'Tucker', 'Lola',
  'Oliver', 'Stella', 'Leo', 'Chloe', 'Bentley', 'Penny', 'Zeus', 'Rosie', 'Finn',
  'Ellie', 'Jasper', 'Nala', 'Murphy', 'Zoe', 'Biscuit', 'Willow', 'Koda', 'Ruby',
  'Gus', 'Cleo', 'Archie', 'Nova', 'Moose', 'Ivy', 'Louie', 'Hazel', 'Jax', 'Remi',
  'Scout', 'Poppy', 'Maverick', 'Gracie', 'Winston', 'Aurora', 'Ranger', 'Piper',
  'Atlas', 'Mia', 'Dexter', 'Lily', 'Ghost', 'Nora', 'Simba', 'Freya', 'Peanut',
  'Coco', 'Marley', 'Skye', 'Beau', 'Ginger', 'Samson', 'Violet', 'Goose', 'Pearl',
  'Arlo', 'Honey', 'Remy', 'Pepper', 'Toby', 'Olive', 'Hank', 'Clover', 'Walter',
  'Maple', 'Theo', 'Juniper', 'Chester', 'Sage', 'Bruno', 'Wilma', 'Odin', 'Fern',
  'Bandit', 'Winnie', 'Cosmo', 'Phoebe', 'Diesel', 'Brie', 'Harley', 'Cinnamon',
];

const DOG_DESCRIPTIONS = [
  'Loves fetch and long walks. Gets along great with other dogs.',
  'Couch potato by day, zoomies machine by night. Great with kids.',
  'Super treat-motivated and picks up new tricks fast.',
  'Gentle giant who thinks he\'s a lap dog. Very affectionate.',
  'Energetic and playful — needs a yard and daily exercise.',
  'Calm and well-mannered. Perfect for apartment living.',
  'Loves water and outdoor adventures. Leash trained.',
  'Shy at first but warms up quickly. Loyal and sweet.',
  'Playful and curious with a goofy personality.',
  'Excellent with children. Has basic obedience training.',
];
const CAT_DESCRIPTIONS = [
  'Independent but loves evening cuddles on the couch.',
  'Chatty and social — will follow you from room to room.',
  'Calm indoor cat who enjoys sunny windowsills and naps.',
  'Playful kitten who loves toys and interactive play.',
  'Lap cat through and through. Purrs constantly.',
  'Gets along well with other cats. Slow to trust but very loving once comfortable.',
  'Curious explorer who loves cardboard boxes and paper bags.',
  'Quiet and gentle. Great for calm households.',
  'High energy and playful — loves feather wands.',
  'Senior kitty looking for a peaceful forever home.',
];
const GENERIC_DESCRIPTIONS = [
  'Friendly and well-socialized. Looking for a loving home.',
  'Healthy and happy. Great with gentle handling.',
  'Has been in foster care and is comfortable around people.',
  'Unique personality and lots of love to give.',
  'Settled, calm, and ready for a forever family.',
];

const PHOTO_BASE_URLS = {
  Dog: (i) => `https://placedog.net/500/400?id=${i}`,
  Cat: (i) => `https://placekitten.com/500/400?image=${(i % 16) + 1}`,
  default: () => `https://placehold.co/500x400/e0e0e0/555?text=Pet+Photo`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uuid = () => crypto.randomUUID();

function shelterName() {
  const roll = Math.random();
  if (roll < 0.5) return `${pick(SHELTER_ADJECTIVES)} ${pick(SHELTER_NOUNS)} ${pick(SHELTER_TYPES)}`;
  if (roll < 0.8) return `${pick(SHELTER_ADJECTIVES)} ${pick(SHELTER_TYPES)}`;
  return `${pick(CITIES)[0]} ${pick(SHELTER_TYPES)}`;
}

function randomPet(shelterId, index) {
  const speciesRoll = Math.random();
  let species, breed, description;

  if (speciesRoll < 0.45) {
    species = 'Dog';
    breed = pick(DOG_BREEDS);
    description = pick(DOG_DESCRIPTIONS);
  } else if (speciesRoll < 0.80) {
    species = 'Cat';
    breed = pick(CAT_BREEDS);
    description = pick(CAT_DESCRIPTIONS);
  } else if (speciesRoll < 0.88) {
    species = 'Rabbit';
    breed = pick(RABBIT_BREEDS);
    description = pick(GENERIC_DESCRIPTIONS);
  } else if (speciesRoll < 0.94) {
    species = 'Bird';
    breed = pick(BIRD_BREEDS);
    description = pick(GENERIC_DESCRIPTIONS);
  } else {
    const other = pick(OTHER_SPECIES);
    species = other.species;
    breed = other.breed;
    description = pick(GENERIC_DESCRIPTIONS);
  }

  const statusRoll = Math.random();
  const status = statusRoll < 0.75 ? 'available' : statusRoll < 0.90 ? 'pending' : 'adopted';
  const photoUrl = (PHOTO_BASE_URLS[species] || PHOTO_BASE_URLS.default)(index);

  return {
    id: uuid(),
    shelter_id: shelterId,
    name: pick(PET_NAMES),
    species,
    breed,
    age_years: rand(0, 14),
    sex: pick(['M', 'F']),
    size: species === 'Dog' ? pick(['Small', 'Medium', 'Large', 'XL']) : 'Small',
    description,
    status,
    photoUrl,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding 100 shelters and 1000 pets...\n');

  const shelterIds = [];

  // 100 shelters (each needs a user first)
  for (let i = 0; i < 100; i++) {
    const userId = uuid();
    const shelterId = uuid();
    const username = `shelter_admin_${i + 1}`;
    const [city, state, postal] = pick(CITIES);
    const name = shelterName();

    await db.query(
      `INSERT IGNORE INTO users (id, username, password_hash, role) VALUES (?, ?, ?, 'shelter_admin')`,
      [userId, username, 'dev_hash']
    );

    await db.query(
      `INSERT IGNORE INTO shelters (id, user_id, name, description, phone, email, city, state, postal_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shelterId, userId, name,
        `A welcoming shelter dedicated to finding loving homes for animals in the ${city} area.`,
        `555-${String(rand(1000, 9999))}`,
        `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.test`,
        city, state, postal,
      ]
    );

    shelterIds.push(shelterId);

    if ((i + 1) % 10 === 0) process.stdout.write(`  Shelters: ${i + 1}/100\n`);
  }

  // 1000 pets spread across shelters
  for (let i = 0; i < 1000; i++) {
    const shelterId = shelterIds[i % shelterIds.length];
    const pet = randomPet(shelterId, i);

    await db.query(
      `INSERT INTO pets (id, shelter_id, name, species, breed, age_years, sex, size, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet.id, pet.shelter_id, pet.name, pet.species, pet.breed,
       pet.age_years, pet.sex, pet.size, pet.description, pet.status]
    );

    await db.query(
      `INSERT INTO pet_photos (id, pet_id, url) VALUES (?, ?, ?)`,
      [uuid(), pet.id, pet.photoUrl]
    );

    if ((i + 1) % 100 === 0) process.stdout.write(`  Pets: ${i + 1}/1000\n`);
  }

  console.log('\nDone! 100 shelters + 1000 pets inserted.');
  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
