const express = require('express');
const app = express();
app.use(express.json());

const products = [
  { id: 1, name: 'T-Shirt', price: 19.99 },
  { id: 2, name: 'Jeans', price: 49.99 },
  { id: 3, name: 'Sneakers', price: 89.99 }
];

let orders = [];
let nextOrderId = 1;
const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function calculateTotal(items) {
  return items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    const qty = Number(item.quantity) || 0;
    if (!product || qty <= 0) return sum;
    return sum + product.price * qty;
  }, 0);
}

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/orders', (req, res) => {
  res.json(orders);
});

app.get('/orders/:id', (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/orders', (req, res) => {
  const { customerName, items } = req.body;
  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customerName and items are required' });
  }
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return res.status(400).json({ error: `Invalid productId: ${item.productId}` });
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'quantity must be > 0' });
    }
  }
  const total = calculateTotal(items);
  const newOrder = {
    id: nextOrderId++,
    customerName,
    items,
    total: Number(total.toFixed(2)),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.patch('/orders/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }
  order.status = status;
  res.json(order);
});

app.delete('/orders/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  const [removed] = orders.splice(index, 1);
  res.json(removed);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});