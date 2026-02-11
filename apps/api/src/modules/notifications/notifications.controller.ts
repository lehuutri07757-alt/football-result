import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateNotificationDto, QueryNotificationDto } from "./dto";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators";
import { PERMISSIONS } from "../roles/constants/permissions";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get my notifications" })
  @ApiResponse({ status: 200, description: "User notifications" })
  async getMyNotifications(
    @Request() req: any,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findByUser(req.user.sub, query);
  }

  @Get("me/unread-count")
  @ApiOperation({ summary: "Get my unread notification count" })
  @ApiResponse({ status: 200, description: "Unread count" })
  async getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  @Post("me/read-all")
  @ApiOperation({ summary: "Mark all my notifications as read" })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Post(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  async markAsRead(@Request() req: any, @Param("id") id: string) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  // Admin endpoints
  @Get()
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Get all notifications (Admin)" })
  @ApiResponse({ status: 200, description: "All notifications" })
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async findAll(@Query() query: QueryNotificationDto) {
    return this.notificationsService.findAll(query);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Create notification (Admin)" })
  @ApiResponse({ status: 201, description: "Notification created" })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Delete(":id")
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: "Delete notification (Admin)" })
  @ApiResponse({ status: 200, description: "Notification deleted" })
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async delete(@Param("id") id: string) {
    return this.notificationsService.delete(id);
  }
}
