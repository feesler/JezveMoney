import { assert } from '@jezvejs/assert';

/** User currency model */
export class UserCurrency {
    static availProps = [
        'curr_id',
        'flags',
    ];

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
