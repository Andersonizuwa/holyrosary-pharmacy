import { pool } from '../config/db.js';

// Create delegation
export const createDelegation = async (req, res) => {
  let connection;
  try {
    const { medicineId, delegatedTo, quantity, genericName, delegationDate } = req.body;

    console.log('🔍 Delegation request received:', { medicineId, delegatedTo, quantity, genericName, delegationDate });

    // Validation
    if (!medicineId || !delegatedTo || !quantity) {
      console.warn('❌ Missing required fields:', { medicineId, delegatedTo, quantity });
      return res.status(400).json({ message: 'Missing required fields: medicineId, delegatedTo, quantity are required' });
    }

    // Validate quantity is a positive number
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      console.warn('❌ Invalid quantity:', quantity);
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    // Validate delegatedTo is one of the allowed values
    if (!['ipp', 'dispensary', 'other'].includes(delegatedTo)) {
      console.warn('❌ Invalid delegatedTo value:', delegatedTo);
      return res.status(400).json({ message: 'delegatedTo must be one of: ipp, dispensary, other' });
    }

    console.log('📊 Getting database connection...');
    try {
      connection = await pool.getConnection();
      console.log('✅ Database connection established');
    } catch (connError) {
      console.error('❌ Failed to get connection:', connError.message);
      throw new Error(`Database connection failed: ${connError.message}`);
    }

    // Check if medicine exists and has enough quantity
    console.log('🔍 Checking medicine existence and quantity for ID:', medicineId);
    let medicineRows;
    try {
      const result = await connection.query(
        'SELECT id, quantity, name FROM medicines WHERE id = ?',
        [medicineId]
      );
      medicineRows = result[0] || [];
      console.log('📊 Query result:', medicineRows);
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      connection.release();
      throw new Error(`Failed to query medicines: ${queryError.message}`);
    }

    if (medicineRows.length === 0) {
      connection.release();
      console.warn('❌ Medicine not found:', medicineId);
      return res.status(404).json({ message: `Medicine with ID ${medicineId} not found` });
    }

    const availableQuantity = medicineRows[0].quantity;
    const medicineName = medicineRows[0].name;
    
    console.log(`📦 Medicine: "${medicineName}", Available quantity: ${availableQuantity}, Requested: ${parsedQuantity}`);

    if (availableQuantity < parsedQuantity) {
      connection.release();
      console.warn('❌ Insufficient quantity:', { available: availableQuantity, requested: parsedQuantity });
      return res.status(400).json({ 
        message: `Insufficient medicine quantity. Available: ${availableQuantity}, Requested: ${parsedQuantity}` 
      });
    }

    // Create delegation
    console.log('📝 Creating delegation record...');
    let result;
    try {
      const queryResult = await connection.query(
        `INSERT INTO delegations 
         (medicine_id, delegated_by, delegated_to, quantity, original_quantity, generic_name, delegation_date, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [medicineId, req.user?.id || null, delegatedTo, parsedQuantity, parsedQuantity, genericName || null, delegationDate || null]
      );
      result = queryResult[0];
      console.log('✅ Delegation created with ID:', result.insertId);
    } catch (insertError) {
      console.error('❌ Failed to create delegation:', insertError.message);
      connection.release();
      throw new Error(`Failed to create delegation: ${insertError.message}`);
    }

    // Create delegation notification for IPP or Dispensary
    if (delegatedTo === 'ipp' || delegatedTo === 'dispensary') {
      const notificationMessage = `${parsedQuantity} unit(s) of ${medicineName} has been delegated to ${delegatedTo.toUpperCase()}`;
      
      console.log('📢 Creating delegation notification...');
      try {
        await connection.query(
          `INSERT INTO delegation_notifications 
           (medicine_id, delegated_to, quantity, message, is_read, created_at) 
           VALUES (?, ?, ?, ?, 0, NOW())`,
          [medicineId, delegatedTo, parsedQuantity, notificationMessage]
        );
        console.log('✅ Notification created');
      } catch (notifError) {
        console.error('❌ Failed to create notification:', notifError.message);
        connection.release();
        throw new Error(`Failed to create notification: ${notifError.message}`);
      }
    }

    // Reduce medicine quantity
    console.log('📉 Updating medicine quantity...');
    try {
      await connection.query(
        'UPDATE medicines SET quantity = quantity - ? WHERE id = ?',
        [parsedQuantity, medicineId]
      );
      console.log('✅ Medicine quantity updated');
    } catch (updateError) {
      console.error('❌ Failed to update medicine quantity:', updateError.message);
      connection.release();
      throw new Error(`Failed to update medicine quantity: ${updateError.message}`);
    }

    connection.release();

    res.status(201).json({
      id: result.insertId,
      medicineId,
      delegatedTo,
      quantity: parsedQuantity,
      message: 'Delegation created successfully'
    });
  } catch (error) {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('⚠️ Error releasing connection:', releaseError.message);
      }
    }
    console.error('❌ Create delegation error:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Full error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get delegations with pagination
export const getDelegations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // Get total count
    const [countRows] = await connection.query('SELECT COUNT(*) as total FROM delegations');
    const total = countRows[0].total;

    // Get paginated delegations with medicine details and calculate remaining quantities
    // Use COALESCE to handle migrations - if original_quantity is NULL, use quantity
    // LEFT JOIN with sales to calculate how much has been sold
    const [delegations] = await connection.query(
      `SELECT d.id, d.medicine_id, d.delegated_by, d.delegated_to, d.quantity, 
              COALESCE(d.original_quantity, d.quantity) as original_quantity,
              d.generic_name, d.delegation_date, d.created_at,
              m.name, m.barcode, m.expiry_date, m.selling_price,
              COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.quantity ELSE 0 END), 0) as sold_quantity
       FROM delegations d
       LEFT JOIN medicines m ON d.medicine_id = m.id
       LEFT JOIN sales s ON d.medicine_id = s.medicine_id
       GROUP BY d.id
       ORDER BY d.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    connection.release();

    // Convert snake_case to camelCase for frontend
    // Calculate remaining quantity for real-time availability
    const formattedDelegations = delegations.map(d => {
      const remainingQuantity = Math.max(0, d.original_quantity - d.sold_quantity);
      return {
        id: d.id,
        medicineId: d.medicine_id,
        medicineName: d.name,
        genericName: d.generic_name,
        quantity: d.original_quantity, // Show original delegated quantity in history
        remainingQuantity: remainingQuantity, // Available quantity after sales
        originalQuantity: d.original_quantity,
        soldQuantity: d.sold_quantity,
        fromUserId: d.delegated_by,
        toRole: d.delegated_to,
        expiryDate: d.expiry_date,
        delegationDate: d.delegation_date,
        createdAt: d.created_at,
        barcode: d.barcode,
        sellingPrice: Number(d.selling_price) || 0
      };
    });

    res.json({
      items: formattedDelegations,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get delegations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get delegation notifications for IPP and Dispensary
export const getDelegationNotifications = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Only IPP and Dispensary can receive delegation notifications
    if (userRole !== 'ipp' && userRole !== 'dispensary') {
      return res.json({
        notifications: [],
        unreadCount: 0,
        message: 'No delegation notifications for this role'
      });
    }

    const connection = await pool.getConnection();

    // Get unread notifications for user's role
    const [notifications] = await connection.query(
      `SELECT dn.id, dn.medicine_id, dn.delegated_to, dn.quantity, dn.message, dn.is_read, dn.created_at,
              m.name as medicine_name, m.barcode, m.generic_name
       FROM delegation_notifications dn
       LEFT JOIN medicines m ON dn.medicine_id = m.id
       WHERE dn.delegated_to = ? AND dn.is_read = FALSE
       ORDER BY dn.created_at DESC
       LIMIT 50`,
      [userRole]
    );

    // Get count of unread notifications
    const [countRows] = await connection.query(
      'SELECT COUNT(*) as unread_count FROM delegation_notifications WHERE delegated_to = ? AND is_read = FALSE',
      [userRole]
    );

    connection.release();

    const formattedNotifications = notifications.map(n => ({
      id: n.id,
      medicineId: n.medicine_id,
      medicineName: n.medicine_name,
      barcode: n.barcode,
      genericName: n.generic_name,
      delegatedTo: n.delegated_to,
      quantity: n.quantity,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at
    }));

    res.json({
      notifications: formattedNotifications,
      unreadCount: countRows[0].unread_count
    });
  } catch (error) {
    console.error('Get delegation notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark delegation notification as read
export const markDelegationNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE delegation_notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );

    connection.release();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all delegation notifications as read for user role
export const markAllDelegationNotificationsAsRead = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'ipp' && userRole !== 'dispensary') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE delegation_notifications SET is_read = TRUE WHERE delegated_to = ?',
      [userRole]
    );

    connection.release();

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Restore delegations (when a sale is reversed/returned)
export const restoreDelegations = async (req, res) => {
  let connection;
  try {
    const { medicines } = req.body;

    console.log('↩️ Restore delegations request received:', medicines);

    // Validation
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: 'Medicines array is required and must not be empty' });
    }

    // Validate each medicine
    for (const med of medicines) {
      if (!med.medicineId || !med.quantity || med.quantity <= 0) {
        return res.status(400).json({ 
          message: 'Each medicine must have valid medicineId and quantity > 0' 
        });
      }
    }

    try {
      connection = await pool.getConnection();
      console.log('✅ Database connection established');
    } catch (connError) {
      console.error('❌ Failed to get connection:', connError.message);
      throw new Error(`Database connection failed: ${connError.message}`);
    }

    // Process each medicine
    let totalRestored = 0;
    for (const med of medicines) {
      const { medicineId, quantity } = med;
      
      console.log(`📦 Processing medicine ID: ${medicineId}, quantity to restore: ${quantity}`);

      // Find the most recent delegation for this medicine
      const [delegationRows] = await connection.query(
        `SELECT id FROM delegations 
         WHERE medicine_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [medicineId]
      );

      if (delegationRows.length === 0) {
        console.warn(`⚠️ No delegation found for medicine ID: ${medicineId}`);
        continue;
      }

      const delegationId = delegationRows[0].id;

      // NOTE: We do NOT update delegations.quantity anymore
      // The original_quantity field preserves the historical delegated amount (immutable)
      // Sales/returns are tracked separately in the sales table with status and returned_quantity
      // This ensures the delegated medicines history page shows the original delegated amount

      // Find the most recent sale for this medicine and mark it as returned
      console.log(`📝 Finding most recent sale for medicine ID: ${medicineId}`);
      const [saleRows] = await connection.query(
        `SELECT id, quantity, status FROM sales 
         WHERE medicine_id = ? AND status = 'completed'
         ORDER BY sale_date DESC 
         LIMIT 1`,
        [medicineId]
      );

      if (saleRows.length > 0) {
        const sale = saleRows[0];
        
        // Determine if it's a full or partial return
        if (quantity >= sale.quantity) {
          // Full return
          console.log(`📝 Marking sale ${sale.id} as fully returned`);
          await connection.query(
            'UPDATE sales SET status = ?, returned_quantity = quantity WHERE id = ?',
            ['returned', sale.id]
          );
        } else {
          // Partial return
          console.log(`📝 Marking sale ${sale.id} as partial return (${quantity} of ${sale.quantity} units)`);
          await connection.query(
            'UPDATE sales SET status = ?, returned_quantity = ? WHERE id = ?',
            ['partial_return', quantity, sale.id]
          );
        }
      }

      totalRestored += quantity;
      console.log(`✅ Restored ${quantity} units for medicine ID: ${medicineId}`);
    }

    connection.release();

    res.json({
      message: 'Delegations restored successfully and sales marked as returned',
      totalRestored,
      medicinesCount: medicines.length
    });
  } catch (error) {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('⚠️ Error releasing connection:', releaseError.message);
      }
    }
    console.error('❌ Restore delegations error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};