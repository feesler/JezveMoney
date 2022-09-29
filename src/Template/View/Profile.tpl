<?php	include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");		?>
        <div class="container">
            <div class="content">
                <div class="content_wrap column-container">
                    <div class="heading">
                        <h1>Profile</h1>
                    </div>

                    <div class="profile_block">
                        <h2>Login</h2>
                        <span><?=e($user_login)?></span>
                    </div>

                    <div class="profile_block">
                        <h2>Name</h2>
                        <div class="name-container">
                            <span id="namestatic"><?=e($profileInfo["name"])?></span>
                            <a id="changeNameBtn" class="change-name-link" href="<?=BASEURL?>profile/changeName/">Change</a>
                        </div>
                    </div>

                    <div class="profile_block">
                        <h2>Security</h2>
                        <div><a id="changePassBtn" href="<?=BASEURL?>profile/changePass/">Change password</a></div>
                    </div>

                    <div class="profile_block">
                        <h2>User data</h2>
                        <div class="std_margin">
                            <span>You also may reset your data.<br>
                            <input id="resetBtn" class="btn submit-btn" type="button" value="Reset data"></span>
                        </div>
                        <div class="std_margin">
                            <form id="delete_form" method="post" action="<?=BASEURL?>profile/del/">
                            </form>
                            <span>Completely delete profile and all related data.<br>
                            <input id="delProfileBtn" class="btn submit-btn warning-btn" type="button" value="Delete profile"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="changename" class="profile-form-container" hidden>
<form method="post" action="<?=BASEURL?>profile/changename/">
    <div id="name-inp-block" class="validation-block view-row std_margin">
        <label for="newname">New name</label>
        <input id="newname" class="stretch-input" name="name" type="text" autocomplete="off" value="<?=e($profileInfo["name"])?>">
        <div class="invalid-feedback">Input name.<br>New name must be different from the old.</div>
    </div>
</form>
</div>

<div id="changepass" class="profile-form-container" hidden>
<form method="post" action="<?=BASEURL?>profile/changepass/">
    <div id="old-pwd-inp-block" class="validation-block view-row std_margin">
        <label for="oldpwd">Current password</label>
        <input id="oldpwd" class="stretch-input" name="current" type="password" autocomplete="off">
        <div class="invalid-feedback">Input current password.</div>
    </div>

    <div id="new-pwd-inp-block" class="validation-block view-row std_margin">
        <label for="newpwd">New password</label>
        <input id="newpwd" class="stretch-input" name="new" type="password" autocomplete="off">
        <div class="invalid-feedback">Input new password.<br>New password must be different from the old.</div>
    </div>
</form>
</div>

<div id="reset" class="profile-form-container" hidden>
<form method="post" action="<?=BASEURL?>profile/reset/">
    <div class="view-row column-container">
        <label id="resetAllCheck" class="checkbox std_margin">
            <input type="checkbox">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">All</span>
        </label>

        <label id="accountsCheck" class="checkbox std_margin">
            <input type="checkbox" name="accounts">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">Accounts</span>
        </label>

        <label id="personsCheck" class="checkbox std_margin">
            <input type="checkbox" name="persons">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">Persons</span>
        </label>

        <label id="transactionsCheck" class="checkbox std_margin">
            <input type="checkbox" name="transactions">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">Transactions</span>
        </label>

        <label id="keepAccountsBalanceCheck" class="checkbox std_margin suboption" disabled>
            <input type="checkbox" name="keepbalance">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">Keep current balance of accounts</span>
        </label>

        <label id="importTemplatesCheck" class="checkbox std_margin">
            <input type="checkbox" name="importtpl">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">Import templates</span>
        </label>

        <label id="importRulesCheck" class="checkbox std_margin">
            <input type="checkbox" name="importrules">
            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
            <span class="checkbox__label">Import rules</span>
        </label>
    </div>
</form>
</div>

<?php	include(TPL_PATH . "Footer.tpl");	?>
