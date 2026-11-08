import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // የዳታቤዝ አድራሻውን ከ .env ፋይል አንብበህ ወደ Adapter አስገባ
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    // Adapter ን ወደ PrismaClient አስገባ
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}