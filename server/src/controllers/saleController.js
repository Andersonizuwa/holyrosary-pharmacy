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

    // Debug logging
    console.log('📋 CREATE SALE - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Extracted fields:', { patientName, folderNo, age, sex, phoneNumber, invoiceNo, unit, medicinesLength: medicines?.length, discount });

    // Validation
    if (!patientName || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !unit) {
      console.log('❌ VALIDATION FAILED:', {
        patientName: !!patientName,
        medicines: !!medicines,
        isArray: Array.isArray(medicines),
        length: medicines?.length,
        unit: !!unit
      });
      return res.status(400).json({ 
        message: 'Missing required fields: patientName, medicines array, and unit are required',
        received: { patientName, medicines: medicines?.length || 0, unit }
      });
    }

    // Validate each medicine
    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      console.log(`📦 Medicine ${i}:`, { medicineId: med.medicineId, quantity: med.quantity, sellingPrice: med.sellingPrice });
      if (!med.medicineId || !med.quantity || med.sellingPrice === undefined) {
        console.log(`❌ MEDICINE VALIDATION FAILED at index ${i}:`, med);
        return res.status(400).json({ 
          message: 'Each medicine must have medicineId, quantity, and sellingPrice',
          failedMedicine: med,
          index: i
        });
      }
    }

    connection = await pool.getConnection();

    // Validate all medicines exist and have sufficient quantity
    // For IPP/Dispensary: check delegations. For others: check medicines inventory
    const userRole = req.user?.role;
    const isIPPOrDispensary = userRole === 'ipp' || userRole === 'dispensary';

    for (const med of medicines) {
      let availableQuantity = 0;

      if (isIPPOrDispensary) {
        // For IPP/Dispensary, check their delegation quantity
        console.log(`🔍 Checking delegation for role: ${userRole}, medicine: ${med.medicineId}`);
        const [delegationRows] = await connection.query(
          `SELECT quantity FROM delegations 
           WHERE medicine_id = ? AND delegated_to = ? AND quantity > 0`,
          [med.medicineId, userRole]
        );

        if (delegationRows.length === 0) {
          connection.release();
          return res.status(404).json({ 
            message: `Medicine ${med.medicineId} not delegated to ${userRole} or no quantity available` 
          });
        }

        availableQuantity = delegationRows[0].quantity;
        console.log(`✅ Delegation found for medicine ${med.medicineId}: ${availableQuantity} units`);
      } else {
        // For admin/store_officer, check central medicines inventory
        console.log(`🔍 Checking medicines inventory for medicine: ${med.medicineId}`);
        const [medicineRows] = await connection.query(
          'SELECT quantity FROM medicines WHERE id = ?',
          [med.medicineId]
        );

        if (medicineRows.length === 0) {
          connection.release();
          return res.status(404).json({ message: `Medicine with ID ${med.medicineId} not found` });
        }

        availableQuantity = medicineRows[0].quantity;
        console.log(`✅ Medicine found: ${availableQuantity} units available`);
      }

      // Check if quantity is sufficient
      if (availableQuantity < med.quantity) {
        connection.release();
        return res.status(400).json({ 
          message: `Insufficient quantity for medicine ${med.medicineId}. Available: ${availableQuantity}, Requested: ${med.quantity}` 
        });
      }
    }

    // Create sales for each medicine and update quantities
    const createdSaleIds = [];
    let totalAmount = 0;

    for (const med of medicines) {
      const subtotal = (med.quantity * med.sellingPrice);
      
      // Apply discount to get final total_price
      let discountAmount = 0;
      if (discount < 0) {
        // Fixed amount discount (negative value)
        discountAmount = Math.abs(discount);
      } else if (discount > 0) {
        // Percentage discount
        discountAmount = subtotal * (discount / 100);
      }
      const totalPrice = Math.max(0, subtotal - discountAmount);
      
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
          discountAmount, // Store actual discount amount
          totalPrice,
          req.user?.id || null
        ]
      );

      createdSaleIds.push(result.insertId);
      totalAmount += totalPrice;

      if (isIPPOrDispensary) {
        // For IPP/Dispensary: ONLY deduct from their delegation
        console.log(`📉 Deducting ${med.quantity} from ${userRole} delegation for medicine ${med.medicineId}`);
        await connection.query(
          `UPDATE delegations 
           SET quantity = CASE 
             WHEN quantity - ? <= 0 THEN 0
             ELSE quantity - ?
           END
           WHERE medicine_id = ? AND delegated_to = ?`,
          [med.quantity, med.quantity, med.medicineId, userRole]
        );
      } else {
        // For admin/store_officer: deduct from central medicines inventory
        console.log(`📉 Deducting ${med.quantity} from medicines inventory for medicine ${med.medicineId}`);
        await connection.query(
          'UPDATE medicines SET quantity = quantity - ? WHERE id = ?',
          [med.quantity, med.medicineId]
        );
      }
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

    // Calculate totals for all sales (excluding returned items from revenue)
    const [totalRows] = await connection.query(
      `SELECT 
        SUM(CASE WHEN s.status != 'returned' THEN s.total_price ELSE 0 END) as totalRevenue,
        SUM(s.quantity) as totalItemsSold,
        COUNT(*) as txCount
       FROM sales s
       WHERE ${whereClause}`,
      params
    );

    // Get paginated sales
    const [sales] = await connection.query(
      `SELECT s.id, s.patient_name, s.folder_no, s.age, s.sex, s.phone_number, s.invoice_no, 
              COALESCE(s.unit, 'N/A') as unit, s.medicine_id, s.quantity, s.selling_price, s.discount, s.total_price, s.sale_date,
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

    // Convert snake_case to camelCase
    const formattedSales = sales.map(sale => {
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

    // Get totals from the database query
    const totalRevenue = parseFloat(totalRows[0].totalRevenue) || 0;
    const totalItemsSold = parseInt(totalRows[0].totalItemsSold) || 0;
    const totalTxCount = parseInt(totalRows[0].txCount) || 0;

    res.json({
      items: formattedSales,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      totals: {
        revenue: totalRevenue,
        itemsSold: totalItemsSold,
        txCount: totalTxCount
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};