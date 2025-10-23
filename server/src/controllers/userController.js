import { pool } from '../config/db.js';

// Get all users with pagination
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // Get total count
    const [countRows] = await connection.query('SELECT COUNT(*) as total FROM users');
    const total = countRows[0].total;

    // Get paginated users
    const [users] = await connection.query(
      `SELECT id, name, email, role, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    connection.release();

    // Convert snake_case to camelCase
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.created_at
    }));

    res.json({
      items: formattedUsers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};