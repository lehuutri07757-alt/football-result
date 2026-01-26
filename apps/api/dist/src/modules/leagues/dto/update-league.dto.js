"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLeagueDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_league_dto_1 = require("./create-league.dto");
class UpdateLeagueDto extends (0, swagger_1.PartialType)(create_league_dto_1.CreateLeagueDto) {
}
exports.UpdateLeagueDto = UpdateLeagueDto;
//# sourceMappingURL=update-league.dto.js.map