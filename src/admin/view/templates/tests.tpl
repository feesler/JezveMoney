<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>
        <div class="container">
            <div class="content">
                <div class="admin_cont_wrap tests-content">
                    <div class="results">
                        <div class="controls">
                            <input id="startbtn" class="adm_act_btn" type="button" value="start">
                            <table class="admin-tbl counter-tbl">
                                <tr>
                                    <th class="title">Total</th><th id="totalRes"></th>
                                    <th class="title">Ok</th><th id="okRes"></th>
                                    <th class="title">Fail</th><th id="failRes"></th>
                                    <th id="durationRes" class="duration"></th>
                                </tr>
                            </table>
                            <input id="toggleresbtn" class="adm_act_btn toggle-res-btn" type="button" value="Show">
                        </div>
                        <div class="results-container"><table><tbody id="restbl"></tbody></table></div>
                    </div>
                    <div class="test-view"><iframe id="viewframe" src="<?=BASEURL?>"></iframe></div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
</body>
</html>
