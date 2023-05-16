<div id="listScheduledTrForm" class="request-data-form">
    <h3>List</h3>
    <form action="<?= BASEURL ?>api/scheduledtransaction/list" method="get">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readScheduledTrForm" class="request-data-form">
    <h3>Read by ids</h3>
    <div class="std_margin">
        <label for="read_scheduled_trans_id">Id</label>
        <input id="read_scheduled_trans_id" class="input stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readScheduledTransBtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createScheduledTrForm" class="request-data-form">
    <h3>Create</h3>
    <form action="<?= BASEURL ?>api/scheduledtransaction/create" method="post">
        <div class="std_margin">
            <label for="create_scheduled_trans_type">Type (1-5)</label>
            <input id="create_scheduled_trans_type" class="input stretch-input" name="type" type="text">
        </div>
        <div class="std_margin">
            <label for="create_scheduled_trans_src_id">Source account</label>
            <input id="create_scheduled_trans_src_id" class="input stretch-input" name="src_id" type="text">
        </div>
        <div class="std_margin">
            <label for="create_scheduled_trans_dest_id">Destination account</label>
            <input id="create_scheduled_trans_dest_id" class="input stretch-input" name="dest_id" type="text">
        </div>
        <div class="std_margin">
            <label for="create_scheduled_trans_src_amount">Source amount</label>
            <input id="create_scheduled_trans_src_amount" class="input stretch-input" name="src_amount" type="text">
        </div>
        <div class="std_margin">
            <label for="create_scheduled_trans_dest_amount">Destination amount</label>
            <input id="create_scheduled_trans_dest_amount" class="input stretch-input" name="dest_amount" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_src_curr">Source currency</label>
            <input id="create_scheduled_trans_src_curr" class="input stretch-input" name="src_curr" type="text">
        </div>
        <div class="std_margin">
            <label for="create_scheduled_trans_dest_curr">Destination currency</label>
            <input id="create_scheduled_trans_dest_curr" class="input stretch-input" name="dest_curr" type="text">
        </div>

        <div class="std_margin">
            <label for="create_trans_category_id">Category</label>
            <input id="create_trans_category_id" class="input stretch-input" name="category_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_comment">Comment</label>
            <input id="create_scheduled_trans_comment" class="input stretch-input" name="comment" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_start_date">Start date</label>
            <input id="create_scheduled_trans_start_date" class="input stretch-input" name="start_date" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_end_date">End date</label>
            <input id="create_scheduled_trans_end_date" class="input stretch-input" name="end_date" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_int_type">Interval type (0-4)</label>
            <input id="create_scheduled_trans_int_type" class="input stretch-input" name="interval_type" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_int_step">Interval step</label>
            <input id="create_scheduled_trans_int_step" class="input stretch-input" name="interval_step" type="text">
        </div>

        <div class="std_margin">
            <label for="create_scheduled_trans_int_offset">Interval offset</label>
            <input id="create_scheduled_trans_int_offset" class="input stretch-input" name="interval_offset" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateScheduledTrForm" class="request-data-form">
    <h3>Update</h3>
    <form action="<?= BASEURL ?>api/scheduledtransaction/update" method="post">
        <div class="std_margin">
            <label for="update_scheduled_trans_id">Scheduled transaction id</label>
            <input id="update_scheduled_trans_id" class="input stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_scheduled_trans_type">Type (1-5)</label>
            <input id="update_scheduled_trans_type" class="input stretch-input" name="type" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_src_id">Source account</label>
            <input id="update_scheduled_trans_src_id" class="input stretch-input" name="src_id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_scheduled_trans_dest_id">Destination account</label>
            <input id="update_scheduled_trans_dest_id" class="input stretch-input" name="dest_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_src_amount">Source amount</label>
            <input id="update_scheduled_trans_src_amount" class="input stretch-input" name="src_amount" type="text">
        </div>
        <div class="std_margin">
            <label for="update_scheduled_trans_dest_amount">Destination amount</label>
            <input id="update_scheduled_trans_dest_amount" class="input stretch-input" name="dest_amount" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_src_curr">Source currency</label>
            <input id="update_scheduled_trans_src_curr" class="input stretch-input" name="src_curr" type="text">
        </div>
        <div class="std_margin">
            <label for="update_scheduled_trans_dest_curr">Destination currency</label>
            <input id="update_scheduled_trans_dest_curr" class="input stretch-input" name="dest_curr" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_category_id">Category</label>
            <input id="update_scheduled_trans_category_id" class="input stretch-input" name="category_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_comment">Comment</label>
            <input id="update_scheduled_trans_comment" class="input stretch-input" name="comment" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_start_date">Start date</label>
            <input id="update_scheduled_trans_start_date" class="input stretch-input" name="start_date" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_end_date">End date</label>
            <input id="update_scheduled_trans_end_date" class="input stretch-input" name="end_date" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_int_type">Interval type (0-4)</label>
            <input id="update_scheduled_trans_int_type" class="input stretch-input" name="interval_type" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_int_step">Interval step</label>
            <input id="update_scheduled_trans_int_step" class="input stretch-input" name="interval_step" type="text">
        </div>

        <div class="std_margin">
            <label for="update_scheduled_trans_int_offset">Interval offset</label>
            <input id="update_scheduled_trans_int_offset" class="input stretch-input" name="interval_offset" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delScheduledTrForm" class="request-data-form">
    <h3>Delete scheduled transactions</h3>
    <form action="<?= BASEURL ?>api/scheduledtransaction/delete" method="post">
        <div class="std_margin">
            <label for="deltransactions">Transactions (comma separated ids)</label>
            <input id="deltransactions" class="input stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>