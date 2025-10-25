import { pool } from './src/config/db.js';

async function debugSales() {
  try {
    const connection = await pool.getConnection();

    // Get today's sales
    const today = new Date().toISOString().split('T')[0];
    
    console.log('\n========== TODAY\'S SALES (AFTER FILTERING) ==========');
    const [sales] = await connection.query(`
      SELECT 
        s.id,
        s.patient_name,
        s.quantity,
        s.total_price,
        s.status,
        s.sale_date,
        m.name as medicine_name
      FROM sales s
      LEFT JOIN medicines m ON s.medicine_id = m.id
      WHERE DATE(s.sale_date) = ? AND s.status != 'returned'
      ORDER BY s.sale_date DESC
    `, [today]);

    console.log('Displayed Sales (excluding "returned"):');
    let manualSum = 0;
    sales.forEach((sale, idx) => {
      console.log(`${idx + 1}. ${sale.medicine_name} | Qty: ${sale.quantity} | Price: ₦${sale.total_price} | Status: ${sale.status}`);
      manualSum += parseFloat(sale.total_price);
    });
    console.log(`\nManual Sum: ₦${manualSum.toFixed(2)}`);

    // Check what backend calculates
    console.log('\n========== BACKEND CALCULATION ==========');
    const [totals] = await connection.query(`
      SELECT 
        SUM(CASE WHEN s.status != 'returned' THEN s.total_price ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN s.status != 'returned' THEN s.quantity ELSE 0 END) as totalItemsSold,
        COUNT(CASE WHEN s.status != 'returned' THEN 1 END) as txCount
      FROM sales s
      WHERE DATE(s.sale_date) = ?
    `, [today]);

    console.log('Database Totals (NEW):');
    console.log(`Total Revenue: ₦${totals[0].totalRevenue || 0}`);
    console.log(`Total Items: ${totals[0].totalItemsSold || 0}`);
    console.log(`Transaction Count: ${totals[0].txCount}`);
    console.log(`\nDisplayed Items Count: ${sales.length}`);

    connection.release();
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

debugSales();