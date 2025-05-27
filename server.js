const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3300;
const PAGE_SIZE = 30;
const FILE_PATH = 'LE.txt';

let spareParts = [];

// 🔁 Load CSV file into memory
fs.createReadStream(FILE_PATH)
  .pipe(csv({
    separator: '\t',
    headers: ['sn', 'name', 'ladu1', 'ladu2', 'ladu3', 'ladu4', 'ladu5', 'tyhi', 'price_no_vat', 'type', 'price']
  }))
  .on('data', (row) => {
    spareParts.push({
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
    });
  })
  .on('end', () => {
    console.log(`✅ CSV loaded. Total parts: ${spareParts.length}`);
  })
  .on('error', (err) => {
    console.error('❌ CSV loading error:', err);
  });

// 📍 Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Spare Parts API is running 🚀' });
});

// 📦 /spare-parts with filtering, sorting, and pagination
app.get('/spare-parts', (req, res) => {
  let { name, sn, sort, page = 1 } = req.query;
  page = parseInt(page);
  let results = [...spareParts];

  if (name) results = results.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
  if (sn) results = results.filter(p => p.sn.toLowerCase().includes(sn.toLowerCase()));

  if (sort) {
    const field = sort.replace(/^-/, '');
    const desc = sort.startsWith('-');

    results.sort((a, b) => {
      const aVal = isNaN(a[field]) ? String(a[field]).toLowerCase() : parseFloat(a[field]);
      const bVal = isNaN(b[field]) ? String(b[field]).toLowerCase() : parseFloat(b[field]);

      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }

  const start = (page - 1) * PAGE_SIZE;
  const pagedResults = results.slice(start, start + PAGE_SIZE);

  res.json({
    page,
    totalItems: results.length,
    totalPages: Math.ceil(results.length / PAGE_SIZE),
    itemsPerPage: PAGE_SIZE,
    data: pagedResults
  });
});

// 🔍 Full-text search (name/sn)
app.get('/spare-parts/search/:searchTerm', (req, res) => {
  const searchTerm = req.params.searchTerm.toLowerCase();
  const page = parseInt(req.query.page) || 1;

  const filtered = spareParts.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.sn.toLowerCase().includes(searchTerm)
  );

  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  res.json({
    searchTerm,
    page,
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
    itemsPerPage: PAGE_SIZE,
    data: paged
  });
});
//------------------------------------------------------------------------------------------------------------
// 🧯 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 💥 Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 🔊 Start the server
app.listen(PORT, () => {
  console.log(`🛠️ Server running on http://localhost:${PORT}`);
});
