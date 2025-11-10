import dog1 from '../assets/dog1.jpg';

interface Animal {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed: string;
  age: number;
  gender: string;
  size: string;
  images: string[];
  disposition: string[];
  availability: 'Available' | 'Pending' | 'Adopted' | 'Not Available';
  shelter_id: string;
  date_created: string;
}

const sampleAnimal: Animal = {
  id: '123',
  name: 'Buddy',
  type: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'Male',
  size: 'Large',
  images: [dog1],
  disposition: ['Friendly', 'Good with kids', 'Energetic'],
  availability: 'Available',
  shelter_id: 'shelter-1',
  date_created: '2025-01-01',
};

export const getAnimals = (count: number): Animal[] => {
  return Array(count).fill(sampleAnimal);
};
