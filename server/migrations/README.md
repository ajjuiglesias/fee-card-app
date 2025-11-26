# Database Migration Instructions

## Run this SQL in your PostgreSQL database

You can run this migration in one of these ways:

### Option 1: Using psql command line
```bash
psql -U your_username -d your_database_name -f server/migrations/001_create_batches.sql
```

### Option 2: Using pgAdmin or any PostgreSQL client
1. Open pgAdmin or your PostgreSQL client
2. Connect to your database
3. Open the SQL query tool
4. Copy and paste the contents of `server/migrations/001_create_batches.sql`
5. Execute the query

### Option 3: Using Node.js script (recommended for local testing)
Run this command from the server directory:
```bash
node -e "const db = require('./config/db'); const fs = require('fs'); const sql = fs.readFileSync('./migrations/001_create_batches.sql', 'utf8'); db.query(sql).then(() => { console.log('✅ Migration completed!'); process.exit(0); }).catch(err => { console.error('❌ Migration failed:', err); process.exit(1); });"
```

## What this migration does:
1. Creates `batches` table with columns: id, tutor_id, name, description, standard_fee, created_at
2. Adds `batch_id` column to `students` table (nullable, references batches)
3. Creates indexes for better query performance

## After migration:
- Your local server will restart automatically (nodemon)
- Batch management endpoints will be available at `/api/batches`
- You can test batch creation in the dashboard

## Rollback (if needed):
If you need to undo this migration, run:
```sql
ALTER TABLE students DROP COLUMN IF EXISTS batch_id;
DROP TABLE IF EXISTS batches;
```
