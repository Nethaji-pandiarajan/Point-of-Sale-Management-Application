// In-memory Restaurant DB
let restaurantSettings = {
  name: 'Saleiz Bistro',
  address: '123 Culinary Boulevard, Foodville',
  phone: '+1 555-0100',
  hours: 'Mon-Sun: 9:00 AM - 10:00 PM'
};

const getSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: restaurantSettings
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { name, address, phone, hours } = req.body;

    if (!name || !address || !phone || !hours) {
      return res.status(400).json({ status: 'error', message: 'All restaurant settings fields are required' });
    }

    restaurantSettings.name = name.trim();
    restaurantSettings.address = address.trim();
    restaurantSettings.phone = phone.trim();
    restaurantSettings.hours = hours.trim();

    res.status(200).json({
      status: 'success',
      data: restaurantSettings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
