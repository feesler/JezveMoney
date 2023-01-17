<div id="listAccForm" class="request-data-form active">
    <h3>List accounts</h3>
    <form action="<?= BASEURL ?>api/account/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="owner">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Owner</span>
            </label>
            <input class="stretch-input" name="owner" type="text" disabled>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="visibility">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Visibility</span>
            </label>
            <select name="visibility" class="stretch-input" disabled>
                <option value="all">All</option>
                <option value="visible" selected>Visible</option>
                <option value="hidden">Hidden</option>
            </select>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="sort">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Sort by</span>
            </label>
            <select name="sort" class="stretch-input" disabled>
                <option value="visibility">Visibility</option>
            </select>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readAccForm" class="request-data-form">
    <h3>Read accounts by ids</h3>
    <div class="std_margin">
        <label for="readaccid">Id</label>
        <input id="readaccid" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readaccbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createAccForm" class="request-data-form">
    <h3>Create account</h3>
    <form action="<?= BASEURL ?>api/account/create" method="post">
        <div class="std_margin">
            <label for="create_account_name">Name</label>
            <input id="create_account_name" class="stretch-input" name="name" type="text">
        </div>
        <div class="std_margin">
            <label for="create_account_initbalance">Initial balance</label>
            <input id="create_account_initbalance" class="stretch-input" name="initbalance" type="text">
        </div>
        <div class="std_margin">
            <label for="create_account_curr">Currency (1-5, 10-22)</label>
            <input id="create_account_curr" class="stretch-input" name="curr_id" type="text">
        </div>
        <div class="std_margin">
            <label for="create_account_icon">Icon (1-6; 0 - no icon)</label>
            <input id="create_account_icon" class="stretch-input" name="icon_id" type="text">
        </div>
        <div class="std_margin">
            <label for="create_account_flags">Flags (0 - account is visible; 1 - hidden)</label>
            <input id="create_account_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateAccForm" class="request-data-form">
    <h3>Update account</h3>
    <form action="<?= BASEURL ?>api/account/update" method="post">
        <div class="std_margin">
            <label for="update_account_id">Id</label>
            <input id="update_account_id" class="stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_account_name">Name</label>
            <input id="update_account_name" class="stretch-input" name="name" type="text">
        </div>
        <div class="std_margin">
            <label for="update_account_initbalance">Initial balance</label>
            <input id="update_account_initbalance" class="stretch-input" name="initbalance" type="text">
        </div>
        <div class="std_margin">
            <label for="update_account_curr">Currency (1-5, 10-22)</label>
            <input id="update_account_curr" class="stretch-input" name="curr_id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_account_icon">Icon (1-6; 0 - no icon)</label>
            <input id="update_account_icon" class="stretch-input" name="icon_id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_account_flags">Flags (0 - account is visible; 1 - hidden)</label>
            <input id="update_account_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delAccForm" class="request-data-form">
    <h3>Delete accounts</h3>
    <div class="std_margin">
        <label for="delaccounts">Accounts (comma separated ids)</label>
        <input id="delaccounts" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="delaccbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>