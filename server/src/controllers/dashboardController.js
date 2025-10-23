import { pool } from '../config/db.js';

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const userRole = req.user?.role;

    // For IPP and Dispensary, show sum of delegated stock in stock
    if (userRole === 'ipp' || userRole === 'dispensary') {
      // Total delegated medicines in stock (sum of delegated quantities where quantity > 0)
      const [medicineStats] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM delegations WHERE delegated_to = ? AND quantity > 0',
        [userRole]
      );

      // Total sales (today) - only sales from delegated medicines, excluding returned
      const [todaySalesStats] = await connection.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(s.total_price), 0) as total 
         FROM sales s
         JOIN delegations d ON s.medicine_id = d.medicine_id
         WHERE d.delegated_to = ? AND DATE(s.sale_date) = CURDATE() AND s.status != 'returned'`,
        [userRole]
      );

      // Sales data for the last 7 days (for chart) - only from delegated medicines, excluding returned
      const [salesDataStats] = await connection.query(
        `SELECT DATE(s.sale_date) as date, COALESCE(SUM(s.total_price), 0) as amount
         FROM sales s
         JOIN delegations d ON s.medicine_id = d.medicine_id
         WHERE d.delegated_to = ? AND s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND s.status != 'returned'
         GROUP BY DATE(s.sale_date)
         ORDER BY date ASC`,
        [userRole]
      );

      // Total sales (this month) - only from delegated medicines, excluding returned
      const [monthlySalesStats] = await connection.query(
        `SELECT COALESCE(SUM(s.total_price), 0) as total 
         FROM sales s
         JOIN delegations d ON s.medicine_id = d.medicine_id
         WHERE d.delegated_to = ? AND MONTH(s.sale_date) = MONTH(NOW()) AND YEAR(s.sale_date) = YEAR(NOW()) AND s.status != 'returned'`,
        [userRole]
      );

      connection.release();

      // Format sales data for chart
      const salesData = salesDataStats.map(item => ({
        date: item.date.toISOString().split('T')[0],
        amount: parseFloat(item.amount)
      }));

      res.json({
        totalMedicines: medicineStats[0].total,
        isDelegatedView: true,
        todaySalesAmount: parseFloat(todaySalesStats[0].total),
        salesData: salesData,
        monthlySalesTotal: parseFloat(monthlySalesStats[0].total)
      });
    } else {
      // For admin, store_officer, superadmin - show overall medicine stock
      // Total medicines
      const [medicineStats] = await connection.query('SELECT COUNT(*) as total FROM medicines');

      // Low stock medicines
      const [lowStockStats] = await connection.query(
        'SELECT COUNT(*) as total FROM medicines WHERE quantity < low_stock_threshold AND quantity > 0'
      );

      // Out of stock medicines
      const [outOfStockStats] = await connection.query(
        'SELECT COUNT(*) as total FROM medicines WHERE quantity = 0'
      );

      // In stock medicines (quantity > 0)
      const [inStockStats] = await connection.query(
        'SELECT COUNT(*) as total FROM medicines WHERE quantity > 0'
      );

      // Expired medicines
      const [expiredStats] = await connection.query(
        'SELECT COUNT(*) as total FROM medicines WHERE expiry_date < NOW()'
      );

      // Total sales (today) - excluding returned
      const [todaySalesStats] = await connection.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total 
         FROM sales WHERE DATE(sale_date) = CURDATE() AND status != 'returned'`
      );

      // Sales data for the last 7 days (for chart) - excluding returned
      const [salesDataStats] = await connection.query(
        `SELECT DATE(sale_date) as date, COALESCE(SUM(total_price), 0) as amount
         FROM sales 
         WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND status != 'returned'
         GROUP BY DATE(sale_date)
         ORDER BY date ASC`
      );

      // Total sales (this month) - excluding returned
      const [monthlySalesStats] = await connection.query(
        `SELECT COALESCE(SUM(total_price), 0) as total 
         FROM sales WHERE MONTH(sale_date) = MONTH(NOW()) AND YEAR(sale_date) = YEAR(NOW()) AND status != 'returned'`
      );

      connection.release();

      // Format sales data for chart
      const salesData = salesDataStats.map(item => ({
        date: item.date.toISOString().split('T')[0],
        amount: parseFloat(item.amount)
      }));

      res.json({
        totalMedicines: medicineStats[0].total,
        inStock: inStockStats[0].total,
        lowStock: lowStockStats[0].total,
        outOfStock: outOfStockStats[0].total,
        expired: expiredStats[0].total,
        todaySalesAmount: parseFloat(todaySalesStats[0].total),
        salesData: salesData,
        monthlySalesTotal: parseFloat(monthlySalesStats[0].total)
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};