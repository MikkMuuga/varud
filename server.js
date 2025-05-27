const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3300;
let spareParts = [];


fs.createReadStream('LE.txt')
  .pipe(csv({
    separator: '\t',
    headers: ['sn', 'name', 'ladu1', 'ladu2', 'ladu3', 'ladu4', 'ladu5', 'unkown', 'pricewoVAT', 'type', 'price']
  }))
  .on('data', (row) => {
    spareParts.push(row);
  })
  .on('end', () => console.log('CSV file successfully loaded.'))
  .on('error', (err) => console.error('Error reading CSV:', err));

app.get('/', (req, res) => res.send('Auto Spare Parts ofrguhog API is running!'));

app.get('/spare-parts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const startIndex = (page - 1) * limit;

});

app.get('/spare-parts/search', function(req, res) {
  const { name, sn } = req.query;
  let results = spareParts;

  if (name) results = results.filter(part => part.name.toLowerCase().includes(name.toLowerCase()));
  if (sn) results = results.filter(part => part.serial === sn);
  results = results.filter((qwe) => qwe.ladu1 !== '0');

  res.json(results);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

