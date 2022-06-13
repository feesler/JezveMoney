<?php   include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container centered">
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
<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
