const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3300;

// Load CSV data into memory
let spareParts = [];

fs.createReadStream('LE.txt')
  .pipe(csv({ 
    separator: '\t', 
    headers: ['sn', 'name', 'ladu1', 'ladu2', 'ladu3', 'ladu4', 'ladu5', 'tyhi', 'price_no_vat', 'type', 'price'] 
  }))
  .on('data', (row) => {
    // Keep only essential fields as specified in requirements
    const part = {
      sn: row.sn || '',
      name: row.name || '',
      ladu1: row.ladu1 || '',
      ladu2: row.ladu2 || '',
      ladu3: row.ladu3 || '',
      ladu4: row.ladu4 || '',
      ladu5: row.ladu5 || '',
      price_no_vat: parseFloat(row.price_no_vat) || 0,
      type: row.type || '',
      price: parseFloat(row.price) || 0
    };
    
    spareParts.push(part);
  })
  .on('end', () => {
    console.log(`CSV file successfully loaded. Total parts: ${spareParts.length}`);
  })
  .on('error', (err) => {
    console.error('Error reading CSV file:', err);
  });

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Spare Parts API is running' });
});

// Main endpoint with pagination, filtering and sorting
app.get('/spare-parts', (req, res) => {
  let results = [...spareParts];
  
  // Filter by name
  if (req.query.name) {
    results = results.filter(part => 
      part.name.toLowerCase().includes(req.query.name.toLowerCase())
    );
  }
  
  // Filter by serial number
  if (req.query.sn) {
    results = results.filter(part => 
      part.sn.toLowerCase().includes(req.query.sn.toLowerCase())
    );
  }
  
  // Sort results (before pagination!)
  if (req.query.sort) {
    const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
    const isDescending = req.query.sort.startsWith('-');
    
    results.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle numeric sorting for price
      if (sortField === 'price') {
        return isDescending ? bVal - aVal : aVal - bVal;
      }
      
      // Handle string sorting
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      
      if (aVal < bVal) return isDescending ? 1 : -1;
      if (aVal > bVal) return isDescending ? -1 : 1;
      return 0;
    });
  }
  
  // Pagination (30 items per page as required)
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedResults = results.slice(startIndex, endIndex);
  
  res.json({
    page: page,
    totalItems: results.length,
    totalPages: Math.ceil(results.length / limit),
    itemsPerPage: limit,
    data: paginatedResults
  });
});

// Alternative search endpoint as mentioned in requirements
app.get('/spare-parts/search/:searchTerm', (req, res) => {
  const searchTerm = req.params.searchTerm.toLowerCase();
  
  let results = spareParts.filter(part => 
    part.name.toLowerCase().includes(searchTerm) || 
    part.sn.toLowerCase().includes(searchTerm)
  );
  
  // Pagination for search results
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedResults = results.slice(startIndex, endIndex);
  
  res.json({
    searchTerm: req.params.searchTerm,
    page: page,
    totalItems: results.length,
    totalPages: Math.ceil(results.length / limit),
    itemsPerPage: limit,
    data: paginatedResults
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

 