import { pool } from '../config/db.js';

// Get all medicines with pagination
export const getMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // Get total count
    const [countRows] = await connection.query('SELECT COUNT(*) as total FROM medicines');
    const total = countRows[0].total;

    // Get paginated medicines
    const [medicines] = await connection.query(
      `SELECT id, barcode, name, generic_name, package_type, quantity, buy_price, total_price, 
              selling_price, manufacturing_date, expiry_date, low_stock_threshold, created_at 
       FROM medicines 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    connection.release();

    // Convert snake_case to camelCase
    const formattedMedicines = medicines.map(m => ({
      id: m.id,
      barcode: m.barcode,
      name: m.name,
      genericName: m.generic_name,
      packageType: m.package_type,
      quantity: parseInt(m.quantity),
      buyPrice: parseFloat(m.buy_price),
      totalPrice: parseFloat(m.total_price),
      sellingPrice: parseFloat(m.selling_price),
      manufacturingDate: m.manufacturing_date,
      expiryDate: m.expiry_date,
      lowStockThreshold: parseInt(m.low_stock_threshold),
      createdAt: m.created_at
    }));

    res.json({
      items: formattedMedicines,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single medicine
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT id, barcode, name, generic_name, package_type, quantity, buy_price, total_price, 
              selling_price, manufacturing_date, expiry_date, low_stock_threshold, created_at 
       FROM medicines WHERE id = ?`,
      [id]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const m = rows[0];
    // Convert snake_case to camelCase
    const formattedMedicine = {
      id: m.id,
      barcode: m.barcode,
      name: m.name,
      genericName: m.generic_name,
      packageType: m.package_type,
      quantity: parseInt(m.quantity),
      buyPrice: parseFloat(m.buy_price),
      totalPrice: parseFloat(m.total_price),
      sellingPrice: parseFloat(m.selling_price),
      manufacturingDate: m.manufacturing_date,
      expiryDate: m.expiry_date,
      lowStockThreshold: parseInt(m.low_stock_threshold),
      createdAt: m.created_at
    };

    res.json(formattedMedicine);
  } catch (error) {
    console.error('Get medicine by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create medicine
export const createMedicine = async (req, res) => {
  try {
    const {
      barcode,
      name,
      genericName,
      packageType,
      quantity,
      buyPrice,
      sellingPrice,
      manufacturingDate,
      expiryDate,
      lowStockThreshold = 50
    } = req.body;

    // Validation
    if (!name || !genericName || quantity == null || buyPrice == null || sellingPrice == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const totalPrice = quantity * buyPrice;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO medicines 
       (barcode, name, generic_name, package_type, quantity, buy_price, total_price, 
        selling_price, manufacturing_date, expiry_date, low_stock_threshold, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        barcode || null,
        name,
        genericName,
        packageType || 'Tablet',
        quantity,
        buyPrice,
        totalPrice,
        sellingPrice,
        manufacturingDate || null,
        expiryDate || null,
        lowStockThreshold,
        req.user?.id || null
      ]
    );

    connection.release();

    res.status(201).json({
      id: result.insertId,
      barcode,
      name,
      genericName,
      packageType: packageType || 'Tablet',
      quantity,
      buyPrice,
      totalPrice,
      sellingPrice,
      manufacturingDate,
      expiryDate,
      lowStockThreshold,
      message: 'Medicine created successfully'
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      barcode,
      name,
      genericName,
      packageType,
      quantity,
      buyPrice,
      sellingPrice,
      manufacturingDate,
      expiryDate,
      lowStockThreshold
    } = req.body;

    const connection = await pool.getConnection();
    const totalPrice = quantity * buyPrice;

    const [result] = await connection.query(
      `UPDATE medicines 
       SET barcode = ?, name = ?, generic_name = ?, package_type = ?, 
           quantity = ?, buy_price = ?, total_price = ?, selling_price = ?, 
           manufacturing_date = ?, expiry_date = ?, low_stock_threshold = ? 
       WHERE id = ?`,
      [
        barcode || null,
        name,
        genericName,
        packageType,
        quantity,
        buyPrice,
        totalPrice,
        sellingPrice,
        manufacturingDate || null,
        expiryDate || null,
        lowStockThreshold,
        id
      ]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine updated successfully' });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM medicines WHERE id = ?', [id]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all medicines with issues (notifications)
export const getMedicineNotifications = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get medicines with issues: low stock, out of stock, or expired
    const [medicines] = await connection.query(
      `SELECT 
        id, barcode, name, generic_name, package_type, quantity, 
        buy_price, selling_price, manufacturing_date, expiry_date, low_stock_threshold,
        CASE 
          WHEN expiry_date < NOW() THEN 'expired'
          WHEN quantity = 0 THEN 'out_of_stock'
          WHEN quantity < low_stock_threshold THEN 'low_stock'
        END as status
       FROM medicines 
       WHERE expiry_date < NOW() 
          OR quantity = 0 
          OR (quantity < low_stock_threshold AND quantity > 0)
       ORDER BY 
        CASE 
          WHEN expiry_date < NOW() THEN 1
          WHEN quantity = 0 THEN 2
          WHEN quantity < low_stock_threshold THEN 3
        END,
        created_at DESC`
    );

    connection.release();

    // Format and categorize the medicines
    const formattedMedicines = medicines.map(m => ({
      id: m.id,
      barcode: m.barcode,
      name: m.name,
      genericName: m.generic_name,
      packageType: m.package_type,
      quantity: parseInt(m.quantity),
      buyPrice: parseFloat(m.buy_price),
      sellingPrice: parseFloat(m.selling_price),
      manufacturingDate: m.manufacturing_date,
      expiryDate: m.expiry_date,
      lowStockThreshold: parseInt(m.low_stock_threshold),
      status: m.status
    }));

    // Count by status
    const counts = {
      expired: formattedMedicines.filter(m => m.status === 'expired').length,
      outOfStock: formattedMedicines.filter(m => m.status === 'out_of_stock').length,
      lowStock: formattedMedicines.filter(m => m.status === 'low_stock').length
    };

    res.json({
      medicines: formattedMedicines,
      total: formattedMedicines.length,
      counts
    });
  } catch (error) {
    console.error('Get medicine notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search medicines
export const searchMedicines = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchTerm = `%${q}%`;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // Get total count
    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total FROM medicines 
       WHERE name LIKE ? OR generic_name LIKE ? OR barcode LIKE ?`,
      [searchTerm, searchTerm, searchTerm]
    );
    const total = countRows[0].total;

    // Get paginated results
    const [medicines] = await connection.query(
      `SELECT id, barcode, name, generic_name, package_type, quantity, buy_price, total_price, 
              selling_price, manufacturing_date, expiry_date, low_stock_threshold, created_at 
       FROM medicines 
       WHERE name LIKE ? OR generic_name LIKE ? OR barcode LIKE ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, parseInt(limit), offset]
    );

    connection.release();

    res.json({
      items: medicines,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};