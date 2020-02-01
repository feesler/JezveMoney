<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var p_name = <?=JSON::encode($person_name)?>;

	onReady(initProfilePage);
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
						<div><a id="changeNameBtn" href="<?=BASEURL?>profile/changename/">Change</a></div>
					</div>

					<div class="profile_block">
						<h2>Security</h2>
						<div><a id="changePassBtn" href="<?=BASEURL?>profile/changepass/">Change password</a></div>
					</div>

					<div class="profile_block">
						<h2>Reset data</h2>
						<div>
							<form id="resetacc_form" method="post" action="<?=BASEURL?>accounts/reset/">
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
	<div class="non_float">
		<label for="newname">New name</label>
		<div class="stretch_input std_input"><input id="newname" name="newname" type="text" value="<?=$person_name?>"></div>
	</div>
</form>
</div>

<div id="changepass" style="display: none;">
<form method="post" action="<?=BASEURL?>profile/changepass/">
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
