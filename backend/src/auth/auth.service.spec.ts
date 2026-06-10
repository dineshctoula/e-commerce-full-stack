import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should update user name and email successfully', async () => {
      const userId = 'user-123';
      const dto = { name: 'Updated Name', email: 'newemail@example.com' };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // email not in use
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: userId,
        email: dto.email,
        name: dto.name,
        role: 'USER',
      });

      const result = await service.updateProfile(userId, dto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: dto.name, email: dto.email },
      });
      expect(result).toEqual({
        id: userId,
        email: dto.email,
        name: dto.name,
        role: 'USER',
      });
    });

    it('should throw BadRequestException if email is already in use by another user', async () => {
      const userId = 'user-123';
      const dto = { name: 'Updated Name', email: 'taken@example.com' };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'different-user',
        email: dto.email,
      });

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully when current password matches', async () => {
      const userId = 'user-123';
      const currentPassword = 'old-password';
      const newPassword = 'new-secure-password';
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: userId,
        password: hashedPassword,
      });
      mockPrismaService.user.update.mockResolvedValueOnce({});

      const result = await service.changePassword(userId, {
        currentPassword,
        newPassword,
      });

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      const userId = 'user-123';
      const currentPassword = 'wrong-password';
      const newPassword = 'new-secure-password';
      const realHashedPassword = await bcrypt.hash('actual-password', 10);

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: userId,
        password: realHashedPassword,
      });

      await expect(
        service.changePassword(userId, { currentPassword, newPassword }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
