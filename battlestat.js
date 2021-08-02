// Set button listerner
let button = document.getElementById("battleNow");
button.addEventListener("click", async () => {
	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
	chrome.scripting.executeScript({
	  target: { tabId: tab.id },
	  function: buttonAction,
	});
});

function buttonAction() {
	// Game defaults
	let weaponExtraPowerSet = {
		charAndWeaponSame: .002675,
		weaponAndPowerSame: .002575,
		default: .0025
	};
	let traitBonusSet = {
		charAndWeaponTrait: 0.075,
		greaterThanEnemy: 0.075,
		lessThanEnemy: 0.075,
		default: 0
	};
	let traitStrengthSet = {
		earth: 'lightning',
		lightning: 'water',
		water: 'fire',
		fire: 'eath'
	};
	let traitIconMap = {
		'earth-icon': 'earth',
		'lightning-icon': 'lightning',
		'water-icon': 'water',
		'fire-icon': 'fire'
	};
	let weaponTraitIconMap = {
		'str-icon': 'fire',
		'cha-icon': 'lightning',
		'int-icon': 'water',
		'dex-icon': 'earth'
	};

	// interface / Model
	let characterStatsModel = {
		trait: '',
		power: 0,
		level: 0
	};
	let weaponStatsModel = {
		id: 0,
		name: '',
		trait: '',
		stats: {},
		bonus: {}
	};
	let traitModel = {
		earth: '',
		lightning: '',
		water: '',
		fire: ''
	};
	let enemyStatsModel = {
		trait: '',
		power: 0,
		xp: 0
	};
	let enemiesStatsModel = [];

	function objSize(obj) {
		var size = 0,
		  key;
		for (key in obj) {
		  if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	  };

	function compareTrait(trait1, trait2) {
		comparison = '';
		if (traitStrengthSet[trait1] == trait2) {
			comparison = 'greater';
		} else if (traitStrengthSet[trait2] == trait1) {
			comparison = 'lesser';
		}

		return comparison;
	}

	function getTrait(traitIcon, map) {
		return map[traitIcon];
	}

	function getCharacterPower(level) {
		return ((1000 + (level * 10)) * (Math.floor(level / 10) + 1));
	}

	function getCharacter() {
		// Get Nature
		characterStatsModel['trait'] = getTrait(document.getElementsByClassName("trait-icon")[0].classList[0], traitIconMap);
		// Get Power
		characterStatsModel['power'] = parseFloat(document.getElementsByClassName("subtext-stats")[0].childNodes[5].textContent.replace(/,/g, ''));
		// Get Level
		characterStatsModel['level'] = parseFloat(document.getElementsByClassName("subtext-stats")[0].childNodes[2].textContent.replace(/\(.*?\)/gi, ''));

		return characterStatsModel;
	}

	function getWeapon() {
		// Get Weapon
		weaponArea = document.getElementsByClassName("weapon-icon-wrapper")[0].childNodes[0];
		// Get ID
		id = weaponArea.getElementsByClassName('id')[0].innerHTML;
		weaponStatsModel['id'] = parseFloat(id.replace('ID ', ''));
		// Get Name
		weaponStatsModel['name'] = weaponArea.getElementsByClassName('name')[0].innerHTML;
		// Get Trait
		weaponStatsModel['trait'] = getTrait(weaponArea.getElementsByClassName('trait')[0].childNodes[0].classList[0], traitIconMap);
		// Get Stats
		statsArea = weaponArea.getElementsByClassName('stats')[0];
		for (i=0; i < statsArea.childElementCount; i++) {	
			trait = getTrait(statsArea.childNodes[i].childNodes[0].classList[2], weaponTraitIconMap);
			power = statsArea.childNodes[i].childNodes[1].textContent.substring(5,8);
			weaponStatsModel['stats'][i] = {trait: trait, power: power};
		}
		// Bonus Power
		bonusArea = weaponArea.getElementsByClassName('bonus-power')[0];
		for (i=0; i < bonusArea.childElementCount; i++) {	
			bonus = bonusArea.childNodes[i].childNodes[0].textContent.substring(0,1);
			weaponStatsModel['bonus'][i] = {bonus: bonus};
		}

		return weaponStatsModel;
	}

	function getEnimies() {
		let htmlCollection = document.getElementsByClassName("enemy-list");
		let array = [].slice.call(htmlCollection)
		
		encountered = array[0].childNodes;
		for (let j = 0; j < encountered.length; j++) {
			enemyObj = {};
			// Get Nature
			trait = getTrait(encountered[j].getElementsByClassName("encounter-element")[0].childNodes[0].getAttribute("class"), traitIconMap);
			enemyObj['trait'] = trait;
			// Get Power
			power = encountered[j].getElementsByClassName("encounter-power")[0].innerHTML;
			enemyObj['power'] = parseFloat(power.replace(' Power', ''));
			// Get XP
			xp = encountered[j].getElementsByClassName("xp-gain")[0].innerHTML;
			enemyObj['xp'] = parseFloat(xp.replace('+', '').replace(' XP',''));

			enemiesStatsModel.push(enemyObj);
		}	

		return enemiesStatsModel;
	}

	function getTraitBonus(character, enemy, weapon) {
		traitBonus = 1;
		if (character.trait == weapon.trait) {
			traitBonus = traitBonus + (1 * traitBonusSet.charAndWeaponTrait);
		} 
		
		// Check weapon bonus base on enemy's traits
		if (compareTrait(character.trait, enemy.trait) == 'greater') {
			traitBonus = traitBonus + (1 * traitBonusSet.greaterThanEnemy);
		} else if (compareTrait(character.trait, enemy.trait) == 'lesser') {
			traitBonus = traitBonus + (-1 * traitBonusSet.lessThanEnemy);
		} else {
			traitBonus = traitBonus + traitBonusSet.default;
		}

		return traitBonus;
	}

	function getWeaponPower(character, weapon) {
		weaponPower = 1;
		console.log('stats');
		console.log(objSize(weapon.stats));
		for (i=0; i< objSize(weapon.stats); i++) {
			// Add on per weapon stats
			if (character.trait == weapon.trait) {
				//weaponPower = weaponPower + (weapon.stats[i].power * weaponExtraPowerSet.charAndWeaponSame)
			} 
			
			if (weapon.trait == weapon.stats[i].trait) {
				// TODO: Review this line if its - if-if or if-elseif
				weaponPower = weaponPower + (weapon.stats[i].power * weaponExtraPowerSet.weaponAndPowerSame)
			}else {
				weaponPower = weaponPower + (weapon.stats[i].power * weaponExtraPowerSet.default)
			}
		}

		return weaponPower;
	}

	function getCharacterTotalPower(characterPower, character, weapon, weaponPower, traitBonus) {
		// Weapon bonus
		weaponBonus = 0;
		console.log('bonus');
		console.log(objSize(weapon.bonus));
		if (objSize(weapon.bonus) > 1) {
			weaponBonus = parseInt(weapon.bonus[0].bonus);
		}
		// Base Character power * weapon power X weaponBonus
		heroPowerWithWeapon = (getCharacterPower(character.level) * weaponPower) + weaponBonus;
		// 10 percent chance to increse
		heroPowerWithPlus10Percent = heroPowerWithWeapon * traitBonus * 1.1;
		// 10 percent chance to decrease
		heroPowerWithMinus10Percent = heroPowerWithWeapon * traitBonus * .9;
		characterRange = heroPowerWithPlus10Percent - heroPowerWithMinus10Percent;
		// Create an object for function return
		characterPowerRange = {plus: heroPowerWithPlus10Percent, minus: heroPowerWithMinus10Percent, range: characterRange};

		return characterPowerRange;
	}

	function getEnemyTotalPower(enemyPower) {
		// Compute for +/- 10%
		enemyWithPlus10Percent = enemyPower.power * 1.1;
		enemyWithMinus10Percent = enemyPower.power * 0.9;
		enemyRange = enemyWithPlus10Percent - enemyWithMinus10Percent;

		// Range of probability
		enemyPowerRange = {plus: enemyWithPlus10Percent, minus: enemyWithMinus10Percent, range: enemyRange};

		return enemyPowerRange;
	}

	function battle(characterPower, enemyPower) {
		let win = 0;
		let lose = 0;
		for (let playerRoll = Math.floor(characterPower.minus); playerRoll <= characterPower.plus; playerRoll++) {
		for (let enemyRoll = Math.floor(enemyPower.minus); enemyRoll <= enemyPower.plus; enemyRoll++) {
			if (playerRoll >= enemyRoll) {
			win++;
			} else {
			lose++;
			}
		}
		}

		return win / (win + lose);
	}

	function addParentDiv(count, stats) {
		className = 'dinnoParentDiv';
		parentDiv = document.getElementsByClassName(className);

		if (parentDiv.length == 0) {
			const div = document.createElement('div');
			div.style.display = 'flex';
			div.style.paddingTop = '5%';
			div.className = className;
			document.getElementsByClassName('enemy-container')[0].appendChild(div);
		}
	}

	function addChildDiv(count, stats) {
		const div = document.createElement('div');
		div.style.width = '25%';
		div.style.padding = '0';
		div.style.margin = '0';
		div.style.position = 'relative';
		div.style.textAlign = 'center';
		div.style.alignItems = 'center';
		div.style.fontSize = '26pt';

		div.className = 'dinnoChildDiv';
		div.innerHTML = stats.toFixed(2) + '%';
	
		document.getElementsByClassName('dinnoParentDiv')[0].appendChild(div);
	}
	
	function removeChildDiv() {
		parentDiv = document.getElementsByClassName('dinnoParentDiv');
		if (parentDiv.length > 0) {
			for (i=parentDiv[0].childElementCount;i>0;i--) {
				console.log(i);
				document.getElementsByClassName('dinnoParentDiv')[0].removeChild(document.getElementsByClassName('dinnoParentDiv')[0].childNodes[i-1]);
			}
		}
	}


	// Remove previous HTML
	removeChildDiv();
	addParentDiv();

	// Get Character Stats
	let character = getCharacter();

	// Get Weapon Stats
	let weapon = getWeapon();

	// Get Enemy Stats
	let enemies = getEnimies();

	// BATTLE Probalities
	for (x=0; x<enemies.length; x++) {
		console.log('Enemy Number: ' + (x+1));
		weaponPower = getWeaponPower(character, weapon);
		traitBonus = getTraitBonus(character, enemies[x], weapon);
		characterTotalPower = getCharacterTotalPower(character.power, character, weapon, weaponPower, traitBonus);
		enemyTotalPower = getEnemyTotalPower(enemies[x]);
		battleProbability = battle(characterTotalPower, enemyTotalPower, x);
		addChildDiv(x, (battleProbability*100));
	}
}
