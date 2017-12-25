<?php

class MainController extends Controller
{
	public function index()
	{
		global $user_name, $user_id;

		$accMod = new AccountModel($user_id);
		$transMod = new TransactionModel($user_id);
		$persMod = new PersonModel($user_id);

		$currArr = CurrencyModel::getArray();

		$tilesArr = $accMod->getTilesArray();
		$totalsArr = $accMod->getTotalsArray();
		foreach($totalsArr as $curr_id => $balance)
		{
			$balfmt = CurrencyModel::format($balance, $curr_id);
			$currName = CurrencyModel::getName($curr_id);

			$totalsArr[$curr_id] = array("bal" => $balance, "balfmt" => $balfmt, "name" => $currName);
		}

		// Prepare data of transaction list items
		$tr_count = 5;
		$latestArr = $transMod->getArray(0, 0, TRUE, $tr_count);
		$trListData = array();
		foreach($latestArr as $trans)
		{
			$itemData = array("id" => $trans->id);

			// Build accounts string
			$accStr = "";
			if ($trans->src_id != 0)
			{
				if ($trans->type == EXPENSE || $trans->type == TRANSFER)
					$accStr .= $accMod->getName($trans->src_id);
				else if ($trans->type == DEBT)
					$accStr .= $accMod->getNameOrPerson($trans->src_id);
			}

			if ($trans->src_id != 0 && $trans->dest_id != 0 && ($trans->type == TRANSFER || $trans->type == DEBT))
				$accStr .= " → ";

			if ($trans->dest_id != 0)
			{
				if ($trans->type == INCOME || $trans->type == TRANSFER)
					$accStr .= $accMod->getName($trans->dest_id);
				else if ($trans->type == DEBT)
					$accStr .= $accMod->getNameOrPerson($trans->dest_id);
			}

			$itemData["acc"] = $accStr;

			// Build amount string
			$amStr = $trans->fsrcAmount;
			if ($trans->fsrcAmount != $trans->fdestAmount)
				$amStr .= " (".$trans->fdestAmount.")";
			$itemData["amount"] = $amStr;

			$itemData["date"] = $trans->date;
			$itemData["comm"] = $trans->comment;

			$trListData[] = $itemData;
		}

		$persArr = $persMod->getArray();
		foreach($persArr as $ind => $pData)
		{
			$noDebts = TRUE;
			$pBalance = array();
			if (isset($pData->accounts) && is_array($pData->accounts))
			{
				foreach($pData->accounts as $pAcc)
				{
					if ($pAcc->balance != 0.0)
					{
						$noDebts = FALSE;
						$pBalance[] = CurrencyModel::format($pAcc->balance, $pAcc->curr_id);
					}
				}
			}

			$persArr[$ind]->nodebts = $noDebts;
			$persArr[$ind]->balfmt = $pBalance;
		}


		$byCurrency = TRUE;
		$curr_acc_id = CurrencyModel::getIdByPos(0);
		if (!$curr_acc_id)
			fail();
		$groupType_id = 2;		// group by week

		$statArr = getStatArray($user_id, $byCurrency, $curr_acc_id, EXPENSE, $groupType_id, 5);

		$titleString = "Jezve Money";

		array_push($this->css->libs, "iconlink.css", "tiles.css", "trlist.css", "charts.css");
		$this->buildCSS();
		array_push($this->jsArr, "main.js", "raphael.min.js", "charts.js");

		include("./view/templates/main.tpl");
	}
}