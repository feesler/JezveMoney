<div id="listUserCurrencyForm" class="request-data-form">
    <h3>List user currencies</h3>
    <form action="<?= BASEURL ?>api/usercurrency/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="curr_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Currency id</span>
            </label>
            <input class="input stretch-input" name="curr_id" type="text" value="" disabled hidden>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readUserCurrencyForm" class="request-data-form">
    <h3>Read user currency</h3>
    <div class="std_margin">
        <label for="read_user_currency_id">Id</label>
        <input id="read_user_currency_id" class="input stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readUserCurrencyBtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createUserCurrencyForm" class="request-data-form">
    <h3>Create user currency</h3>
    <form action="<?= BASEURL ?>api/usercurrency/create" method="post">
        <div class="std_margin">
            <label for="create_user_currency_curr_id">Currency id</label>
            <input id="create_user_currency_curr_id" class="input stretch-input" name="curr_id" type="text">
        </div>
        <div class="std_margin">
            <label for="create_user_currency_flags">Flags</label>
            <input id="create_user_currency_flags" class="input stretch-input" name="flags" type="text">
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

<div id="updateUserCurrencyForm" class="request-data-form">
    <h3>Update user currency</h3>
    <form action="<?= BASEURL ?>api/usercurrency/update" method="post">
        <div class="std_margin">
            <label for="update_user_currency_id">Id</label>
            <input id="update_user_currency_id" class="input stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_user_currency_curr_id">Currency id</label>
            <input id="update_user_currency_curr_id" class="input stretch-input" name="curr_id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_user_currency_flags">Flags</label>
            <input id="update_user_currency_flags" class="input stretch-input" name="flags" type="text">
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

<div id="delUserCurrencyForm" class="request-data-form">
    <h3>Delete user currency</h3>
    <form action="<?= BASEURL ?>api/usercurrency/delete" method="post">
        <div class="std_margin">
            <label for="delUserCurrency">User currencies (comma separated ids)</label>
            <input id="delUserCurrency" class="input stretch-input" name="id" type="text">
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

<div id="setUserCurrencyPosForm" class="request-data-form">
    <h3>Set position of user currency</h3>
    <form action="<?= BASEURL ?>api/usercurrency/setpos" method="post">
        <div class="std_margin">
            <label for="user_currency_pos_id">Id</label>
            <input id="user_currency_pos_id" class="input stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="user_currency_pos_pos">Position</label>
            <input id="user_currency_pos_pos" class="input stretch-input" name="pos" type="text">
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