		<div class="header">
			<div class="centered">
				<div class="logo"><a href="<?=BASEURL?>"><span class="logo_img"></span><span>Jezve Money</span></a></div>
<?php	if ($this->user_id != 0) {		?>
				<div class="userblock">
					<button id="userbtn" class="user_button" type="button"><span class="user_icon"></span><span class="user_title"><?=e($this->user_name)?></span></button>
					<div id="menupopup" class="usermenu" style="display: none;">
						<ul>
<?php	if ($this->uMod->isAdmin($this->user_id)) {		?>
							<li><a href="<?=BASEURL?>admin/">admin panel</a></li>
							<li class="separator"></li>
<?php	}		?>
							<li><a href="<?=BASEURL?>profile/">profile</a></li>
							<li><a href="<?=BASEURL?>logout/">logout</a></li>
						</ul>
					</div>
				</div>
<?php	}	?>
			</div>
		</div>
<?php	Message::check();		?>
