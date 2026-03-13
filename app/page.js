'use client';

import { useState, useEffect, useCallback } from 'react';

// Žaidimo duomenys
const buildingsData = {
  main: { name: "Rotušė", icon: "🏛️", maxLevel: 20 },
  warehouse: { name: "Sandėlys", icon: "🏚️", maxLevel: 10 },
  barracks: { name: "Kareivinės", icon: "⚔️", maxLevel: 10 },
  stable: { name: "Arklidės", icon: "🐎", maxLevel: 5 },
  academy: { name: "Akademija", icon: "📚", maxLevel: 5 },
  farm: { name: "Kluonas", icon: "🌾", maxLevel: 10 },
  lumber: { name: "Miškas", icon: "🪵", maxLevel: 10 },
  clay: { name: "Grybų", icon: "🍄", maxLevel: 10 },
  iron: { name: "Geležies", icon: "⛏️", maxLevel: 10 },
  wall: { name: "Siena", icon: "🧱", maxLevel: 10 },
  temple: { name: "Šventykla", icon: "⛩️", maxLevel: 5 },
  market: { name: "Turgus", icon: "🏪", maxLevel: 5 },
};

const unitsData = {
  legionary: { name: "Legionierius", icon: "⚔️", cost: {wood:50,clay:50,iron:30,crop:20}, attack:40, defense:50, speed:6 },
  eques: { name: "Raitelis", icon: "🐎", cost: {wood:100,clay:100,iron:40,crop:60}, attack:130, defense:40, speed:10 },
  archer: { name: "Lankininkas", icon: "🏹", cost: {wood:75,clay:25,iron:50,crop:10}, attack:70, defense:30, speed:8 },
  hero: { name: "Herojus", icon: "👑", cost: {wood:500,clay:500,iron:500,crop:500}, attack:200, defense:200, speed:12 }
};

