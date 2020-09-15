<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Users</h2>

					<table id="users_tbl" class="admin-tbl">
						<thead>
							<tr><th>id</th><th>login</th><th>name</th><th>access</th><th>accounts</th><th>transactions</th><th>persons</th></tr>
						</thead>
						<tbody id="users_list">
<?php	foreach($uArr as $userInfo) {		?>
							<tr>
								<td><?=e($userInfo->id)?></td>
								<td><?=e($userInfo->login)?></td>
								<td><?=e($userInfo->name)?></td>
								<td><?=e($userInfo->access)?></td>
								<td><?=e($userInfo->accCount)?></td>
								<td><?=e($userInfo->trCount)?></td>
								<td><?=e($userInfo->pCount)?></td>
							</tr>
<?php	}	?>
						</tbody>
					</table>

					<div class="acc_controls">
						<input id="createbtn" class="adm_act_btn" type="button" value="new">
						<input id="updbtn" class="adm_act_btn hidden" type="button" value="update">
						<input id="passbtn" class="adm_act_btn hidden" type="button" value="set password">
						<input id="del_btn" class="adm_act_btn hidden" type="button" value="delete">
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<form id="user_frm" class="hidden" method="post">
<input id="user_id" name="id" type="hidden">
<div id="login_block" class="view-row">
	<label for="user_login">Login</label>
	<div class="stretch-input"><input id="user_login" name="login" type="text"></div>
</div>
<div id="name_block" class="view-row">
	<label for="user_name">Name</label>
	<div class="stretch-input"><input id="user_name" name="name" type="text"></div>
</div>
<div id="pwd_block" class="view-row">
	<label for="user_pass">Password</label>
	<div class="stretch-input"><input id="user_pass" name="password" type="password"></div>
</div>
<div id="admin_block" class="view-row">
	<div id="admin_block" class="checkbox-wrap">
		<label for="isadmin"><input id="isadmin" name="access" type="radio" value="1">Admin access level</label>
	</div>
	<div id="admin_block" class="checkbox-wrap">
		<label for="isdefault"><input id="isdefault" name="access" type="radio" value="0">Default access level</label>
	</div>
</div>
<div class="popup__form-controls">
	<input class="btn submit-btn" type="submit" value="Submit">
</div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
<script>
	var users = <?=JSON::encode($uArr)?>;

	onReady(initControls);
</script>
</body>
</html>
