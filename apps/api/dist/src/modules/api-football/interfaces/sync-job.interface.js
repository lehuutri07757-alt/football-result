"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_JOB_OPTIONS = exports.SYNC_QUEUE_NAME = exports.SyncJobPriority = exports.SyncJobStatus = exports.SyncJobType = void 0;
var SyncJobType;
(function (SyncJobType) {
    SyncJobType["league"] = "league";
    SyncJobType["team"] = "team";
    SyncJobType["fixture"] = "fixture";
    SyncJobType["odds_upcoming"] = "odds_upcoming";
    SyncJobType["odds_live"] = "odds_live";
    SyncJobType["full_sync"] = "full_sync";
})(SyncJobType || (exports.SyncJobType = SyncJobType = {}));
var SyncJobStatus;
(function (SyncJobStatus) {
    SyncJobStatus["pending"] = "pending";
    SyncJobStatus["processing"] = "processing";
    SyncJobStatus["completed"] = "completed";
    SyncJobStatus["failed"] = "failed";
    SyncJobStatus["cancelled"] = "cancelled";
})(SyncJobStatus || (exports.SyncJobStatus = SyncJobStatus = {}));
var SyncJobPriority;
(function (SyncJobPriority) {
    SyncJobPriority["low"] = "low";
    SyncJobPriority["normal"] = "normal";
    SyncJobPriority["high"] = "high";
    SyncJobPriority["critical"] = "critical";
})(SyncJobPriority || (exports.SyncJobPriority = SyncJobPriority = {}));
exports.SYNC_QUEUE_NAME = 'sync-jobs';
exports.SYNC_JOB_OPTIONS = {
    [SyncJobType.league]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
    [SyncJobType.team]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
    [SyncJobType.fixture]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
    [SyncJobType.odds_upcoming]: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 30000 },
        removeOnComplete: 50,
        removeOnFail: 30,
    },
    [SyncJobType.odds_live]: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
        removeOnComplete: 20,
        removeOnFail: 20,
        priority: 1,
    },
    [SyncJobType.full_sync]: {
        attempts: 1,
        removeOnComplete: 10,
        removeOnFail: 10,
    },
};
//# sourceMappingURL=sync-job.interface.js.map