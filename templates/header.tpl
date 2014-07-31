		<div class="header">
			<div class="centered">
				<div class="logo"><a href="./index.php"><span>Jezve Money</span></a></div>
<?php	if ($user_id != 0) {		?>
				<div class="userblock">
					<button id="userbtn" class="user_button" type="button" onclick="onUserClick()"><span class="user_icon"></span><span class="user_title"><?=$user_name?></span></button>
					<div id="menupopup" class="usermenu" style="display: none;">
						<ul>
							<li><a href="./profile.php">profile</a></li>
							<li><a href="./modules/user.php?act=logout">logout</a></li>
						</ul>
					</div>
				</div>
<?php	}	?>
			</div>
		</div>
<?php	checkMessage();		?>
