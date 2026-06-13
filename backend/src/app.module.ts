import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './auth/guards/at.guard';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewModule } from './review/review.module';
import { CouponModule } from './coupon/coupon.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductModule,
    OrderModule,
    PaymentModule,
    ReviewModule,
    CouponModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Setting up AtGuard as a global guard.
    // By default, every endpoint will require a valid access token.
    // Use @Public() to mark endpoints that don't need auth (like Login or Signup).
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    // Setting up ThrottlerGuard as a global rate limiter.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
