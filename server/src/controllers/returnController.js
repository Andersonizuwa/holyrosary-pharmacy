import { pool } from '../config/db.js';

// Create return record
export const createReturn = async (req, res) => {
  let connection;
  try {
    const {
      saleId,
      patientName,
      medicines,
      totalReturned,
      totalOriginal,
      isFullReturn,
      returnReason
    } = req.body;

    // Validation
    if (!saleId || !patientName || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: saleId, patientName, medicines array required' });
    }

    connection = await pool.getConnection();

    // Verify sale exists
    const [saleRows] = await connection.query(
      'SELECT id FROM sales WHERE id = ?',
      [saleId]
    );

    if (saleRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: `Sale with ID ${saleId} not found` });
    }

    // Create return record
    const [returnResult] = await connection.query(
      `INSERT INTO sales_returns 
       (sale_id, patient_name, total_returned, total_original, is_full_return, return_reason, returned_by, return_date, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        saleId,
        patientName,
        totalReturned,
        totalOriginal,
        isFullReturn,
        returnReason || null,
        req.user?.id || null
      ]
    );

    const returnId = returnResult.insertId;

    // Determine if this is an IPP/Dispensary return based on the original sale
    const [originalSale] = await connection.query(
      `SELECT s.sold_by FROM sales s WHERE s.id = ?`,
      [saleId]
    );
    
    let userRole = 'admin'; // default
    if (originalSale.length > 0 && originalSale[0].sold_by) {
      const [saleUser] = await connection.query(
        `SELECT role FROM users WHERE id = ?`,
        [originalSale[0].sold_by]
      );
      if (saleUser.length > 0) {
        userRole = saleUser[0].role;
      }
    }
    
    const isIPPOrDispensary = userRole === 'ipp' || userRole === 'dispensary';

    // Insert return items
    for (const med of medicines) {
      await connection.query(
        `INSERT INTO sales_return_items 
         (return_id, medicine_id, quantity_returned, refund_amount) 
         VALUES (?, ?, ?, ?)`,
        [returnId, med.medicineId, med.quantityReturned, med.refundAmount || 0]
      );

      if (isIPPOrDispensary) {
        // For IPP/Dispensary: restore ONLY to their delegation
        console.log(`📈 Restoring ${med.quantityReturned} to ${userRole} delegation for medicine ${med.medicineId}`);
        await connection.query(
          `UPDATE delegations d
           SET d.quantity = d.quantity + ?
           WHERE d.medicine_id = ? AND d.delegated_to = ?`,
          [med.quantityReturned, med.medicineId, userRole]
        );
      } else {
        // For admin/store_officer: restore ONLY to central medicines inventory
        console.log(`📈 Restoring ${med.quantityReturned} to medicines inventory for medicine ${med.medicineId}`);
        await connection.query(
          'UPDATE medicines SET quantity = quantity + ? WHERE id = ?',
          [med.quantityReturned, med.medicineId]
        );
      }
    }

    // Update original sale status
    if (isFullReturn) {
      await connection.query(
        'UPDATE sales SET status = ? WHERE id = ?',
        ['returned', saleId]
      );
    } else {
      await connection.query(
        'UPDATE sales SET status = ?, returned_quantity = returned_quantity + ? WHERE id = ?',
        ['partial_return', medicines.reduce((sum, m) => sum + m.quantityReturned, 0), saleId]
      );
    }

    connection.release();

    res.status(201).json({
      id: returnId,
      saleId,
      patientName,
      totalReturned,
      message: 'Return record created successfully'
    });
  } catch (error) {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError.message);
      }
    }
    console.error('Create return error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get returns with pagination
export const getReturns = async (req, res) => {
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
      whereClause = 'DATE(sr.return_date) BETWEEN ? AND ?';
      params = [dateFrom, dateTo];
    } else if (dateFrom) {
      whereClause = 'DATE(sr.return_date) >= ?';
      params = [dateFrom];
    } else if (dateTo) {
      whereClause = 'DATE(sr.return_date) <= ?';
      params = [dateTo];
    }

    // Get total count
    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total FROM sales_returns sr WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Get paginated returns with items
    const [returns] = await connection.query(
      `SELECT 
        sr.id, sr.sale_id, sr.patient_name, sr.return_date, sr.total_returned, 
        sr.total_original, sr.is_full_return, sr.return_reason,
        u.name as returned_by_name, u.role as returned_by_role
       FROM sales_returns sr
       LEFT JOIN users u ON sr.returned_by = u.id
       WHERE ${whereClause}
       ORDER BY sr.return_date DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get items for each return
    const returnsWithItems = await Promise.all(
      returns.map(async (ret) => {
        const [items] = await connection.query(
          `SELECT 
            sri.id, sri.medicine_id, sri.quantity_returned, sri.refund_amount,
            m.name as medicine_name
           FROM sales_return_items sri
           LEFT JOIN medicines m ON sri.medicine_id = m.id
           WHERE sri.return_id = ?`,
          [ret.id]
        );

        return {
          id: ret.id,
          saleId: ret.sale_id,
          patientName: ret.patient_name,
          returnDate: ret.return_date,
          totalReturned: parseFloat(ret.total_returned),
          totalOriginal: parseFloat(ret.total_original),
          isFullReturn: ret.is_full_return,
          returnReason: ret.return_reason,
          returnedByName: ret.returned_by_name,
          returnedByRole: ret.returned_by_role,
          medicines: items.map(item => ({
            medicineId: item.medicine_id,
            medicineName: item.medicine_name,
            quantityReturned: item.quantity_returned,
            refundAmount: parseFloat(item.refund_amount || 0)
          }))
        };
      })
    );

    connection.release();

    res.json({
      items: returnsWithItems,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get return by ID
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [returns] = await connection.query(
      `SELECT 
        sr.id, sr.sale_id, sr.patient_name, sr.return_date, sr.total_returned, 
        sr.total_original, sr.is_full_return, sr.return_reason,
        u.name as returned_by_name, u.role as returned_by_role
       FROM sales_returns sr
       LEFT JOIN users u ON sr.returned_by = u.id
       WHERE sr.id = ?`,
      [id]
    );

    if (returns.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Return not found' });
    }

    const ret = returns[0];

    const [items] = await connection.query(
      `SELECT 
        sri.id, sri.medicine_id, sri.quantity_returned, sri.refund_amount,
        m.name as medicine_name
       FROM sales_return_items sri
       LEFT JOIN medicines m ON sri.medicine_id = m.id
       WHERE sri.return_id = ?`,
      [ret.id]
    );

    connection.release();

    res.json({
      id: ret.id,
      saleId: ret.sale_id,
      patientName: ret.patient_name,
      returnDate: ret.return_date,
      totalReturned: parseFloat(ret.total_returned),
      totalOriginal: parseFloat(ret.total_original),
      isFullReturn: ret.is_full_return,
      returnReason: ret.return_reason,
      returnedByName: ret.returned_by_name,
      returnedByRole: ret.returned_by_role,
      medicines: items.map(item => ({
        medicineId: item.medicine_id,
        medicineName: item.medicine_name,
        quantityReturned: item.quantity_returned,
        refundAmount: parseFloat(item.refund_amount || 0)
      }))
    });
  } catch (error) {
    console.error('Get return by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete return record (soft delete - mark as deleted)
export const deleteReturn = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    // Get return details first
    const [returns] = await connection.query(
      'SELECT * FROM sales_returns WHERE id = ?',
      [id]
    );

    if (returns.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Return not found' });
    }

    const ret = returns[0];

    // Get items to reverse quantities
    const [items] = await connection.query(
      'SELECT * FROM sales_return_items WHERE return_id = ?',
      [id]
    );

    // Determine if this was an IPP/Dispensary return based on the original sale
    const [originalSale] = await connection.query(
      `SELECT s.sold_by FROM sales s WHERE s.id = ?`,
      [ret.sale_id]
    );
    
    let userRole = 'admin'; // default
    if (originalSale.length > 0 && originalSale[0].sold_by) {
      const [saleUser] = await connection.query(
        `SELECT role FROM users WHERE id = ?`,
        [originalSale[0].sold_by]
      );
      if (saleUser.length > 0) {
        userRole = saleUser[0].role;
      }
    }
    
    const isIPPOrDispensary = userRole === 'ipp' || userRole === 'dispensary';

    // Reverse the quantity updates
    for (const item of items) {
      if (isIPPOrDispensary) {
        // Reverse the delegation restoration
        await connection.query(
          `UPDATE delegations SET quantity = quantity - ? WHERE medicine_id = ? AND delegated_to = ?`,
          [item.quantity_returned, item.medicine_id, userRole]
        );
      } else {
        // Reverse the medicines restoration
        await connection.query(
          'UPDATE medicines SET quantity = quantity - ? WHERE id = ?',
          [item.quantity_returned, item.medicine_id]
        );
      }
    }

    // Reverse sale status if it was marked as returned
    if (ret.is_full_return) {
      await connection.query(
        'UPDATE sales SET status = ? WHERE id = ?',
        ['completed', ret.sale_id]
      );
    } else {
      await connection.query(
        'UPDATE sales SET status = ?, returned_quantity = returned_quantity - ? WHERE id = ?',
        ['completed', items.reduce((sum, item) => sum + item.quantity_returned, 0), ret.sale_id]
      );
    }

    // Delete return items
    await connection.query(
      'DELETE FROM sales_return_items WHERE return_id = ?',
      [id]
    );

    // Delete return
    await connection.query(
      'DELETE FROM sales_returns WHERE id = ?',
      [id]
    );

    connection.release();

    res.json({ message: 'Return deleted successfully' });
  } catch (error) {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError.message);
      }
    }
    console.error('Delete return error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};