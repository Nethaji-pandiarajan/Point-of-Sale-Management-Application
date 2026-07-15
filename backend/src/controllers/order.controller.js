// In-memory Order Mock DB
let orders = [
  {
    id: 'ORD-9482',
    customerName: 'Jonathan Harker',
    email: 'jonathan.harker@gmail.com',
    phone: '+1 555-0192',
    tableNo: 'Table 4',
    items: [
      { name: 'Truffle Parmesan Fries', quantity: 2, price: 12.50 },
      { name: 'Classic Caesar Salad', quantity: 1, price: 14.00 }
    ],
    totalAmount: 39.00,
    status: 'pending',
    createdAt: '2026-07-13T18:00:00.000Z',
    timeline: [
      { status: 'pending', time: '2026-07-13T18:00:00.000Z', note: 'Order placed by customer at Table 4' }
    ]
  },
  {
    id: 'ORD-9481',
    customerName: 'Mina Murray',
    email: 'mina.murray@gmail.com',
    phone: '+1 555-0143',
    tableNo: 'Table 2',
    items: [
      { name: 'Margherita Woodfired Pizza', quantity: 1, price: 18.50 },
      { name: 'Lemon Mint Iced Tea', quantity: 1, price: 4.50 }
    ],
    totalAmount: 23.00,
    status: 'preparing',
    createdAt: '2026-07-13T17:15:00.000Z',
    timeline: [
      { status: 'pending', time: '2026-07-13T17:15:00.000Z', note: 'Order placed at Table 2' },
      { status: 'preparing', time: '2026-07-13T17:20:00.000Z', note: 'Kitchen accepted and started preparing' }
    ]
  },
  {
    id: 'ORD-9480',
    customerName: 'Lucy Westenra',
    email: 'lucy.westenra@yahoo.com',
    phone: '+1 555-0177',
    tableNo: 'Delivery: 123 Bat Street, Whitby',
    items: [
      { name: 'Artisan Gelato Trio', quantity: 2, price: 8.00 },
      { name: 'Double Espresso Shot', quantity: 2, price: 3.50 }
    ],
    totalAmount: 23.00,
    status: 'completed',
    createdAt: '2026-07-13T15:30:00.000Z',
    timeline: [
      { status: 'pending', time: '2026-07-13T15:30:00.000Z', note: 'Delivery order submitted' },
      { status: 'preparing', time: '2026-07-13T15:35:00.000Z', note: 'Kitchen started preparation' },
      { status: 'completed', time: '2026-07-13T16:10:00.000Z', note: 'Order dispatched and delivered successfully' }
    ]
  },
  {
    id: 'ORD-9479',
    customerName: 'Arthur Holmwood',
    email: 'arthur.h@lord.co.uk',
    phone: '+1 555-0185',
    tableNo: 'Table 8',
    items: [
      { name: 'Spaghetti Carbonara', quantity: 1, price: 22.00 },
      { name: 'Margherita Woodfired Pizza', quantity: 1, price: 18.50 }
    ],
    totalAmount: 40.50,
    status: 'cancelled',
    createdAt: '2026-07-13T12:00:00.000Z',
    timeline: [
      { status: 'pending', time: '2026-07-13T12:00:00.000Z', note: 'Order placed' },
      { status: 'cancelled', time: '2026-07-13T12:05:00.000Z', note: 'Cancelled by admin: out of pasta ingredients' }
    ]
  },
  {
    id: 'ORD-9478',
    customerName: 'Quincey Morris',
    email: 'quincey.morris@texas.gov',
    phone: '+1 555-0111',
    tableNo: 'Takeaway',
    items: [
      { name: 'Double Espresso Shot', quantity: 3, price: 3.50 }
    ],
    totalAmount: 10.50,
    status: 'completed',
    createdAt: '2026-07-12T19:00:00.000Z', // Yesterday
    timeline: [
      { status: 'pending', time: '2026-07-12T19:00:00.000Z', note: 'Order placed for Takeaway' },
      { status: 'preparing', time: '2026-07-12T19:02:00.000Z', note: 'Espresso machine drawing shots' },
      { status: 'completed', time: '2026-07-12T19:07:00.000Z', note: 'Order collected' }
    ]
  },
  {
    id: 'ORD-9477',
    customerName: 'Renfield Fly',
    email: 'renfield@asylum.org',
    phone: '+1 555-0999',
    tableNo: 'Table 13',
    items: [
      { name: 'Classic Caesar Salad', quantity: 2, price: 14.00 }
    ],
    totalAmount: 28.00,
    status: 'completed',
    createdAt: '2026-07-12T12:30:00.000Z', // Yesterday
    timeline: [
      { status: 'pending', time: '2026-07-12T12:30:00.000Z', note: 'Salad order placed' },
      { status: 'completed', time: '2026-07-12T12:45:00.000Z', note: 'Order delivered to Table 13' }
    ]
  },
  {
    id: 'ORD-9476',
    customerName: 'Dr. John Seward',
    email: 'john.seward@purfleet.org',
    phone: '+1 555-0155',
    tableNo: 'Table 6',
    items: [
      { name: 'Truffle Parmesan Fries', quantity: 1, price: 12.50 },
      { name: 'Lemon Mint Iced Tea', quantity: 2, price: 4.50 }
    ],
    totalAmount: 21.50,
    status: 'completed',
    createdAt: '2026-07-11T20:30:00.000Z', // 2 days ago
    timeline: [
      { status: 'pending', time: '2026-07-11T20:30:00.000Z', note: 'Order placed' },
      { status: 'completed', time: '2026-07-11T20:50:00.000Z', note: 'Served successfully' }
    ]
  },
  {
    id: 'ORD-9475',
    customerName: 'Professor Van Helsing',
    email: 'helsing@amsterdam.edu',
    phone: '+31 20-555-1234',
    tableNo: 'Table 1',
    items: [
      { name: 'Classic Caesar Salad', quantity: 1, price: 14.00 },
      { name: 'Spaghetti Carbonara', quantity: 1, price: 22.00 },
      { name: 'Double Espresso Shot', quantity: 1, price: 3.50 }
    ],
    totalAmount: 39.50,
    status: 'completed',
    createdAt: '2026-07-11T13:10:00.000Z', // 2 days ago
    timeline: [
      { status: 'pending', time: '2026-07-11T13:10:00.000Z', note: 'Order placed' },
      { status: 'completed', time: '2026-07-11T13:40:00.000Z', note: 'Completed' }
    ]
  },
  {
    id: 'ORD-9474',
    customerName: 'Wilhelmina Murray',
    email: 'mina.murray@gmail.com',
    phone: '+1 555-0143',
    tableNo: 'Table 2',
    items: [
      { name: 'Saleiz Tiramisu Cup', quantity: 1, price: 9.50 }
    ],
    totalAmount: 9.50,
    status: 'completed',
    createdAt: '2026-07-10T15:00:00.000Z', // 3 days ago
    timeline: [
      { status: 'pending', time: '2026-07-10T15:00:00.000Z', note: 'Dessert order placed' },
      { status: 'completed', time: '2026-07-10T15:15:00.000Z', note: 'Completed' }
    ]
  },
  {
    id: 'ORD-9473',
    customerName: 'Lord Godalming',
    email: 'godalming@lord.co.uk',
    phone: '+1 555-0185',
    tableNo: 'Table 8',
    items: [
      { name: 'Margherita Woodfired Pizza', quantity: 2, price: 18.50 }
    ],
    totalAmount: 37.00,
    status: 'completed',
    createdAt: '2026-07-09T18:00:00.000Z', // 4 days ago
    timeline: [
      { status: 'pending', time: '2026-07-09T18:00:00.000Z', note: 'Order placed' },
      { status: 'completed', time: '2026-07-09T18:30:00.000Z', note: 'Completed' }
    ]
  },
  {
    id: 'ORD-9472',
    customerName: 'Jonathan Harker',
    email: 'jonathan.harker@gmail.com',
    phone: '+1 555-0192',
    tableNo: 'Table 4',
    items: [
      { name: 'Double Espresso Shot', quantity: 1, price: 3.50 }
    ],
    totalAmount: 3.50,
    status: 'completed',
    createdAt: '2026-07-08T11:00:00.000Z',
    timeline: [
      { status: 'pending', time: '2026-07-08T11:00:00.000Z', note: 'Espresso ordered' },
      { status: 'completed', time: '2026-07-08T11:05:00.000Z', note: 'Completed' }
    ]
  },
  {
    id: 'ORD-9471',
    customerName: 'Lucy Westenra',
    email: 'lucy.westenra@yahoo.com',
    phone: '+1 555-0177',
    tableNo: 'Table 3',
    items: [
      { name: 'Saleiz Tiramisu Cup', quantity: 3, price: 9.50 }
    ],
    totalAmount: 28.50,
    status: 'completed',
    createdAt: '2026-07-07T12:00:00.000Z',
    timeline: [
      { status: 'pending', time: '2026-07-07T12:00:00.000Z', note: 'Order placed' },
      { status: 'completed', time: '2026-07-07T12:20:00.000Z', note: 'Served successfully' }
    ]
  }
];

