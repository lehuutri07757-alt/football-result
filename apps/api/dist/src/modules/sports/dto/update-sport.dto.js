"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_sport_dto_1 = require("./create-sport.dto");
class UpdateSportDto extends (0, swagger_1.PartialType)(create_sport_dto_1.CreateSportDto) {
}
exports.UpdateSportDto = UpdateSportDto;
//# sourceMappingURL=update-sport.dto.js.map