function getBuildingCost(key, level) {
  const baseCosts = {
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
  const costs = baseCosts[key] || baseCosts.main;
  return costs[Math.min(level, costs.length - 1)] || {w:0,c:0,i:0,cp:0};
}

function canAfford(costs, resources) {
  return resources.wood >= (costs.w || 0) &&
         resources.clay >= (costs.c || 0) &&
         resources.iron >= (costs.i || 0) &&
         resources.crop >= (costs.cp || 0);
}

export default function ImperijaGame() {
  const [activeTab, setActiveTab] = useState('buildings');
  const [notification, setNotification] = useState(null);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [activeTab2, setActiveTab2] = useState('buildings');
  
  const [resources, setResources] = useState({ wood: 500, clay: 500, iron: 500, crop: 500 });
  const [population, setPopulation] = useState(10);
  const [maxPopulation, setMaxPopulation] = useState(100);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(100);
  
  const [buildings, setBuildings] = useState({
    main: 1, farm: 1, lumber: 1, clay: 1, iron: 1, warehouse: 1,
    barracks: 0, stable: 0, wall: 0, academy: 0, temple: 0, market: 0
  });
  
  const [units, setUnits] = useState({ legionary: 0, eques: 0, archer: 0, hero: 0 });
  const [quests, setQuests] = useState({ quest1: false, quest2: false, quest3: false });
  const [reports, setReports] = useState(['• Sveikas atvykęs į Imperiją!']);
  const [battleReports, setBattleReports] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [achievements, setAchievements] = useState({ firstUnit: false, builder: false, ruler: false });
  
  const [eventActive, setEventActive] = useState(false);

  // Resursų generatorius
  useEffect(() => {
    const interval = setInterval(() => {
      const lumber = buildings.lumber || 0;
      const clay = buildings.clay || 0;
      const iron = buildings.iron || 0;
      const farm = buildings.farm || 0;
      
      const eventBonus = eventActive ? 2 : 1;
      
      setResources(prev => ({
        wood: prev.wood + lumber * 2 * eventBonus,
        clay: prev.clay + clay * 2 * eventBonus,
        iron: prev.iron + iron * 2 * eventBonus,
        crop: prev.crop + farm * 3 * eventBonus
      }));
      
      // Gyventojų išlaikymas
      const unitUpkeep = units.legionary * 1 + units.eques * 2 + units.archer * 1 + units.hero * 5;
      if(unitUpkeep > 0) {
        setResources(prev => ({
          ...prev,
          crop: Math.max(0, prev.crop - unitUpkeep)
        }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [buildings, units, eventActive]);

  // Renginys
  useEffect(() => {
    if(Math.random() > 0.7) {
      setEventActive(true);
    }
  }, []);

  const showNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const addReport = (text) => {
    setReports(prev => [`• ${text}`, ...prev.slice(0, 19)]);
  };

  const upgradeBuilding = (key) => {
    const data = buildingsData[key];
    const level = buildings[key] || 0;
    const costs = getBuildingCost(key, level);
    
    if(!canAfford(costs, resources)) {
      showNotification(' Nepakanka resursų!');
      return;
    }
    
    setResources(prev => ({
      wood: prev.wood - (costs.w || 0),
      clay: prev.clay - (costs.c || 0),
      iron: prev.iron - (costs.i || 0),
      crop: prev.crop - (costs.cp || 0)
    }));
    
    setBuildings(prev => ({ ...prev, [key]: level + 1 }));
    setXp(prev => prev + 10 * (level + 1));
    setMaxPopulation(prev => prev + 10);
    setPopulation(prev => prev + 5);
    
    if(key === 'farm' && level === 0) {
      setQuests(prev => ({ ...prev, quest1: true }));
      setXp(prev => prev + 50);
      setResources(prev => ({ ...prev, crop: prev.crop + 100 }));
    }
    
    if(level + 1 >= 3) {
      setQuests(prev => ({ ...prev, quest3: true }));
      setXp(prev => prev + 200);
    }
    
    setAchievements(prev => ({ ...prev, builder: true }));
    addReport(`Pastatytas ${data.name} ${level + 1} lygio!`);
  };

  const trainUnit = (type) => {
    const unit = unitsData[type];
    const costs = unit.cost;
    
    if(!canAfford(costs, resources)) {
      showNotification(' Nepakanka resursų!');
      return;
    }
    
    if(population >= maxPopulation) {
      showNotification(' Per daug gyventojų!');
      return;
    }
    
    setResources(prev => ({
      wood: prev.wood - costs.wood,
      clay: prev.clay - costs.clay,
      iron: prev.iron - costs.iron,
      crop: prev.crop - costs.crop
    }));
    
    setUnits(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setPopulation(prev => prev + 1);
    
    if(type === 'legionary' && (units.legionary + 1) >= 5) {
      setQuests(prev => ({ ...prev, quest2: true }));
      setXp(prev => prev + 100);
      setResources(prev => ({ ...prev, crop: prev.crop + 200 }));
    }
    
    setAchievements(prev => ({ ...prev, firstUnit: true }));
    addReport(`Paruoštas ${unit.name}!`);
  };

  const doTrade = () => {
    const amount = parseInt(document.getElementById('trade-wood')?.value) || 100;
    const toResource = document.getElementById('trade-to')?.value || 'clay';
    
    if(amount <= 0 || amount > resources.wood) {
      showNotification(' Neteisingas kiekis!');
      return;
    }
    
    setResources(prev => {
      const newRes = { ...prev, wood: prev.wood - amount };
      if(toResource === 'clay') newRes.clay += amount;
      else if(toResource === 'iron') newRes.iron += amount;
      else newRes.crop += amount;
      return newRes;
    });
    
    const toNames = { clay: 'molio', iron: 'geležies', crop: 'kviečių' };
    setTradeHistory(prev => [`Mainyta ${amount} medienos į ${toNames[toResource]}`, ...prev.slice(0, 4)]);
    showNotification(' Prekyba sėkminga!');
  };

  const doAttack = () => {
    const legionary = parseInt(document.getElementById('attack-legionary')?.value) || 0;
    const eques = parseInt(document.getElementById('attack-eques')?.value) || 0;
    const archer = parseInt(document.getElementById('attack-archer')?.value) || 0;
    
    if(legionary > units.legionary || eques > units.eques || archer > units.archer) {
      showNotification(' Neturite tiek karių!');
      return;
    }
    
    if(legionary + eques + archer === 0) {
      showNotification(' Pasirinkite bent vieną karį!');
      return;
    }
    
    setUnits(prev => ({
      legionary: prev.legionary - legionary,
      eques: prev.eques - eques,
      archer: prev.archer - archer,
      hero: prev.hero
    }));
    
    const playerAttack = legionary * 40 + eques * 130 + archer * 70;
    const enemyDefense = Math.floor(Math.random() * 300) + 100;
    const win = playerAttack > enemyDefense;
    
    if(win) {
      const reward = Math.floor(Math.random() * 200) + 50;
      setResources(prev => ({
        ...prev,
        wood: prev.wood + reward,
        crop: prev.crop + reward
      }));
      setAchievements(prev => ({ ...prev, ruler: true }));
      addReport(` Mūšis laimėtas! Prizas: +${reward} resursų`);
    } else {
      addReport(` Mūšis pralaimėtas!`);
    }
    
    setBattleReports(prev => [{
      win,
      units: { legionary, eques, archer },
      enemy: enemyDefense,
      player: playerAttack
    }, ...prev.slice(0, 4)]);
    
    setShowAttackModal(false);
    showNotification(win ? ' Mūšis laimėtas!' : ' Mūšis pralaimėtas!');
  };

  const claimDailyReward = () => {
    setResources(prev => ({
      wood: prev.wood + 500,
      clay: prev.clay + 500,
      iron: prev.iron + 500,
      crop: prev.crop + 500
    }));
    setShowDailyReward(false);
    showNotification(' Dienos premija gauta! +500 visko');
  };

  const saveGame = () => {
    const saveData = {
      resources, population, maxPopulation, level, xp, xpNeeded,
      buildings, units, quests, achievements, battleReports, tradeHistory
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imperija-save.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification(' Žaidimas išsaugotas!');
  };

  const loadGame = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const saveData = JSON.parse(event.target.result);
            setResources(saveData.resources);
            setPopulation(saveData.population);
            setMaxPopulation(saveData.maxPopulation);
            setLevel(saveData.level);
            setXp(saveData.xp);
            setXpNeeded(saveData.xpNeeded);
            setBuildings(saveData.buildings);
            setUnits(saveData.units);
            setQuests(saveData.quests);
            setAchievements(saveData.achievements);
            setBattleReports(saveData.battleReports || []);
            setTradeHistory(saveData.tradeHistory || []);
            showNotification(' Žaidimas įkeltas!');
          } catch(err) {
            showNotification(' Klaida įkeliant!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // XP lygio kėlimas
  useEffect(() => {
    if(xp >= xpNeeded) {
      setXp(prev => prev - xpNeeded);
      setLevel(prev => prev + 1);
      setXpNeeded(prev => Math.floor(prev * 1.5));
      showNotification(` Paskutinis lygis: ${level + 1}!`);
    }
  }, [xp, xpNeeded, level]);

  const renderBuildings = () => {
    return Object.entries(buildingsData).map(([key, data]) => {
      const level = buildings[key] || 0;
      const costs = getBuildingCost(key, level);
      const canUpgrade = canAfford(costs, resources) && level < data.maxLevel;
      
      return (
        <div key={key} className="building">
          <div className="building-icon">{data.icon}</div>
          <div className="building-name">{data.name}</div>
          <div className="building-level">Lygis: <span>{level}</span>/{data.maxLevel}</div>
          <div className="upgrade-cost">
            {costs.w > 0 && <span className="cost">🪵{costs.w}</span>}
            {costs.c > 0 && <span className="cost">🧱{costs.c}</span>}
            {costs.i > 0 && <span className="cost">⚙️{costs.i}</span>}
            {costs.cp > 0 && <span className="cost">🌾{costs.cp}</span>}
          </div>
          <button 
            className="btn" 
            style={{marginTop: '8px', fontSize: '10px'}}
            onClick={() => upgradeBuilding(key)}
            disabled={!canUpgrade}
          >
            {level >= data.maxLevel ? 'Maks' : 'Tobulinti'}
          </button>
        </div>
      );
    });
  };

  const renderUnits = () => {
    return Object.entries(unitsData).map(([key, data]) => {
      const count = units[key] || 0;
      const canTrain = canAfford(data.cost, resources) && population < maxPopulation;
      
      return (
        <div key={key} className="unit-card">
          <div className="unit-icon">{data.icon}</div>
          <div className="unit-info">
            <div className="unit-name">{data.name}</div>
            <div className="unit-stats">⚔️{data.attack} | 🛡️{data.defense}</div>
            <div className="unit-cost">
              Kiekis: {count} | 
              🪵{data.cost.wood} 🧱{data.cost.clay} ⚙️{data.cost.iron} 🌾{data.cost.crop}
            </div>
          </div>
        </div>
      );
    });
  };

  const renderMap = () => {
    const cells = [];
    for(let y = 0; y < 15; y++) {
      for(let x = 0; x < 15; x++) {
        const rand = Math.random();
        let className = 'map-cell';
        if(x === 7 && y === 7) className += ' own';
        else if(rand < 0.08) className += ' forest';
        else if(rand < 0.12) className += ' mountain';
        else if(rand < 0.15) className += ' village';
        else if(rand < 0.2) className += ' enemy';
        
        cells.push(
          <div 
            key={`${x}-${y}`} 
            className={className}
            data-level={x === 7 && y === 7 ? 'Jūs' : (rand < 0.15 ? Math.floor(Math.random() * 10) + 1 : '')}
            onClick={() => showNotification(x === 7 && y === 7 ? ' Čia jūsų kaimas!' : ` Paskutinis: ${Math.floor(Math.random() * 15) + 1} lygio`)}
          />
        );
      }
    }
    return cells;
  };

  return (
    <>
      <header>
        <div className="logo">⚔️ Imperija</div>
        <div className="resources">
          <div className="resource">
            <div className="resource-icon wood">🪵</div>
            <span className="resource-value">{Math.floor(resources.wood)}</span>
          </div>
          <div className="resource">
            <div className="resource-icon clay">🧱</div>
            <span className="resource-value">{Math.floor(resources.clay)}</span>
          </div>
          <div className="resource">
            <div className="resource-icon iron">⚙️</div>
            <span className="resource-value">{Math.floor(resources.iron)}</span>
          </div>
          <div className="resource">
            <div className="resource-icon crop">🌾</div>
            <span className="resource-value">{Math.floor(resources.crop)}</span>
          </div>
          <div className="population">
            👥 {population}/{maxPopulation}
          </div>
        </div>
      </header>

      <div className="game-container">
        {/* Kairė pusė */}
        <div className="sidebar">
          <h3>🏰 Gyvenvietė</h3>
          <div className="village-info">
            <div className="village-level">{level}</div>
            <div className="village-name">Pradinis kaimas</div>
            <div style={{marginTop: '8px', color: '#888', fontSize: '10px'}}>
              XP: {xp}/{xpNeeded}
            </div>
          </div>
          
          <h3>⚔️ Karinės</h3>
          <button className="btn btn-train" onClick={() => trainUnit('legionary')}>
            Legionierius ⚔️
          </button>
          <button className="btn btn-train" onClick={() => trainUnit('eques')}>
            Raitelis 🐎
          </button>
          <button className="btn btn-train" onClick={() => trainUnit('archer')}>
            Lankininkas 🏹
          </button>
          <button className="btn btn-train" onClick={() => trainUnit('hero')}>
            Herojus 👑
          </button>
          
          <h3 style={{marginTop: '15px'}}>💾 Žaidimas</h3>
          <button className="btn" onClick={saveGame}>💾 Išsaugoti</button>
          <button className="btn" onClick={loadGame}>📂 Įkelti</button>
          
          <h3 style={{marginTop: '15px'}}>📋 Ataskaitos</h3>
          <div id="reports">
            {reports.map((r, i) => <div key={i}>{r}</div>)}
          </div>
        </div>

        {/* Pagrindinė dalis */}
        <div className="main-area">
          {eventActive && (
            <div className="event-banner active">
              🎉 Savaitgalio renginys: dvigubi resursai!
            </div>
          )}
          
          <div className="tabs">
            <div className={`tab ${activeTab2 === 'buildings' ? 'active' : ''}`} onClick={() => setActiveTab2('buildings')}>
              🏗️ Statybos
            </div>
            <div className={`tab ${activeTab2 === 'map' ? 'active' : ''}`} onClick={() => setActiveTab2('map')}>
              🗺️ Žemėlapis
            </div>
            <div className={`tab ${activeTab2 === 'units' ? 'active' : ''}`} onClick={() => setActiveTab2('units')}>
              ⚔️ Kariai
            </div>
            <div className={`tab ${activeTab2 === 'battle' ? 'active' : ''}`} onClick={() => setActiveTab2('battle')}>
              ⚔️ Mūšiai
            </div>
          </div>
          
          {activeTab2 === 'buildings' && (
            <div className="buildings-grid">
              {renderBuildings()}
            </div>
          )}
          
          {activeTab2 === 'map' && (
            <div className="world-map">
              {renderMap()}
            </div>
          )}
          
          {activeTab2 === 'units' && (
            <div className="units-list">
              {renderUnits()}
            </div>
          )}
          
          {activeTab2 === 'battle' && (
            <div>
              <button className="btn btn-train" onClick={() => setShowAttackModal(true)}>
                💥 Pulti kaimą
              </button>
              <h4 style={{color: '#c9a227', margin: '15px 0 10px'}}>Mūšio ataskaitos</h4>
              <div id="battle-reports">
                {battleReports.length === 0 && <div>Dar nėra mūšių</div>}
                {battleReports.map((r, i) => (
                  <div key={i} className="quest" style={{borderLeft: r.win ? '4px solid #00ff00' : '4px solid #ff4444'}}>
                    <div className="quest-title">
                      {r.win ? '✅ Laimėta' : '❌ Pralaimėta'}
                    </div>
                    <div style={{fontSize: '10px', color: '#888'}}>
                      Jūsų puolimas: {r.player} | Gynyba: {r.enemy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dešinė pusė */}
        <div className="stats-panel">
          <h3>📜 Užduotys</h3>
          <div className="quest" id="quest-1">
            <div className="quest-title">Pastatyk kluoną 1 lygio</div>
            <div className="quest-progress">
              <div className="quest-bar" style={{width: quests.quest1 ? '100%' : '0%'}}></div>
            </div>
            <div className="quest-reward">+50 XP, +100 🌾</div>
          </div>
          <div className="quest" id="quest-2">
            <div className="quest-title">Užaugink 5 legionierius</div>
            <div className="quest-progress">
              <div className="quest-bar" style={{width: quests.quest2 ? '100%' : '0%'}}></div>
            </div>
            <div className="quest-reward">+100 XP, +200 🌾</div>
          </div>
          <div className="quest" id="quest-3">
            <div className="quest-title">Pasiek 3 lygį</div>
            <div className="quest-progress">
              <div className="quest-bar" style={{width: quests.quest3 ? '100%' : '0%'}}></div>
            </div>
            <div className="quest-reward">+200 XP</div>
          </div>
          
          <h3 style={{marginTop: '15px'}}>🏆 Reitingai</h3>
          <div style={{fontSize: '11px'}}>
            <div className="achievement"><span>1. Imperatorius</span><span>Lv.50</span></div>
            <div className="achievement"><span>2. Karalius</span><span>Lv.35</span></div>
            <div className="achievement"><span>3. Baronas</span><span>Lv.28</span></div>
            <div className="achievement"><span>4. Jūs</span><span>Lv.{level}</span></div>
          </div>
          
          <h3 style={{marginTop: '15px'}}>🎯 Pasiekimai</h3>
          <div className="achievements">
            <div className={`achievement ${achievements.firstUnit ? 'unlocked' : 'locked'}`}>
              <span className="achievement-icon">⚔️</span> Pirmas karys
            </div>
            <div className={`achievement ${achievements.builder ? 'unlocked' : 'locked'}`}>
              <span className="achievement-icon">🏰</span> Statytojas
            </div>
            <div className={`achievement ${achievements.ruler ? 'unlocked' : 'locked'}`}>
              <span className="achievement-icon">👑</span> Valdovas
            </div>
          </div>
        </div>
      </div>

      {/* Puolimo modalas */}
      <div className={`modal ${showAttackModal ? 'active' : ''}`}>
        <div className="modal-content">
          <h3>💥 Pulti kaimą</h3>
          <div style={{marginBottom: '10px'}}>
            <label style={{fontSize: '12px'}}>Legionieriai:</label>
            <input type="number" id="attack-legionary" defaultValue="0" style={{width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #444', color: 'white', borderRadius: '4px', marginTop: '4px'}} />
          </div>
          <div style={{marginBottom: '10px'}}>
            <label style={{fontSize: '12px'}}>Raiteliai:</label>
            <input type="number" id="attack-eques" defaultValue="0" style={{width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #444', color: 'white', borderRadius: '4px', marginTop: '4px'}} />
          </div>
          <div style={{marginBottom: '15px'}}>
            <label style={{fontSize: '12px'}}>Lankininkai:</label>
            <input type="number" id="attack-archer" defaultValue="0" style={{width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #444', color: 'white', borderRadius: '4px', marginTop: '4px'}} />
          </div>
          <div className="modal-buttons">
            <button className="btn" onClick={() => setShowAttackModal(false)}>Atšaukti</button>
            <button className="btn btn-train" onClick={doAttack}>Pulti!</button>
          </div>
        </div>
      </div>

      {/* Dienos premija */}
      <div className={`daily-reward ${showDailyReward ? 'active' : ''}`}>
        <h2>🎁 Dienos Premija!</h2>
        <div className="rewards">+500 visų resursų!</div>
        <button className="btn" onClick={claimDailyReward} style={{maxWidth: '150px', margin: '0 auto'}}>Paimti</button>
      </div>

      {/* Pranešimas */}
      {notification && (
        <div className="notification">{notification}</div>
      )}
    </>
  );
}
