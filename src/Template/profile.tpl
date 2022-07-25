<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container">
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
                        <div><a id="changeNameBtn" href="<?=BASEURL?>profile/changeName/">Change</a></div>
                    </div>

                    <div class="profile_block">
                        <h2>Security</h2>
                        <div><a id="changePassBtn" href="<?=BASEURL?>profile/changePass/">Change password</a></div>
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

<div id="changename" class="profile-form-container" hidden>
<form method="post" action="<?=BASEURL?>profile/changename/">
    <div id="name-inp-block" class="validation-block view-row">
        <label for="newname">New name</label>
        <input id="newname" class="stretch-input" name="name" type="text" autocomplete="off" value="<?=e($profileInfo->name)?>">
        <div class="invalid-feedback">Please input correct name.<br>New name must be different from the old.</div>
    </div>
</form>
</div>

<div id="changepass" class="profile-form-container" hidden>
<form method="post" action="<?=BASEURL?>profile/changepass/">
    <div id="old-pwd-inp-block" class="validation-block view-row">
        <label for="oldpwd">Current password</label>
        <input id="oldpwd" class="stretch-input" name="current" type="password" autocomplete="off">
        <div class="invalid-feedback">Please input current password.</div>
    </div>

    <div id="new-pwd-inp-block" class="validation-block view-row">
        <label for="newpwd">New password</label>
        <input id="newpwd" class="stretch-input" name="new" type="password" autocomplete="off">
        <div class="invalid-feedback">Please input correct new password.<br>New password must be different from the old.</div>
    </div>
</form>
</div>

<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
