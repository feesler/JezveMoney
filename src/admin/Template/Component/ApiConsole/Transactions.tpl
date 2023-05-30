<div id="listTrForm" class="request-data-form">
    <h3>List</h3>
    <form action="<?= BASEURL ?>api/transaction/list" method="get">
        <div class="std_margin column-container">
            <label class="checkbox">
                <input type="checkbox" data-target="order">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Order</span>
            </label>

            <label id="list_trans_isasc" class="radio" hidden>
                <input name="order" type="radio" value="asc" checked disabled>
                <span class="radio__check"></span>
                <span class="radio__label">Ascending</span>
            </label>
            <label id="list_trans_isdesc" class="radio" hidden>
                <input name="order" type="radio" value="desc" checked disabled>
                <span class="radio__check"></span>
                <span class="radio__label">Descending</span>
            </label>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="type">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Types</span>
            </label>
            <input class="input stretch-input" name="type" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="0" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="count">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Max. count</span>
            </label>
            <input class="input stretch-input" name="count" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="10" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="page">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Page number</span>
            </label>
            <input class="input stretch-input" name="page" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="0" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="range">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Pages range</span>
            </label>
            <input class="input stretch-input" name="range" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="1" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="acc_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Account ids</span>
            </label>
            <input class="input stretch-input" name="acc_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="person_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Person ids</span>
            </label>
            <input class="input stretch-input" name="person_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="category_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Category ids</span>
            </label>
            <input class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="stdate">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Start date</span>
            </label>
            <input class="input stretch-input" name="stdate" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="enddate">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">End date</span>
            </label>
            <input class="input stretch-input" name="enddate" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="search">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Search request</span>
            </label>
            <input class="input stretch-input" name="search" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readTrForm" class="request-data-form">
    <h3>Read by ids</h3>
    <div class="std_margin">
        <label for="read_trans_id">Id</label>
        <input id="read_trans_id" class="input stretch-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
    </div>
    <div class="form-controls">
        <input id="readtransbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createTrForm" class="request-data-form">
    <h3>Create</h3>
    <form action="<?= BASEURL ?>api/transaction/create" method="post">
        <div class="std_margin">
            <label for="create_trans_type">Type (1-3)</label>
            <input id="create_trans_type" class="input stretch-input" name="type" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_trans_src_id">Source account</label>
            <input id="create_trans_src_id" class="input stretch-input" name="src_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_trans_dest_id">Destination account</label>
            <input id="create_trans_dest_id" class="input stretch-input" name="dest_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_trans_src_amount">Source amount</label>
            <input id="create_trans_src_amount" class="input stretch-input" name="src_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_trans_dest_amount">Destination amount</label>
            <input id="create_trans_dest_amount" class="input stretch-input" name="dest_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_trans_src_curr">Source currency</label>
            <input id="create_trans_src_curr" class="input stretch-input" name="src_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_trans_dest_curr">Destination currency</label>
            <input id="create_trans_dest_curr" class="input stretch-input" name="dest_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_trans_date">Date</label>
            <input id="create_trans_date" class="input stretch-input" name="date" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_trans_category_id">Category</label>
            <input id="create_trans_category_id" class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_trans_comment">Comment</label>
            <input id="create_trans_comment" class="input stretch-input" name="comment" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="reminder_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Reminder</span>
            </label>
            <input class="input stretch-input" name="reminder_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="0" disabled hidden>
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="createDebtForm" class="request-data-form">
    <h3>Create debt</h3>
    <form action="<?= BASEURL ?>api/transaction/create" method="post">
        <input name="type" type="hidden" value="4">
        <div class="std_margin">
            <label for="create_debt_person_id">Person id</label>
            <input id="create_debt_person_id" class="input stretch-input" name="person_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_debt_acc_id">Account id</label>
            <input id="create_debt_acc_id" class="input stretch-input" name="acc_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_debt_op">Debt operation (1 or 2)</label>
            <input id="create_debt_op" class="input stretch-input" name="op" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_debt_src_amount">Source amount</label>
            <input id="create_debt_src_amount" class="input stretch-input" name="src_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_debt_dest_amount">Destination amount</label>
            <input id="create_debt_dest_amount" class="input stretch-input" name="dest_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_debt_src_curr">Source currency</label>
            <input id="create_debt_src_curr" class="input stretch-input" name="src_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_debt_dest_curr">Destination currency</label>
            <input id="create_debt_dest_curr" class="input stretch-input" name="dest_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_debt_date">Date</label>
            <input id="create_debt_date" class="input stretch-input" name="date" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_debt_category_id">Category</label>
            <input id="create_debt_category_id" class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="create_debt_comment">Comment</label>
            <input id="create_debt_comment" class="input stretch-input" name="comment" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="reminder_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Reminder</span>
            </label>
            <input class="input stretch-input" name="reminder_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="0" disabled hidden>
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateTrForm" class="request-data-form">
    <h3>Update</h3>
    <form action="<?= BASEURL ?>api/transaction/update" method="post">
        <div class="std_margin">
            <label for="update_trans_id">Transaction id</label>
            <input id="update_trans_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_trans_type">Type (1-3)</label>
            <input id="update_trans_type" class="input stretch-input" name="type" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_trans_src_id">Source account</label>
            <input id="update_trans_src_id" class="input stretch-input" name="src_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_trans_dest_id">Destination account</label>
            <input id="update_trans_dest_id" class="input stretch-input" name="dest_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_trans_src_amount">Source amount</label>
            <input id="update_trans_src_amount" class="input stretch-input" name="src_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_trans_dest_amount">Destination amount</label>
            <input id="update_trans_dest_amount" class="input stretch-input" name="dest_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_trans_src_curr">Source currency</label>
            <input id="update_trans_src_curr" class="input stretch-input" name="src_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_trans_dest_curr">Destination currency</label>
            <input id="update_trans_dest_curr" class="input stretch-input" name="dest_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_trans_date">Date</label>
            <input id="update_trans_date" class="input stretch-input" name="date" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_trans_category_id">Category</label>
            <input id="update_trans_category_id" class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_trans_comment">Comment</label>
            <input id="update_trans_comment" class="input stretch-input" name="comment" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>


