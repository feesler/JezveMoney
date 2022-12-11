import { assert } from 'jezve-test';

/** Category model */
export class Category {
    constructor(data) {
        assert(data, 'Invalid data');

        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.parent_id = data.parent_id;
    }
}
