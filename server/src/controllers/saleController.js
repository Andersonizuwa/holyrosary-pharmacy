import { pool } from '../config/db.js';

// Create sale - handles single or multiple medicines
export const createSale = async (req, res) => {
  let connection;
  try {
    const {
      patientName,
      folderNo,
      age,
      sex,
      phoneNumber,
      invoiceNo,
      unit,
      medicines,
      discount = 0
    } = req.body;

    // Validation
    if (!patientName || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !unit) {
      return res.status(400).json({ message: 'Missing required fields: patientName, medicines array, and unit are required' });
    }

    // Validate each medicine
    for (const med of medicines) {
      if (!med.medicineId || !med.quantity || med.sellingPrice === undefined) {
        return res.status(400).json({ message: 'Each medicine must have medicineId, quantity, and sellingPrice' });
      }
    }

    connection = await pool.getConnection();

    // Validate all medicines exist and have sufficient quantity
    for (const med of medicines) {
      const [medicineRows] = await connection.query(
        'SELECT quantity FROM medicines WHERE id = ?',
        [med.medicineId]
      );

      if (medicineRows.length === 0) {
        connection.release();
        return res.status(404).json({ message: `Medicine with ID ${med.medicineId} not found` });
      }

      if (medicineRows[0].quantity < med.quantity) {
        connection.release();
        return res.status(400).json({ message: `Insufficient quantity for medicine ${med.medicineId}` });
      }
    }

    // Create sales for each medicine and update quantities
    const createdSaleIds = [];
    let totalAmount = 0;

    for (const med of medicines) {
      const totalPrice = (med.quantity * med.sellingPrice);
      
      // Insert sale record
      const [result] = await connection.query(
        `INSERT INTO sales 
         (patient_name, folder_no, age, sex, phone_number, invoice_no, unit, medicine_id, 
          quantity, selling_price, discount, total_price, sold_by, sale_date, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          patientName,
          folderNo || null,
          age || null,
          sex,
          phoneNumber || null,
          invoiceNo || null,
          unit,
          med.medicineId,
          med.quantity,
          med.sellingPrice,
          0, // Individual discount per item
          totalPrice,
          req.user?.id || null
        ]
      );

      createdSaleIds.push(result.insertId);
      totalAmount += totalPrice;

      // Reduce medicine quantity in medicines table
      await connection.query(
        'UPDATE medicines SET quantity = quantity - ? WHERE id = ?',
        [med.quantity, med.medicineId]
      );

      // Reduce delegated medicine quantity in delegations table
      // Update the most recent delegation record for this medicine
      await connection.query(
        `UPDATE delegations d
         SET d.quantity = CASE 
           WHEN d.quantity - ? <= 0 THEN 0
           ELSE d.quantity - ?
         END
         WHERE d.medicine_id = ? AND d.quantity > 0
         AND d.id = (
           SELECT MAX(id) FROM (
             SELECT id FROM delegations 
             WHERE medicine_id = ? AND quantity > 0
           ) AS latest_delegation
         )`,
        [med.quantity, med.quantity, med.medicineId, med.medicineId]
      );
    }

    connection.release();

    res.status(201).json({
      ids: createdSaleIds,
      patientName,
      medicineCount: medicines.length,
      totalAmount,
      message: 'Sale(s) created successfully and delegated medicines updated'
    });
  } catch (error) {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError.message);
      }
    }
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sales with pagination and optional date filtering
export const getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { dateFrom, dateTo } = req.query;

    const connection = await pool.getConnection();

    // Build where clause for date filtering
    let whereClause = '1=1';
    let params = [];
    
    if (dateFrom && dateTo) {
      whereClause = 'DATE(s.sale_date) BETWEEN ? AND ?';
      params = [dateFrom, dateTo];
    } else if (dateFrom) {
      whereClause = 'DATE(s.sale_date) >= ?';
      params = [dateFrom];
    } else if (dateTo) {
      whereClause = 'DATE(s.sale_date) <= ?';
      params = [dateTo];
    }

    // Get total count
    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total FROM sales s WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Get paginated sales
    const [sales] = await connection.query(
      `SELECT s.id, s.patient_name, s.folder_no, s.age, s.sex, s.phone_number, s.invoice_no, 
              s.unit, s.medicine_id, s.quantity, s.selling_price, s.discount, s.total_price, s.sale_date,
              s.status, s.returned_quantity,
              m.name, m.barcode, u.role as sold_by_role, u.name as sold_by_name
       FROM sales s
       LEFT JOIN medicines m ON s.medicine_id = m.id
       LEFT JOIN users u ON s.sold_by = u.id
       WHERE ${whereClause}
       ORDER BY s.sale_date DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    // Convert snake_case to camelCase and calculate totals
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const formattedSales = sales.map(sale => {
      // Only count revenue if not returned
      if (sale.status !== 'returned') {
        totalRevenue += parseFloat(sale.total_price) || 0;
        totalItemsSold += parseInt(sale.quantity) || 0;
      }
      return {
        id: sale.id,
        patientName: sale.patient_name,
        folderNo: sale.folder_no,
        age: sale.age,
        sex: sale.sex,
        phoneNumber: sale.phone_number,
        invoiceNo: sale.invoice_no,
        unit: sale.unit,
        medicineId: sale.medicine_id,
        medicineName: sale.name,
        quantity: sale.quantity,
        sellingPrice: parseFloat(sale.selling_price),
        discount: parseFloat(sale.discount),
        totalPrice: parseFloat(sale.total_price),
        saleDate: sale.sale_date,
        status: sale.status || 'completed',
        returnedQuantity: sale.returned_quantity || 0,
        barcode: sale.barcode,
        soldByRole: sale.sold_by_role || 'unknown',
        soldByName: sale.sold_by_name || 'Unknown'
      };
    });

    res.json({
      items: formattedSales,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      totals: {
        revenue: totalRevenue,
        itemsSold: totalItemsSold,
        txCount: formattedSales.length
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};