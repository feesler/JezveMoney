<?php   include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");		?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>About</h1>
                    </div>
                    <div>
                        <div>JezveMoney, 2012-<?=e($year)?></div>
                        <div>Version: <?=e($version)?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(TPL_PATH . "Icons.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
