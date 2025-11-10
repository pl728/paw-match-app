const API_BASE_URL = 'http://localhost:4516';

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

export const getAnimals = async (count: number): Promise<Animal[]> => {
  const response = await fetch(`${API_BASE_URL}/api/animals?count=${count}`);
  if (!response.ok) {
    throw new Error('Failed to fetch animals');
  }
  return response.json();
};
