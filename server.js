const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3300;

// Load CSV data into memory
let spareParts = [];

fs.createReadStream('LE.txt')
  .pipe(csv({ separator: '\t', headers: ['sn', 'name', 'cn', 'price', 'kasulik info', 'EiTea', 'Number', 'Tühjus', 'Asi', 'brand', '_10'] })) // Use tab as the delimiter and define headers
  .on('data', (row) => {
    // Move the value from _10 to price
    row.price = row._10; // Assign the value of _10 to price
    delete row._10; // Remove the _10 field

    // Filter out unwanted columns
    const filteredRow = {
      sn: row.sn,
      name: row.name,
      price: row.price,
      brand: row.brand,
    };

    // Add the filtered row to the spareParts array
    spareParts.push(filteredRow);
  })
  .on('end', () => {
    console.log('CSV file successfully loaded into memory.');
  })
  .on('error', (err) => {
    console.error('Error reading CSV file:', err);
  });

// Root route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Auto Spare Parts API is running!');
});

// Endpoint to get all spare parts (with pagination)
app.get('/spare-parts', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = 30; // Number of items per page
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Get the data for the current page
  const results = spareParts.slice(startIndex, endIndex);

  // Send the response
  res.json({
    page,
    totalItems: spareParts.length,
    totalPages: Math.ceil(spareParts.length / limit),
    data: results,
  });
});

// Endpoint to filter by name or sn
app.get('/spare-parts/search', (req, res) => {
  const { name, sn } = req.query;
  let filteredParts = spareParts;

  if (name) {
    filteredParts = filteredParts.filter((part) =>
      part.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  if (sn) {
    filteredParts = filteredParts.filter((part) => part.sn === sn);
  }

  res.json(filteredParts);
});

// Endpoint to sort by a specific column
app.get('/spare-parts/sort', (req, res) => {
  const { sort } = req.query;
  let sortedParts = [...spareParts];

  if (sort) {
    const isDescending = sort.startsWith('-');
    const column = isDescending ? sort.slice(1) : sort;

    sortedParts.sort((a, b) => {
      if (a[column] < b[column]) return isDescending ? 1 : -1;
      if (a[column] > b[column]) return isDescending ? -1 : 1;
      return 0;
    });
  }

  res.json(sortedParts);
});

// Error handling for invalid routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
 