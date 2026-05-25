import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// PrismaService manages our database connection.
// In Prisma 7, we pass the SQLite driver adapter factory directly to PrismaClient's constructor.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Extract file path from env database url (e.g. 'file:./dev.db' becomes './dev.db')
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    const dbPath = dbUrl.replace('file:', '');

    // Initialize the SQLite adapter factory with the database URL path
    const adapter = new PrismaBetterSqlite3({ url: dbPath });

    // Pass the adapter factory to PrismaClient
    super({ adapter });
  }

  async onModuleInit() {
    // Connect to database when the application starts
    await this.$connect();
  }
}
