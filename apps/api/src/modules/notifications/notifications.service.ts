import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateNotificationDto, QueryNotificationDto } from "./dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId || null,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        actionUrl: dto.actionUrl,
      },
    });
  }

  async createForUser(
    userId: string,
    type: string,
    title: string,
    content: string,
    actionUrl?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        actionUrl,
      },
    });
  }

  async findByUser(userId: string, query: QueryNotificationDto) {
    const { page = 1, limit = 20, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      OR: [
        { userId },
        { userId: null }, // broadcast notifications
      ],
      ...(isRead !== undefined && { isRead: isRead === "true" }),
      ...(type && { type }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          OR: [{ userId }, { userId: null }],
          isRead: false,
        },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId && notification.userId !== userId) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: "All notifications marked as read" };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async delete(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.delete({ where: { id } });
  }

  async findAll(query: QueryNotificationDto) {
    const { page = 1, limit = 20, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      ...(isRead !== undefined && { isRead: isRead === "true" }),
      ...(type && { type }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
