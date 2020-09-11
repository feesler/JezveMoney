<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap profile-content">
					<div class="heading">
						<h1>User profile</h1>
					</div>

					<div class="profile_block">
						<h2>Account name</h2>
						<span><?=e($user_login)?></span>
					</div>

					<div class="profile_block">
						<h2>User name</h2>
						<span id="namestatic"><?=e($person_name)?></span>
						<div><a id="changeNameBtn" href="<?=BASEURL?>profile/changename/">Change</a></div>
					</div>

					<div class="profile_block">
						<h2>Security</h2>
						<div><a id="changePassBtn" href="<?=BASEURL?>profile/changepass/">Change password</a></div>
					</div>

					<div class="profile_block">
						<h2>Reset data</h2>
						<div>
							<form id="resetacc_form" method="post" action="<?=BASEURL?>profile/reset/">
							</form>
							<span>You also may reset all your accounts data.<br>
							<input id="resetAccBtn" class="btn ok_btn" type="button" value="Reset"></span>
						</div>
						<div style="margin-top: 15px;">
							<form id="resetall_form" method="post" action="<?=BASEURL?>profile/resetall/">
							</form>
							<span>You may also reset all your data and start from the scratch.<br>
							<input id="resetAllBtn" class="btn ok_btn" type="button" value="Reset all"></span>
						</div>
						<div style="margin-top: 15px;">
							<form id="delete_form" method="post" action="<?=BASEURL?>profile/del/">
							</form>
							<span>Completely delete profile and all related data.<br>
							<input id="delProfileBtn" class="btn ok_btn" type="button" value="Delete profile"></span>
						</div>
					</div>
<?php	if ($action == "changepass") {		?>
<script>onReady(showChangePasswordPopup);</script>
<?php	} else if ($action == "changename") {		?>
<script>onReady(showChangeNamePopup);</script>
<?php	}	?>
				</div>
			</div>
		</div>
	</div>
</div>

<div id="changename" style="display: none;">
<form method="post" action="<?=BASEURL?>profile/changename/">
	<div id="name-inp-block" class="validation-block view-row">
		<label for="newname">New name</label>
		<div class="stretch_input std_input"><input id="newname" name="name" type="text" value="<?=e($person_name)?>"></div>
		<div class="invalid-feedback">Please input correct name.<br>New name must be different from the old.</div>
	</div>
</form>
</div>

<div id="changepass" style="display: none;">
<form method="post" action="<?=BASEURL?>profile/changepass/">
	<div id="old-pwd-inp-block" class="validation-block view-row">
		<label for="oldpwd">Current password</label>
		<div class="stretch_input std_input"><input id="oldpwd" name="current" type="password"></div>
		<div class="invalid-feedback">Please input current password.</div>
	</div>

	<div id="new-pwd-inp-block" class="validation-block view-row">
		<label for="newpwd">New password</label>
		<div class="stretch_input std_input"><input id="newpwd" name="new" type="password"></div>
		<div class="invalid-feedback">Please input correct new password.<br>New password must be different from the old.</div>
	</div>
</form>
</div>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var p_name = <?=JSON::encode($person_name)?>;

	onReady(initProfilePage);
</script>
</body>
</html>
