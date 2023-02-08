export class ImportConditionValidationError {
    constructor(message, index) {
        this.message = message;
        this.conditionIndex = index;
    }
}
