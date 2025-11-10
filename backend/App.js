import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4516;

app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));

const sampleAnimal = {
  id: '123',
  name: 'Buddy',
  type: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'Male',
  size: 'Large',
  images: ['http://localhost:4516/images/dog1.jpg'],
  disposition: ['Friendly', 'Good with kids', 'Energetic'],
  availability: 'Available',
  shelter_id: 'shelter-1',
  date_created: '2025-01-01',
};

app.get('/', (req, res) => {
    res.send("Hello world!");
});

app.get('/api/animals', (req, res) => {
    const count = parseInt(req.query.count) || 10;
    const animals = Array(count).fill(sampleAnimal);
    res.json(animals);
});

app.listen(PORT, () => {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});