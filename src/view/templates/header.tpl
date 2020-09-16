		<div class="header">
			<div class="centered">
				<div class="logo"><a href="<?=BASEURL?>"><span class="logo_icon"><?=svgIcon("header_logo")?></span><span>Jezve Money</span></a></div>
				<div class="theme-switch">
					<label class="switch">
<?php	if ($this->userTheme == DARK_THEME) {	?>
						<input id="theme-check" type="checkbox" checked>
<?php	} else {	?>
						<input id="theme-check" type="checkbox">
<?php	}	?>
						<div class="switch-slider"></div>
					</label>
				</div>
<?php	if ($this->user_id != 0) {		?>
				<div class="user-block">
					<button id="userbtn" class="user-menu-btn" type="button"><span class="user_icon"><?=svgIcon("user")?></span><span class="user_title"><?=e($this->user_name)?></span></button>
					<div id="menupopup" class="user-menu hidden">
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
