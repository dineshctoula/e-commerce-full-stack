import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// OrderService handles order-related operations.
// We inject PrismaService to communicate with the SQLite database.
@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // Shell service. Order creation and retrieval logic will be added here in the next steps.
}
