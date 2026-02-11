import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { SupportTicketsService } from "./support-tickets.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  QueryTicketDto,
  UpdateTicketDto,
} from "./dto";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators";
import { PERMISSIONS } from "../roles/constants/permissions";

@ApiTags("Support Tickets")
@Controller("support-tickets")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportTicketsController {
  constructor(private supportTicketsService: SupportTicketsService) {}

  // ===== User endpoints =====

  @Post()
  @ApiOperation({ summary: "Create a support ticket" })
  @ApiResponse({ status: 201, description: "Ticket created" })
  async create(@Request() req: any, @Body() dto: CreateTicketDto) {
    return this.supportTicketsService.create(req.user.sub, dto);
  }

  @Get("me")
  @ApiOperation({ summary: "Get my support tickets" })
  @ApiResponse({ status: 200, description: "User support tickets" })
  async getMyTickets(@Request() req: any, @Query() query: QueryTicketDto) {
    return this.supportTicketsService.findByUser(req.user.sub, query);
  }

  @Get("me/:id")
  @ApiOperation({ summary: "Get my ticket detail" })
  @ApiResponse({ status: 200, description: "Ticket detail with messages" })
  async getMyTicket(@Request() req: any, @Param("id") id: string) {
    const ticket = await this.supportTicketsService.findById(id);
    if (ticket.userId !== req.user.sub) {
      throw new Error("Not authorized");
    }
    return ticket;
  }

  @Post("me/:id/messages")
  @ApiOperation({ summary: "Reply to my support ticket" })
  @ApiResponse({ status: 201, description: "Message added" })
  async replyToMyTicket(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: CreateTicketMessageDto,
  ) {
    return this.supportTicketsService.addMessage(id, req.user.sub, {
      ...dto,
      isInternal: false, // Users cannot create internal notes
    });
  }

  @Post("me/:id/close")
  @ApiOperation({ summary: "Close my support ticket" })
  @ApiResponse({ status: 200, description: "Ticket closed" })
  async closeMyTicket(@Request() req: any, @Param("id") id: string) {
    return this.supportTicketsService.closeTicket(id, req.user.sub);
  }

  // ===== Admin endpoints =====

  @Get()
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Get all support tickets (Admin)" })
  @ApiResponse({ status: 200, description: "All support tickets" })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async findAll(@Query() query: QueryTicketDto) {
    return this.supportTicketsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Get support ticket statistics (Admin)" })
  @ApiResponse({ status: 200, description: "Ticket statistics" })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async getStats() {
    return this.supportTicketsService.getStats();
  }

  @Get(":id")
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Get support ticket detail (Admin)" })
  @ApiResponse({ status: 200, description: "Ticket detail with messages" })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async findOne(@Param("id") id: string) {
    return this.supportTicketsService.findById(id);
  }

  @Patch(":id")
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Update support ticket (Admin)" })
  @ApiResponse({ status: 200, description: "Ticket updated" })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async update(@Param("id") id: string, @Body() dto: UpdateTicketDto) {
    return this.supportTicketsService.updateTicket(id, dto);
  }

  @Post(":id/messages")
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Add message to ticket (Admin)" })
  @ApiResponse({ status: 201, description: "Message added" })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async addMessage(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: CreateTicketMessageDto,
  ) {
    return this.supportTicketsService.addMessage(id, req.user.sub, dto);
  }
}
