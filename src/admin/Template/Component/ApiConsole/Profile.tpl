<div id="readProfileForm" class="request-data-form">
    <h3>Read profile</h3>
    <form action="<?= BASEURL ?>api/profile/read" method="get">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="changeNameForm" class="request-data-form">
    <h3>Change name</h3>
    <form action="<?= BASEURL ?>api/profile/changename" method="post">
        <div class="std_margin">
            <label for="change_name">Name</label>
            <input id="change_name" class="input stretch-input" name="name" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="changePwdForm" class="request-data-form">
    <h3>Change password</h3>
    <form action="<?= BASEURL ?>api/profile/changepass" method="post">
        <div class="std_margin">
            <label for="change_pass_current">Current password</label>
            <input id="change_pass_current" class="input stretch-input" name="current" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="change_pass_new">New password</label>
            <input id="change_pass_new" class="input stretch-input" name="new" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateSettingsForm" class="request-data-form">
    <h3>Update settings</h3>
    <form action="<?= BASEURL ?>api/profile/updateSettings" method="post">
        <div class="std_margin">
            <label for="upd_settings_name">Settings name</label>
            <input id="upd_settings_name" class="input stretch-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="upd_settings_value">Value</label>
            <input id="upd_settings_value" class="input stretch-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="resetForm" class="request-data-form">
    <h3>Reset data</h3>
    <form class="column-container" action="<?= BASEURL ?>api/profile/reset" method="post">
        <label class="checkbox std_margin">
            <input type="checkbox" name="currencies">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Currencies</span>
        </label>

        <label class="checkbox std_margin">
            <input type="checkbox" name="accounts">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Accounts</span>
        </label>

        <label class="checkbox std_margin">
            <input type="checkbox" name="persons">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Persons</span>
        </label>

        <label class="checkbox std_margin">
            <input type="checkbox" name="categories">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Categories</span>
        </label>

        <label class="checkbox std_margin">
            <input type="checkbox" name="transactions" data-target="keepbalance">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Transactions</span>
        </label>

        <label class="checkbox std_margin suboption">
            <input type="checkbox" name="keepbalance" disabled hidden>
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Keep current balance of accounts</span>
        </label>

        <label class="checkbox std_margin">
            <input type="checkbox" name="importtpl">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Import templates</span>
        </label>

        <label class="checkbox std_margin">
            <input type="checkbox" name="importrules">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Import rules</span>
        </label>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>