const getOrders = async (req, res, next) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 5 } = req.query;
    
    let filteredList = [...orders];

    // Filter by Status
    if (status) {
      filteredList = filteredList.filter(o => o.status === status);
    }

    // Filter by Search (Customer Name or Order ID)
    if (search) {
      const term = search.toLowerCase().trim();
      filteredList = filteredList.filter(
        o => o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term)
      );
    }

    // Filter by Date Bounds (StartDate, EndDate)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredList = filteredList.filter(o => new Date(o.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredList = filteredList.filter(o => new Date(o.createdAt) <= end);
    }

    // Sort by most recent first
    filteredList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination calculations
    const totalCount = filteredList.length;
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedList = filteredList.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      status: 'success',
      data: paginatedList,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order status value' });
    }

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const currentStatus = orders[orderIndex].status;
    if (currentStatus === status) {
      return res.status(200).json({ status: 'success', data: orders[orderIndex] });
    }

    // Update status
    orders[orderIndex].status = status;
    
    // Add timeline record
    orders[orderIndex].timeline.push({
      status,
      time: new Date().toISOString(),
      note: `Order status updated to "${status.charAt(0).toUpperCase() + status.slice(1)}"`
    });

    res.status(200).json({
      status: 'success',
      data: orders[orderIndex]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus
};
