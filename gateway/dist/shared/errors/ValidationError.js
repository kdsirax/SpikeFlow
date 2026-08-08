import { AppError } from "./AppError.js";
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
//# sourceMappingURL=ValidationError.js.map