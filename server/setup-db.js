import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  let connection;
  try {
    // First, create a connection to MySQL (without specifying a database)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
    });

    console.log('✅ Connected to MySQL');

    // Read the SQL file
    const sqlFile = path.resolve('./database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (error) {
        // Some statements might fail if they already exist, that's OK
        if (error.code === 'ER_DB_CREATE_EXISTS' || error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️  Already exists (skipping):', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error executing statement:', error.message);
        }
      }
    }

    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Failed to setup database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();