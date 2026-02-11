import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  QueryTicketDto,
  UpdateTicketDto,
} from "./dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupportTicketsService {
  constructor(private prisma: PrismaService) {}

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TK-${timestamp}${random}`;
  }

  async create(userId: string, dto: CreateTicketDto) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId,
          ticketNumber: this.generateTicketNumber(),
          subject: dto.subject,
          category: dto.category,
          priority: dto.priority || "normal",
          status: "open",
        },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId,
          message: dto.message,
        },
      });

      return ticket;
    });
  }

  async findAll(query: QueryTicketDto) {
    const { page = 1, limit = 10, status, category, priority, userId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {
      ...(status && { status }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(userId && { userId }),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUser(userId: string, query: QueryTicketDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {
      userId,
      ...(status && { status }),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        skip,
        take: limit,
        where,
        include: {
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        messages: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    return ticket;
  }

  async addMessage(
    ticketId: string,
    userId: string,
    dto: CreateTicketMessageDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    if (ticket.status === "closed") {
      throw new BadRequestException("Cannot reply to a closed ticket");
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message: dto.message,
        isInternal: dto.isInternal || false,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    // If admin replies, set status to in_progress if it was open
    if (ticket.status === "open" && ticket.userId !== userId) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "in_progress" },
      });
    }

    return message;
  }

  async updateTicket(id: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    const data: Prisma.SupportTicketUpdateInput = {
      ...(dto.status && { status: dto.status }),
      ...(dto.assignedTo && { assignedTo: dto.assignedTo }),
      ...(dto.priority && { priority: dto.priority }),
      ...(dto.status === "resolved" && { resolvedAt: new Date() }),
    };

    return this.prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async closeTicket(id: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    if (ticket.userId !== userId) {
      throw new BadRequestException("Not authorized to close this ticket");
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: "closed" },
    });
  }

  async getStats() {
    const [open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: "open" } }),
      this.prisma.supportTicket.count({ where: { status: "in_progress" } }),
      this.prisma.supportTicket.count({ where: { status: "resolved" } }),
      this.prisma.supportTicket.count({ where: { status: "closed" } }),
    ]);

    return {
      open,
      inProgress,
      resolved,
      closed,
      total: open + inProgress + resolved + closed,
    };
  }
}
