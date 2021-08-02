// Game defaults
let weaponExtraPowerSet = {
	charAndWeaponSame: .002675,
	weaponAndPowerSame: .002575,
	dafault: .0025
};
let traitBonusSet = {
	charAndWeaponTrait: 0.075,
	greaterThanEnemy: 0.075,
	lessThanEnemy: - 0.075,
	dafault: 0
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
	power: 0
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

function getCharacter() {
	// Get Nature
	characterStatsModel['trait'] = getTrait(document.getElementsByClassName("trait-icon")[0].classList[0], traitIconMap);
	// Get Power
	characterStatsModel['power'] = parseFloat(document.getElementsByClassName("subtext-stats")[0].childNodes[5].textContent.replace(/,/g, ''));

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
	traitBonus = 0;
	if (character.trait == weapon.trait) {
		traitBonus = traitBonusSet.charAndWeaponTrait;
	} 
	
	// Check weapon bonus base on enemy's traits
	if (compareTrait(character.trait, enemy.trait) == 'greater') {
		traitBonus = traitBonusSet.greaterThanEnemy;
	} else if (compareTrait(character.trait, enemy.trait) == 'lesser') {
		traitBonus = traitBonusSet.lessThanEnemy;
	} else {
		traitBonus = traitBonusSet.dafault;
	}

	return traitBonus;
}

function getWeaponPower(character, weapon) {
	weaponPower = 0;
	for (i=0; i< _.size(weapon.stats); i++) {
		// Add on per weapon stats
		if (character.trait == weapon.trait) {
			weaponPower = weaponPower + (weapon.stats[i].power * weaponExtraPowerSet.charAndWeaponSame)
		} 
		
		if (weapon.trait == weapon.stats[i].trait) {
			// TODO: Review this line if its - if-if or if-elseif
			weaponPower = weaponPower + (weapon.stats[i].power * weaponExtraPowerSet.weaponAndPowerSame)
		}else {
			weaponPower = weaponPower + (weapon.stats[i].power * weaponExtraPowerSet.dafault)
		}
	}

	return (weaponPower + 1);
}

function getCharacterTotalPower(characterPower, weapon, weaponPower, traitBonus) {
	// Weapon bonus
	weaponBonus = 0;
	if (_.size(weapon.bonus) > 1) {
		weaponBonus = parseInt(weapon.bonus[0].bonus);
	}
	// Base Character power * weapon power X weaponBonus
	heroPowerWithWeapon = (characterPower * weaponPower)+weaponBonus;
	// 10 percent chance to increse
	heroPowerWithPlus10Percent = heroPowerWithWeapon + (heroPowerWithWeapon * .1);
	// 10 percent chance to decrease
	heroPowerWithMinus10Percent = heroPowerWithWeapon - (heroPowerWithWeapon * .1);
	// Add weaponBonus
	heroPowerWithPlus10Percent = heroPowerWithPlus10Percent * (1 + traitBonus);
	heroPowerWithMinus10Percent = heroPowerWithMinus10Percent * (1 + traitBonus);
	// Create an object for function return
	characterPowerRange = {plus: heroPowerWithPlus10Percent, minus: heroPowerWithMinus10Percent};

	return characterPowerRange;
}

function getEnemyTotalPower(enemyPower) {
	// Compute for +/- 10%
	enemyWithPlus10Percent = enemyPower.power + (enemyPower.power * .1);
	enemyWithMinus10Percent = enemyPower.power - (enemyPower.power * .1);

	// Range of probability
	enemyPowerRange = {plus: enemyWithPlus10Percent, minus: enemyWithMinus10Percent};

	return enemyPowerRange;
}

function battle(characterPower, enemyPower) {
	// Get range from worst to best probability
	percentage = 0;
	
	// Worst probability - enemy has +10% while you have -10%
	console.log('Worst Case: You' + characterPower.minus + ' vs Enemy' + enemyPower.plus);
	worstCase = {enemy: enemyPower.minus, character: characterPower.plus};
	worstCase = characterPower.minus - enemyPower.plus;
	console.log(worstCase);
	if (worstCase > 0) {
		// 100% of winning
		percentage = 100;
	} else {
		percentage = (worstCase / characterPower.minus);
	}
	console.log(percentage);

	// Best probability - enemy has +10% while you have -10%
	bestCase = {enemy: enemyPower.plus, character: characterPower.minus}
	console.log('Best Case: ' + characterPower.plus + ' vs ' + enemyPower.minus);

	return {
		bestCase: bestCase,
		worstCase: worstCase
	};
}

function addDiv(count, stats) {
	const div = document.createElement('div');
  
	div.className = 'dinnoDiv';
  
	div.innerHTML = `
		Worst Case: This is a test 
		Best Case:  This is a test
	`;
  
	document.getElementsByClassName('combat-enemy-container')[0].appendChild(div);
}
  
function removeRow(input) {
	document.getElementsByClassName('combat-enemy-container')[0].removeChild(input.parentNode);
}

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
	characterTotalPower = getCharacterTotalPower(character.power, weapon, weaponPower, traitBonus);
	enemyTotalPower = getEnemyTotalPower(enemies[x]);
	battleProbability = battle(characterTotalPower, enemyTotalPower, x);
	addDiv(x, battleProbability);
}