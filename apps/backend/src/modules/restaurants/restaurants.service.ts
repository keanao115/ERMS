import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { branches: true }
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found with id ${id}`);
    }
    return restaurant;
  }

  async updateRestaurant(id: string, data: { name?: string; logoUrl?: string; taxRegistrationNumber?: string }) {
    return this.prisma.restaurant.update({
      where: { id },
      data
    });
  }

  async getBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { restaurant: true }
    });
    if (!branch) {
      throw new NotFoundException(`Branch not found with id ${id}`);
    }
    return branch;
  }

  async updateBranch(id: string, data: { name?: string; address?: string; city?: string; phone?: string; capacity?: number }) {
    return this.prisma.branch.update({
      where: { id },
      data
    });
  }
}
