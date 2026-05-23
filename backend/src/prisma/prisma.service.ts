import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {
  async $connect() {
    return;
  }

  async $disconnect() {
    return;
  }

  async $queryRaw(_query?: any) {
    return null;
  }
}
