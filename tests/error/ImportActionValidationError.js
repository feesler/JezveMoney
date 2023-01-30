export class ImportActionValidationError {
    constructor(message, index) {
        this.message = message;
        this.actionIndex = index;
    }
}