<div id="updateDebtForm" class="request-data-form">
    <h3>Update debt</h3>
    <form action="<?= BASEURL ?>api/transaction/update" method="post">
        <input name="type" type="hidden" value="4">
        <div class="std_margin">
            <label for="update_debt_id">Transaction id</label>
            <input id="update_debt_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_debt_person_id">Person id</label>
            <input id="update_debt_person_id" class="input stretch-input" name="person_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_debt_acc_id">Account id</label>
            <input id="update_debt_acc_id" class="input stretch-input" name="acc_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_debt_op">Debt operation (1 or 2)</label>
            <input id="update_debt_op" class="input stretch-input" name="op" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_debt_src_amount">Source amount</label>
            <input id="update_debt_src_amount" class="input stretch-input" name="src_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_debt_dest_amount">Destination amount</label>
            <input id="update_debt_dest_amount" class="input stretch-input" name="dest_amount" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_debt_src_curr">Source currency</label>
            <input id="update_debt_src_curr" class="input stretch-input" name="src_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_debt_dest_curr">Destination currency</label>
            <input id="update_debt_dest_curr" class="input stretch-input" name="dest_curr" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_debt_date">Date</label>
            <input id="update_debt_date" class="input stretch-input" name="date" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_debt_category_id">Category</label>
            <input id="update_debt_category_id" class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="update_debt_comment">Comment</label>
            <input id="update_debt_comment" class="input stretch-input" name="comment" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delTrForm" class="request-data-form">
    <h3>Delete transactions</h3>
    <form action="<?= BASEURL ?>api/transaction/delete" method="post">
        <div class="std_margin">
            <label for="deltransactions">Transactions (comma separated ids)</label>
            <input id="deltransactions" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="setTrCategoryForm" class="request-data-form">
    <h3>Set category of transaction</h3>
    <form action="<?= BASEURL ?>api/transaction/setCategory" method="post">
        <div class="std_margin">
            <label for="trans_setCategory_id">Id</label>
            <input id="trans_setCategory_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="trans_setCategory_category_id">Category id</label>
            <input id="trans_setCategory_category_id" class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="setTrPosForm" class="request-data-form">
    <h3>Set position of transaction</h3>
    <form action="<?= BASEURL ?>api/transaction/setpos" method="post">
        <div class="std_margin">
            <label for="trans_pos_id">Id</label>
            <input id="trans_pos_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label for="trans_pos_pos">Position</label>
            <input id="trans_pos_pos" class="input stretch-input" name="pos" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="statisticsForm" class="request-data-form">
    <h3>Statistics</h3>
    <form action="<?= BASEURL ?>api/transaction/statistics" method="post">
        <div class="std_margin">
            <div class="std_margin">
                <label for="statistics_type">Type (1-4)</label>
                <input id="statistics_type" class="input stretch-input" name="type" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
            </div>
            <div class="std_margin">
                <label for="statistics-filter">Report type</label>
                <select id="statistics-filter" class="input stretch-input" name="report">
                    <option value="category" selected>Category</option>
                    <option value="account">Account</option>
                    <option value="currency">Currency</option>
                </select>
            </div>
            <div class="std_margin">
                <label for="statistics_curr">Currency</label>
                <input id="statistics_curr" class="input stretch-input" name="curr_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
            </div>
            <div class="std_margin">
                <label for="statistics_acc">Account ids</label>
                <input id="statistics_acc" class="input stretch-input" name="acc_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
            </div>
            <div class="std_margin">
                <label for="statistics_cat">Category ids</label>
                <input id="statistics_cat" class="input stretch-input" name="category_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
            </div>
            <div class="std_margin">
                <label for="statistics_group">Group by</label>
                <select id="statistics_group" class="input stretch-input" name="group">
                    <option value="none" selected>None</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
            </div>

            <div class="std_margin">
                <label class="checkbox">
                    <input type="checkbox" data-target="stdate">
                    <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                    <span class="checkbox__label">Start date</span>
                </label>
                <input class="input stretch-input" name="stdate" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
            </div>
            <div class="std_margin">
                <label class="checkbox">
                    <input type="checkbox" data-target="enddate">
                    <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                    <span class="checkbox__label">End date</span>
                </label>
                <input class="input stretch-input" name="enddate" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
            </div>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>