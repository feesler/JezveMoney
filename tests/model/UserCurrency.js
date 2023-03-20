import { assert } from 'jezve-test';

/** User currency model */
export class UserCurrency {
    constructor(data) {
        assert(data, 'Invalid data');

        this.id = data.id;
        this.curr_id = data.curr_id;
        this.flags = data.flags;
        this.pos = data.pos;
        this.createdate = data.createdate;
        this.updatedate = data.updatedate;
    }
}
