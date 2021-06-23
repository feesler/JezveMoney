<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap column-container">
                    <div class="heading">
                        <h1>User profile</h1>
                    </div>

                    <div class="profile_block">
                        <h2>Account name</h2>
                        <span><?=e($user_login)?></span>
                    </div>

                    <div class="profile_block">
                        <h2>User name</h2>
                        <span id="namestatic"><?=e($profileInfo->name)?></span>
                        <div><a id="changeNameBtn" href="<?=BASEURL?>profile/changename/">Change</a></div>
                    </div>

                    <div class="profile_block">
                        <h2>Security</h2>
                        <div><a id="changePassBtn" href="<?=BASEURL?>profile/changepass/">Change password</a></div>
                    </div>

                    <div class="profile_block">
                        <h2>Reset data</h2>
                        <div class="std_margin">
                            <form id="resetacc_form" method="post" action="<?=BASEURL?>profile/reset/">
                            </form>
                            <span>You also may reset all your accounts data.<br>
                            <input id="resetAccBtn" class="btn submit-btn" type="button" value="Reset"></span>
                        </div>
                        <div class="std_margin">
                            <form id="resetall_form" method="post" action="<?=BASEURL?>profile/resetall/">
                            </form>
                            <span>You may also reset all your data and start from the scratch.<br>
                            <input id="resetAllBtn" class="btn submit-btn" type="button" value="Reset all"></span>
                        </div>
                        <div class="std_margin">
                            <form id="delete_form" method="post" action="<?=BASEURL?>profile/del/">
                            </form>
                            <span>Completely delete profile and all related data.<br>
                            <input id="delProfileBtn" class="btn submit-btn" type="button" value="Delete profile"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="changename" class="profile-form-container hidden">
<form method="post" action="<?=BASEURL?>profile/changename/">
    <div id="name-inp-block" class="validation-block view-row">
        <label for="newname">New name</label>
        <div class="stretch-input std_margin">
            <input id="newname" name="name" type="text" autocomplete="off" value="<?=e($profileInfo->name)?>">
        </div>
        <div class="invalid-feedback">Please input correct name.<br>New name must be different from the old.</div>
    </div>
    <div id="changeNameLoading" class="form__loading hidden">Loading...</div>
</form>
</div>

<div id="changepass" class="profile-form-container hidden">
<form method="post" action="<?=BASEURL?>profile/changepass/">
    <div id="old-pwd-inp-block" class="validation-block view-row">
        <label for="oldpwd">Current password</label>
        <div class="stretch-input std_margin">
            <input id="oldpwd" name="current" type="password" autocomplete="off">
        </div>
        <div class="invalid-feedback">Please input current password.</div>
    </div>

    <div id="new-pwd-inp-block" class="validation-block view-row">
        <label for="newpwd">New password</label>
        <div class="stretch-input std_margin">
            <input id="newpwd" name="new" type="password" autocomplete="off">
        </div>
        <div class="invalid-feedback">Please input correct new password.<br>New password must be different from the old.</div>
    </div>

    <div id="changePassLoading" class="form__loading hidden">Loading...</div>
</form>
</div>

<script>
window.app = {
    profile: <?=JSON::encode($profileInfo)?>,
<?php	if ($this->action == "changepass" || $this->action == "changename") {		?>
    action: <?=JSON::encode($this->action)?>
<?php	}	?>
};
</script>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
