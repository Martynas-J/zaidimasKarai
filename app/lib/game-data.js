// Pastatų duomenys - server-side
export const buildingsData = {
  main: { name: "Rotušė", icon: "🏛️", maxLevel: 20, desc: "+10 gyventojų vietos" },
  warehouse: { name: "Sandėlys", icon: "🏚️", maxLevel: 10, desc: "+1000 resursų vietos" },
  barracks: { name: "Kareivinės", icon: "⚔️", maxLevel: 10, desc: "Leidžia kurti pėstininkus" },
  stable: { name: "Arklidės", icon: "🐎", maxLevel: 5, desc: "Leidžia kurti raitelius" },
  academy: { name: "Akademija", icon: "📚", maxLevel: 5, desc: "+XP kas 10s" },
  farm: { name: "Kluonas", icon: "🌾", maxLevel: 10, desc: "+3 crop/s" },
  lumber: { name: "Miškas", icon: "🪵", maxLevel: 10, desc: "+2 wood/s" },
  clay: { name: "Grybų", icon: "🍄", maxLevel: 10, desc: "+2 clay/s" },
  iron: { name: "Geležies", icon: "⛏️", maxLevel: 10, desc: "+2 iron/s" },
  wall: { name: "Siena", icon: "🧱", maxLevel: 10, desc: "+20% mūšio bonusas" },
  temple: { name: "Šventykla", icon: "⛩️", maxLevel: 5, desc: "+10% resursų bonusas" },
  market: { name: "Turgus", icon: "🏪", maxLevel: 5, desc: "Leidžia prekiauti" },
};

// Karinio vieneto duomenys
export const unitsData = {
  legionary: { name: "Legionierius", icon: "⚔️", cost: {wood:50,clay:50,iron:30,crop:20}, attack:40, defense:50, speed:6 },
  eques: { name: "Raitelis", icon: "🐎", cost: {wood:100,clay:100,iron:40,crop:60}, attack:130, defense:40, speed:10 },
  archer: { name: "Lankininkas", icon: "🏹", cost: {wood:75,clay:25,iron:50,crop:10}, attack:70, defense:30, speed:8 },
  hero: { name: "Herojus", icon: "👑", cost: {wood:500,clay:500,iron:500,crop:500}, attack:200, defense:200, speed:12 }
};

// Statybos kaštai
export const buildingCosts = {
  main: [{w:100,c:100,i:100,cp:100},{w:150,c:150,i:150,cp:150},{w:250,c:250,i:250,cp:250},{w:400,c:400,i:400,cp:400},{w:600,c:600,i:600,cp:600}],
  farm: [{w:50,c:50,i:0,cp:10},{w:100,c:100,i:0,cp:20},{w:200,c:200,i:0,cp:30},{w:350,c:350,i:0,cp:50},{w:550,c:550,i:0,cp:80}],
  lumber: [{w:50,c:100,i:50,cp:25},{w:100,c:150,i:100,cp:50},{w:200,c:250,i:200,cp:75},{w:350,c:400,i:350,cp:125},{w:550,c:600,i:550,cp:200}],
  clay: [{w:100,c:50,i:50,cp:25},{w:150,c:100,i:100,cp:50},{w:250,c:200,i:200,cp:75},{w:400,c:350,i:350,cp:125},{w:600,c:550,i:550,cp:200}],
  iron: [{w:100,c:50,i:50,cp:25},{w:150,c:100,i:100,cp:50},{w:250,c:200,i:200,cp:75},{w:400,c:350,i:350,cp:125},{w:600,c:550,i:550,cp:200}],
  warehouse: [{w:150,c:100,i:0,cp:50},{w:250,c:200,i:0,cp:100},{w:400,c:300,i:0,cp:150}],
  barracks: [{w:200,c:50,i:150,cp:50},{w:350,c:100,i:250,cp:100},{w:550,c:150,i:400,cp:150}],
  stable: [{w:250,c:100,i:200,cp:100},{w:400,c:200,i:350,cp:200},{w:650,c:300,i:550,cp:300}],
  academy: [{w:400,c:200,i:400,cp:200},{w:600,c:400,i:600,cp:400},{w:1000,c:600,i:1000,cp:600}],
  wall: [{w:50,c:100,i:50,cp:20},{w:100,c:200,i:100,cp:40},{w:200,c:350,i:200,cp:80}],
  temple: [{w:300,c:200,i:300,cp:100},{w:500,c:400,i:500,cp:200}],
  market: [{w:100,c:150,i:0,cp:50},{w:200,c:250,i:0,cp:100}]
};

// Statybos laikas (sekundėmis)
export const buildingTimes = {
  main: 60,
  farm: 30,
  lumber: 20,
  clay: 20,
  iron: 20,
  warehouse: 40,
  barracks: 50,
  stable: 60,
  academy: 80,
  wall: 45,
  temple: 70,
  market: 35
};

export function getBuildingCost(key, level) {
  const costs = buildingCosts[key] || buildingCosts.main;
  return costs[Math.min(level, costs.length - 1)] || {w:0,c:0,i:0,cp:0};
}

export function getBuildingTime(key, level) {
  const baseTime = buildingTimes[key] || 30;
  return baseTime * (1 + level * 0.5);
}

export function canAfford(costs, resources) {
  return resources.wood >= (costs.w || 0) &&
         resources.clay >= (costs.c || 0) &&
         resources.iron >= (costs.i || 0) &&
         resources.crop >= (costs.cp || 0);
}

export function getProductionRate(buildings, templeBonus = 1, eventBonus = 1) {
  const lumber = buildings.lumber || 0;
  const clay = buildings.clay || 0;
  const iron = buildings.iron || 0;
  const farm = buildings.farm || 0;
  
  return {
    wood: lumber * 2 * templeBonus * eventBonus,
    clay: clay * 2 * templeBonus * eventBonus,
    iron: iron * 2 * templeBonus * eventBonus,
    crop: farm * 3 * templeBonus * eventBonus
  };
}

export function getMaxResources(warehouseLevel) {
  return 1000 + warehouseLevel * 1000;
}

export function getWallBonus(wallLevel) {
  return 1 + wallLevel * 0.2;
}
