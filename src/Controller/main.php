<?php

class MainController extends Controller
{
	public function index()
	{
		global $user_name, $user_id, $uMod;

		$accMod = new AccountModel($user_id);
		$transMod = new TransactionModel($user_id);
		$persMod = new PersonModel($user_id);
		$currMod = new CurrencyModel();

		$currArr = $currMod->getData();
		$accArr = $accMod->getData();

		$tilesArr = $accMod->getTilesArray();
		$totalsArr = $accMod->getTotalsArray();
		foreach($totalsArr as $curr_id => $balance)
		{
			$currObj = $currMod->getItem($curr_id);
			if (!$currObj)
				throw new Error('Wrong currency id: '.$curr_id);

			$balfmt = $currMod->format($balance, $curr_id);

			$totalsArr[$curr_id] = ["bal" => $balance, "balfmt" => $balfmt, "name" => $currObj->name];
		}

		// Prepare data of transaction list items
		$latestArr = $transMod->getData([ "desc" => TRUE, "onPage" => 5 ]);
		$trListData = [];
		foreach($latestArr as $trans)
		{
			$itemData = ["id" => $trans->id];

			// Build accounts string
			$accStr = "";
			if ($trans->src_id != 0)
			{
				if ($trans->type == EXPENSE || $trans->type == TRANSFER)
				{
					$accObj = $accMod->getItem($trans->src_id);
					if (!$accObj)
						throw new Error("Invalid source account id: ".$trans->src_id);
					$accStr .= $accObj->name;
				}
				else if ($trans->type == DEBT)
					$accStr .= $accMod->getNameOrPerson($trans->src_id);
			}

			if ($trans->src_id != 0 && $trans->dest_id != 0 && ($trans->type == TRANSFER || $trans->type == DEBT))
				$accStr .= " → ";

			if ($trans->dest_id != 0)
			{
				if ($trans->type == INCOME || $trans->type == TRANSFER)
				{
					$accObj = $accMod->getItem($trans->dest_id);
					if (!$accObj)
						throw new Error("Invalid destination account id: ".$trans->dest_id);
					$accStr .= $accObj->name;
				}
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

		$persArr = $persMod->getData();
		foreach($persArr as $ind => $pData)
		{
			$noDebts = TRUE;
			$pBalance = [];
			if (isset($pData->accounts) && is_array($pData->accounts))
			{
				foreach($pData->accounts as $pAcc)
				{
					if ($pAcc->balance != 0.0)
					{
						$noDebts = FALSE;
						$pBalance[] = $currMod->format($pAcc->balance, $pAcc->curr_id);
					}
				}
			}

			$persArr[$ind]->nodebts = $noDebts;
			$persArr[$ind]->balfmt = $pBalance;
		}


		$byCurrency = TRUE;
		$curr_acc_id = $currMod->getIdByPos(0);
		if (!$curr_acc_id)
			throw new Error("No currencies found");

		$groupType_id = 2;		// group by week

		$statArr = getStatArray($user_id, $byCurrency, $curr_acc_id, EXPENSE, $groupType_id, 5);

		$titleString = "Jezve Money";

		array_push($this->css->libs, "iconlink.css", "tiles.css", "trlist.css", "charts.css");
		$this->buildCSS();
		array_push($this->jsArr, "main.js", "lib/raphael.min.js", "charts.js");

		include("./view/templates/main.tpl");
	}
}