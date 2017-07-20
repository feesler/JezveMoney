<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var p_name = <?=f_json_encode($person_name)?>;
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>User profile</h1>
					</div>

					<div class="profile_block">
						<h2>Account name</h2>
						<span><?=$user_login;?></span>
					</div>

					<div class="profile_block">
						<h2>User name</h2>
						<span id="namestatic"><?=$person_name?></span>
<?php	if ($action != "changename") {	?>
						<div><a href="<?=BASEURL?>profile/changename/" onclick="return showChangeNamePopup();">Change</a></div>
<?php	}	?>
					</div>

<?php	if ($action != "changepassword") {	?>
					<div class="profile_block">
						<h2>Security</h2>
						<div><a href="<?=BASEURL?>profile/changepass/" onclick="return showChangePasswordPopup();">Change password</a></div>
					</div>
<?php	}	?>

					<div class="profile_block">
						<h2>Reset data</h2>
						<div>
							<form id="resetacc_form" method="post" action="<?=BASEURL?>accounts/reset/">
							</form>
							<span>You also may reset all your accounts data.<br>
							<input class="btn ok_btn" type="button" onclick="showResetAccountsPopup();" value="Reset"></span>
						</div>
						<div style="margin-top: 15px;">
							<form id="resetall_form" method="post" action="<?=BASEURL?>profile/resetall/">
							</form>
							<span>You may also reset all your data and start from the scratch.<br>
							<input class="btn ok_btn" type="button" onclick="showResetAllPopup();" value="Reset all"></span>
						</div>
					</div>
<?php	if ($action == "changepass") {		?>
					<form method="post" action="<?=BASEURL?>profile/changepass/" onsubmit="return onChangePassSubmit(this);">
						<h2>Change password</h2>
						<div>
							<div class="non_float">
								<label for="oldpwd">Current password</label>
								<div class="stretch_input std_input"><input id="oldpwd" name="oldpwd" type="password"></div>
							</div>

							<div class="non_float">
								<label for="newpwd">New password</label>
								<div class="stretch_input std_input"><input id="newpwd" name="newpwd" type="password"></div>
							</div>

							<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="<?=BASEURL?>profile/">cancel</a></div>
						</div>
					</form>
<?php	} else if ($action == "changename") {		?>
					<form method="post" action="<?=BASEURL?>profile/changename/" onsubmit="return onChangeNameSubmit(this);">
					<h2>Change name</h2>
					<div>
						<div class="non_float">
							<label for="newname">New name</label>
							<div class="stretch_input std_input"><input id="newname" name="newname" type="text" value="<?=$person_name?>"></div>
						</div>

						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="<?=BASEURL?>profile/">cancel</a></div>
					</div>
					</form>
<?php	}	?>
				</div>
			</div>
		</div>
	</div>
</div>

<div id="changename" style="display: none;">
<form method="post" action="<?=BASEURL?>profile/changename/" onsubmit="return onChangeNameSubmit(this);">
	<div class="non_float">
		<label for="newname">New name</label>
		<div class="stretch_input std_input"><input id="newname" name="newname" type="text" value="<?=$person_name?>"></div>
	</div>
</form>
</div>

<div id="changepass" style="display: none;">
<form method="post" action="<?=BASEURL?>profile/changepass/" onsubmit="return onChangePassSubmit(this);">
	<div class="non_float">
		<label for="oldpwd">Current password</label>
		<div class="stretch_input std_input"><input id="oldpwd" name="oldpwd" type="password"></div>
	</div>

	<div class="non_float">
		<label for="newpwd">New password</label>
		<div class="stretch_input std_input"><input id="newpwd" name="newpwd" type="password"></div>
	</div>
</form>
</div>
</body>
</html>
