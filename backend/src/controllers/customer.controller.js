// In-memory Customer Mock DB
let customers = [
  { id: 'c1', name: 'Jonathan Harker', email: 'jonathan.harker@gmail.com', phone: '+1 555-0192', totalOrders: 2, totalSpent: 42.50, status: 'active', joinedDate: '2026-06-15' },
  { id: 'c2', name: 'Mina Murray', email: 'mina.murray@gmail.com', phone: '+1 555-0143', totalOrders: 2, totalSpent: 32.50, status: 'active', joinedDate: '2026-06-18' },
  { id: 'c3', name: 'Lucy Westenra', email: 'lucy.westenra@yahoo.com', phone: '+1 555-0177', totalOrders: 2, totalSpent: 51.50, status: 'active', joinedDate: '2026-06-20' },
  { id: 'c4', name: 'Arthur Holmwood', email: 'arthur.h@lord.co.uk', phone: '+1 555-0185', totalOrders: 1, totalSpent: 40.50, status: 'active', joinedDate: '2026-06-22' },
  { id: 'c5', name: 'Quincey Morris', email: 'quincey.morris@texas.gov', phone: '+1 555-0111', totalOrders: 1, totalSpent: 10.50, status: 'active', joinedDate: '2026-06-25' },
  { id: 'c6', name: 'Renfield Fly', email: 'renfield@asylum.org', phone: '+1 555-0999', totalOrders: 1, totalSpent: 28.00, status: 'blocked', joinedDate: '2026-06-28' }
];

const getCustomers = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let filteredList = [...customers];

    // Filter by Block status
    if (status) {
      filteredList = filteredList.filter(c => c.status === status);
    }

    // Filter by Search (Name, Email or Phone)
    if (search) {
      const term = search.toLowerCase().trim();
      filteredList = filteredList.filter(
        c => c.name.toLowerCase().includes(term) ||
             c.email.toLowerCase().includes(term) ||
             c.phone.includes(term)
      );
    }

    res.status(200).json({
      status: 'success',
      data: filteredList
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = customers.find(c => c.id === id);

    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }

    // Get order history from backend orders list if possible, or mock it locally
    const mockOrderHistory = [
      { id: 'ORD-9482', items: '2x Truffle Fries, 1x Caesar Salad', total: '$39.00', date: '2026-07-13', status: 'pending' },
      { id: 'ORD-9472', items: '1x Double Espresso Shot', total: '$3.50', date: '2026-07-08', status: 'completed' }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        ...customer,
        orders: mockOrderHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'active' && status !== 'blocked') {
      return res.status(400).json({ status: 'error', message: 'Status must be active or blocked' });
    }

    const customerIndex = customers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }

    customers[customerIndex].status = status;

    res.status(200).json({
      status: 'success',
      data: customers[customerIndex]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus
};
