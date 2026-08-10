const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getSettings = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT name, logo, address, phone, email,
             tax_number AS "taxNumber", currency,
             tax_percentage AS "taxPercentage",
             opening_time AS "openingTime", closing_time AS "closingTime",
             receipt_footer AS "receiptFooter", status
      FROM restaurant_settings
      WHERE id = 1
    `);

    let settings = result.rows[0];

    if (!settings) {
      // Fallback default
      settings = {
        name: 'Saleiz Bistro',
        logo: '',
        address: '123 Culinary Boulevard, Foodville',
        phone: '+1 555-0100',
        email: 'contact@saleizbistro.com',
        taxNumber: 'GST123456789',
        currency: '$',
        taxPercentage: 5.00,
        openingTime: '09:00 AM',
        closingTime: '10:00 PM',
        receiptFooter: 'Thank you for dining with Saleiz! Please visit again.',
        status: 'open'
      };
    } else {
      settings.taxPercentage = parseFloat(settings.taxPercentage || 0);
    }

    res.status(200).json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const {
      name,
      logo = '',
      address,
      phone,
      email,
      taxNumber = '',
      currency = '$',
      taxPercentage = 0,
      openingTime = '09:00 AM',
      closingTime = '10:00 PM',
      receiptFooter = '',
      status = 'open'
    } = req.body;

    if (!name || !address || !phone || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant Name, Address, Phone, and Email are required fields'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address' });
    }

    const numTax = parseFloat(taxPercentage) || 0;

    const result = await db.query(`
      INSERT INTO restaurant_settings (id, name, logo, address, phone, email, tax_number, currency, tax_percentage, opening_time, closing_time, receipt_footer, status, updated_at)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        logo = EXCLUDED.logo,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        tax_number = EXCLUDED.tax_number,
        currency = EXCLUDED.currency,
        tax_percentage = EXCLUDED.tax_percentage,
        opening_time = EXCLUDED.opening_time,
        closing_time = EXCLUDED.closing_time,
        receipt_footer = EXCLUDED.receipt_footer,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING name, logo, address, phone, email,
                tax_number AS "taxNumber", currency,
                tax_percentage AS "taxPercentage",
                opening_time AS "openingTime", closing_time AS "closingTime",
                receipt_footer AS "receiptFooter", status
    `, [
      name.trim(),
      logo ? logo.trim() : '',
      address.trim(),
      phone.trim(),
      email.trim(),
      taxNumber ? taxNumber.trim() : '',
      currency.trim(),
      numTax,
      openingTime.trim(),
      closingTime.trim(),
      receiptFooter ? receiptFooter.trim() : '',
      status.trim()
    ]);

    const updated = result.rows[0];
    updated.taxPercentage = parseFloat(updated.taxPercentage || 0);

    createNotification({
      title: 'Restaurant Settings Updated',
      message: `Store configuration for "${updated.name}" successfully updated in database.`,
      type: 'info',
      icon: 'settings',
      reference_type: 'system'
    });

    res.status(200).json({
      status: 'success',
      message: 'Restaurant settings updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
