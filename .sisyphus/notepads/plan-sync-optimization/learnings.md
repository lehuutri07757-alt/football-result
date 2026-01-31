1. Added `SyncConfigService` under `apps/api/src/modules/api-football/` to centralize sync configuration loading, merging with defaults, and persisting updates via Prisma.
2. Service logs configuration details and exposes convenience getters to ease consumption by other modules like schedulers and controllers.
3. Admin UI pages pair `useAdminTheme`/tailwind card scaffolds with shared helpers (AdminLoading, TableSkeleton) and rely on service modules (adminService, matchesService) plus `toast` notifications for API-driven interactions.
