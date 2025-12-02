import { NextResponse } from 'next/server';
import { runMigration } from '@/lib/db/migrate';
import { initDatabase } from '@/lib/db/connection';

/**
 * POST /api/migrate
 * Run database migration (schema initialization + user migration)
 * This should be called once to set up the database
 */
export async function POST() {
  try {
    // Initialize database connection
    initDatabase();
    
    // Run migration
    await runMigration();
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
      },
      { status: 500 }
    );
  }
}

