<div class="header">
    <div class="header__content">
        <a class="header-logo" href="<?=BASEURL?>admin/">
            <span class="header-logo__icon"><?=svgIcon("header_logo")?></span>
            <span class="header-logo__title">Admin</span>
        </a>
        <button class="nav-toggle-btn"><?=svgIcon("menu", "nav-toggle-icon")?></button>

        <div class="user-block right-align">
            <button id="userbtn" class="user-menu-btn" type="button">
                <span class="user__icon"><?=svgIcon("user")?></span>
                <span class="user__title"><?=e($this->user_name)?></span>
            </button>
            <div id="menupopup" class="user-menu" hidden>
                <ul>
                    <li><a href="<?=BASEURL?>">Index</a></li>
                    <li class="separator"></li>
                    <li><a href="<?=BASEURL?>admin/dbinstall/">DB update</a></li>
                    <li><a href="<?=BASEURL?>admin/currency/">Currencies</a></li>
                    <li><a href="<?=BASEURL?>admin/icon/">Icons</a></li>
                    <li><a href="<?=BASEURL?>admin/query/">Queries</a></li>
                    <li><a href="<?=BASEURL?>admin/log/">Logs</a></li>
                    <li><a href="<?=BASEURL?>admin/balance/">Balance</a></li>
                    <li><a href="<?=BASEURL?>admin/tests/">Tests</a></li>
                    <li><a href="<?=BASEURL?>admin/apiconsole/">API console</a></li>
                    <li><a href="<?=BASEURL?>admin/user/">Users</a></li>
                </ul>
            </div>
        </div>
    </div>
</div>
