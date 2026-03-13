'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  buildingsData, unitsData, getBuildingCost, getBuildingTime, 
  canAfford, getProductionRate, getMaxResources, getWallBonus 
} from './lib/game-data';

export default function ImperijaGame() {
  // === BŪSENOS KINTAMIEJI ===
  const [notification, setNotification] = useState(null);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [activeTab2, setActiveTab2] = useState('buildings');
  const [isClient, setIsClient] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  
  // Žaidimo būsena
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
  const [buildingQueue, setBuildingQueue] = useState({});
  const [loaded, setLoaded] = useState(false);

  // === INICIALIZAVIMAS ===
  useEffect(() => {
    setIsClient(true);
    
    // Auto-load iš localStorage
    const saved = localStorage.getItem('imperija-save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setResources(data.resources || { wood: 500, clay: 500, iron: 500, crop: 500 });
        setPopulation(data.population || 10);
        setMaxPopulation(data.maxPopulation || 100);
        setLevel(data.level || 1);
        setXp(data.xp || 0);
        setXpNeeded(data.xpNeeded || 100);
        setBuildings(data.buildings || { main: 1, farm: 1, lumber: 1, clay: 1, iron: 1, warehouse: 1, barracks: 0, stable: 0, wall: 0, academy: 0, temple: 0, market: 0 });
        setUnits(data.units || { legionary: 0, eques: 0, archer: 0, hero: 0 });
        setQuests(data.quests || { quest1: false, quest2: false, quest3: false });
        setAchievements(data.achievements || { firstUnit: false, builder: false, ruler: false });
        setBattleReports(data.battleReports || []);
        setTradeHistory(data.tradeHistory || []);
        setReports(data.reports || ['• Sveikas atvykęs į Imperiją!']);
        setBuildingQueue(data.buildingQueue || {});
        showNotification('💾 Išsaugotas žaidimas įkeltas!');
      } catch (e) {
        console.error('Klaida įkeliant:', e);
      }
    }
    setLoaded(true);
  }, []);

  // === PAGALBINĖS FUNKCIJOS ===
  const showNotification = useCallback((text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addReport = useCallback((text) => {
    setReports(prev => [`• ${text}`, ...prev.slice(0, 19)]);
  }, []);

  const maxRes = getMaxResources(buildings.warehouse || 0);
  const templeBonus = 1 + (buildings.temple || 0) * 0.1;
  const eventBonus = eventActive ? 2 : 1;
  const production = getProductionRate(buildings, templeBonus, eventBonus);

  // === RESURSŲ GENERATORIUS ===
  useEffect(() => {
    if (!loaded) return;
    
    const interval = setInterval(() => {
      setResources(prev => ({
        wood: Math.min(maxRes, prev.wood + production.wood * gameSpeed),
        clay: Math.min(maxRes, prev.clay + production.clay * gameSpeed),
        iron: Math.min(maxRes, prev.iron + production.iron * gameSpeed),
        crop: Math.min(maxRes, prev.crop + production.crop * gameSpeed)
      }));
      
      // Akademija - XP
      if ((buildings.academy || 0) > 0 && Math.random() < 0.1 * (buildings.academy || 0) * gameSpeed) {
        setXp(prev => prev + gameSpeed);
      }
      
      // Gyventojų išlaikymas
      const upkeep = (units.legionary * 1 + units.eques * 2 + units.archer * 1 + units.hero * 5) * gameSpeed;
      if (upkeep > 0) {
        setResources(prev => ({ ...prev, crop: Math.max(0, prev.crop - upkeep) }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [loaded, buildings, units, eventActive, maxRes, production, gameSpeed]);

  // === STATYBŲ EILĖ ===
  useEffect(() => {
    if (!loaded || Object.keys(buildingQueue).length === 0) return;
    
    const queueInterval = setInterval(() => {
      const keys = Object.keys(buildingQueue);
      if (keys.length === 0) return;
      
      keys.forEach(key => {
        const remaining = buildingQueue[key];
        const decrease = gameSpeed; // Greitinimas veikia statyboms
        
        if (remaining <= decrease) {
          // Baigta statyba
          const currentLevel = buildings[key] || 0;
          setBuildings(prev => ({ ...prev, [key]: currentLevel + 1 }));
          setBuildingQueue(prev => {
            const n = { ...prev };
            delete n[key];
            return n;
          });
          setXp(prev => prev + 10 * (currentLevel + 1) * gameSpeed);
          setMaxPopulation(prev => prev + 10);
          setPopulation(prev => prev + 5);
          
          const data = buildingsData[key];
          addReport(`Pastatytas ${data.name} ${currentLevel + 1} lygio!`);
          showNotification(` Pastatytas ${data.name}!`);
          
          if (key === 'farm' && currentLevel === 0) {
            setQuests(prev => ({ ...prev, quest1: true }));
            setXp(prev => prev + 50 * gameSpeed);
            setResources(prev => ({ ...prev, crop: prev.crop + 100 }));
          }
          if (currentLevel + 1 >= 3) {
            setQuests(prev => ({ ...prev, quest3: true }));
            setXp(prev => prev + 200 * gameSpeed);
          }
          setAchievements(prev => ({ ...prev, builder: true }));
        } else {
          setBuildingQueue(prev => ({ ...prev, [key]: remaining - decrease }));
        }
      });
    }, 1000);
    
    return () => clearInterval(queueInterval);
  }, [loaded, buildingQueue, buildings, gameSpeed, addReport, showNotification]);

  // === RENGINYS ===
  useEffect(() => {
    const eventInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setEventActive(true);
        setTimeout(() => setEventActive(false), 10000);
      }
    }, 30000 + Math.random() * 30000);
    
    return () => clearInterval(eventInterval);
  }, []);

  // === AUTO-IŠSAUGOJIMAS ===
  useEffect(() => {
    if (!loaded) return;
    
    const saveInterval = setInterval(() => {
      const saveData = { resources, population, maxPopulation, level, xp, xpNeeded, buildings, units, quests, achievements, battleReports, tradeHistory, reports, buildingQueue };
      localStorage.setItem('imperija-save', JSON.stringify(saveData));
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, [loaded, resources, population, maxPopulation, level, xp, xpNeeded, buildings, units, quests, achievements, battleReports, tradeHistory, reports, buildingQueue]);

  // === XP LYGIO KĖLIMAS ===
  useEffect(() => {
    if (xp >= xpNeeded) {
      setLevel(prevLevel => {
        const newLevel = prevLevel + 1;
        setXp(prev => prev - xpNeeded);
        setXpNeeded(prev => Math.floor(prev * 1.5));
        showNotification(` Paskutinis lygis: ${newLevel}!`);
        return newLevel;
      });
    }
  }, [xp, xpNeeded, showNotification]);

  // === VEIKSMAI ===
  const upgradeBuilding = (key) => {
    const data = buildingsData[key];
    const level = buildings[key] || 0;
    const costs = getBuildingCost(key, level);
    const buildTime = getBuildingTime(key, level);
    
    if (!canAfford(costs, resources)) {
      showNotification(' Nepakanka resursų!');
      return;
    }
    if (buildingQueue[key]) {
      showNotification(' Jau statoma šiame pastate!');
      return;
    }
    if (Object.keys(buildingQueue).length >= 1) {
      showNotification(' Statomas kitas pastatas!');
      return;
    }
    
    setResources(prev => ({
      wood: prev.wood - (costs.w || 0),
      clay: prev.clay - (costs.c || 0),
      iron: prev.iron - (costs.i || 0),
      crop: prev.crop - (costs.cp || 0)
    }));
    
    setBuildingQueue(prev => ({ ...prev, [key]: buildTime }));
    addReport(`Pradėtas statyti ${data.name} (${Math.floor(buildTime)}s)`);
    showNotification(' Statyba pradėta!');
  };

  const trainUnit = (type) => {
    const unit = unitsData[type];
    if (!canAfford(unit.cost, resources)) {
      showNotification(' Nepakanka resursų!');
      return;
    }
    if (population >= maxPopulation) {
      showNotification(' Per daug gyventojų!');
      return;
    }
    
    setResources(prev => ({
      wood: prev.wood - unit.cost.wood,
      clay: prev.clay - unit.cost.clay,
      iron: prev.iron - unit.cost.iron,
      crop: prev.crop - unit.cost.crop
    }));
    setUnits(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setPopulation(prev => prev + 1);
    
    if (type === 'legionary' && (units.legionary + 1) >= 5) {
      setQuests(prev => ({ ...prev, quest2: true }));
      setXp(prev => prev + 100);
      setResources(prev => ({ ...prev, crop: prev.crop + 200 }));
    }
    setAchievements(prev => ({ ...prev, firstUnit: true }));
    addReport(`Paruoštas ${unit.name}!`);
  };

  const doAttack = () => {
    const legionary = parseInt(document.getElementById('attack-legionary')?.value) || 0;
    const eques = parseInt(document.getElementById('attack-eques')?.value) || 0;
    const archer = parseInt(document.getElementById('attack-archer')?.value) || 0;
    
    if (legionary > units.legionary || eques > units.eques || archer > units.archer) {
      showNotification(' Neturite tiek karių!');
      return;
    }
    if (legionary + eques + archer === 0) {
      showNotification(' Pasirinkite bent vieną karį!');
      return;
    }
    
    setUnits(prev => ({
      legionary: prev.legionary - legionary,
      eques: prev.eques - eques,
      archer: prev.archer - archer,
      hero: prev.hero
    }));
    
    const wallBonus = getWallBonus(buildings.wall || 0);
    const playerAttack = Math.floor((legionary * 40 + eques * 130 + archer * 70) * wallBonus);
    const enemyDefense = Math.floor(Math.random() * 300) + 100;
    const win = playerAttack > enemyDefense;
    
    if (win) {
      const reward = Math.floor(Math.random() * 200) + 50;
      setResources(prev => ({ ...prev, wood: prev.wood + reward, crop: prev.crop + reward }));
      setAchievements(prev => ({ ...prev, ruler: true }));
      addReport(` Mūšis laimėtas! Prizas: +${reward} resursų`);
    } else {
      addReport(` Mūšis pralaimėtas!`);
    }
    
    setBattleReports(prev => [{ win, units: { legionary, eques, archer }, enemy: enemyDefense, player: playerAttack }, ...prev.slice(0, 4)]);
    setShowAttackModal(false);
    showNotification(win ? ' Mūšis laimėtas!' : ' Mūšis pralaimėtas!');
  };

  const saveGame = () => {
    const saveData = { resources, population, maxPopulation, level, xp, xpNeeded, buildings, units, quests, achievements, battleReports, tradeHistory, reports, buildingQueue };
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
      if (file) {
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
            setBuildingQueue(saveData.buildingQueue || {});
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

  const resetGame = () => {
    if (!confirm('Ar tikrai pradeti nauja zaidima? Viso progresas bus prarastas!')) return;
    localStorage.removeItem('imperija-save');
    window.location.reload();
  };

  const showBuildingInfo = (key) => {
    const data = buildingsData[key];
    const level = buildings[key] || 0;
    const costs = getBuildingCost(key, level);
    const nextCosts = getBuildingCost(key, level + 1);
    const buildTime = getBuildingTime(key, level);
    
    const perSecond = key === 'lumber' || key === 'clay' || key === 'iron' ? level * 2 : (key === 'farm' ? level * 3 : 0);
    
    setSelectedBuilding({
      name: data.name, icon: data.icon, level, maxLevel: data.maxLevel, desc: data.desc,
      production: key === 'lumber' || key === 'clay' || key === 'iron' ? `+${level * 2}/s` : (key === 'farm' ? `+${level * 3}/s` : ''),
      currentCost: costs, nextCost: level < data.maxLevel ? nextCosts : null, buildTime,
      perSecond, perHour: perSecond * 3600, perDay: perSecond * 86400
    });
  };

  // === RENDER FUNKCIJOS ===
  const renderBuildings = () => {
    return Object.entries(buildingsData).map(([key, data]) => {
      const level = buildings[key] || 0;
      const costs = getBuildingCost(key, level);
      const isBuilding = buildingQueue[key] !== undefined;
      const buildTime = getBuildingTime(key, level);
      const buildProgress = isBuilding ? ((buildTime - buildingQueue[key]) / buildTime) * 100 : 0;
      const canUpgrade = canAfford(costs, resources) && level < data.maxLevel && !isBuilding;
      
      return (
        <div key={key} className="building" onClick={() => showBuildingInfo(key)}>
          <div className="building-icon">{data.icon}</div>
          <div className="building-name">{data.name}</div>
          <div className="building-level">Lygis: <span>{level}</span>/{data.maxLevel}</div>
          {isBuilding && (
            <div style={{margin: '5px 0'}}>
              <div style={{fontSize: '9px', color: '#fbbf24'}}>Statoma: {buildingQueue[key]}s</div>
              <div style={{width: '100%', height: '6px', background: '#333', borderRadius: '3px', marginTop: '2px'}}>
                <div style={{width: `${buildProgress}%`, height: '100%', background: '#fbbf24', borderRadius: '3px'}}></div>
              </div>
            </div>
          )}
          <div style={{fontSize: '8px', color: '#888', margin: '2px 0'}}>{data.desc}</div>
          {!isBuilding && (
            <div className="upgrade-cost">
              {costs.w > 0 && <span className="cost">🪵{costs.w}</span>}
              {costs.c > 0 && <span className="cost">🧱{costs.c}</span>}
              {costs.i > 0 && <span className="cost">⚙️{costs.i}</span>}
              {costs.cp > 0 && <span className="cost">🌾{costs.cp}</span>}
            </div>
          )}
          <button className="btn" style={{marginTop: '8px', fontSize: '10px'}} onClick={(e) => { e.stopPropagation(); upgradeBuilding(key); }} disabled={!canUpgrade}>
            {level >= data.maxLevel ? 'Maks' : (isBuilding ? 'Statoma...' : 'Tobulinti')}
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
            <div className="unit-cost">Kiekis: {count} | 🪵{data.cost.wood} 🧱{data.cost.clay} ⚙️{data.cost.iron} 🌾{data.cost.crop}</div>
          </div>
        </div>
      );
    });
  };

  // === RENDER ===
  return (
    <>
      <header>
        <div className="logo">⚔️ Imperija</div>
        <div className="resources">
          <div className="resource">
            <div className="resource-icon wood">🪵</div>
            <span className="resource-value">{Math.floor(resources.wood)}/{isClient ? maxRes : 1000}</span>
            <span style={{fontSize: '9px', color: '#4ade80', marginLeft: '3px'}}>+{production.wood.toFixed(1)}/s</span>
          </div>
          <div className="resource">
            <div className="resource-icon clay">🧱</div>
            <span className="resource-value">{Math.floor(resources.clay)}/{isClient ? maxRes : 1000}</span>
            <span style={{fontSize: '9px', color: '#4ade80', marginLeft: '3px'}}>+{production.clay.toFixed(1)}/s</span>
          </div>
          <div className="resource">
            <div className="resource-icon iron">⚙️</div>
            <span className="resource-value">{Math.floor(resources.iron)}/{isClient ? maxRes : 1000}</span>
            <span style={{fontSize: '9px', color: '#4ade80', marginLeft: '3px'}}>+{production.iron.toFixed(1)}/s</span>
          </div>
          <div className="resource">
            <div className="resource-icon crop">🌾</div>
            <span className="resource-value">{Math.floor(resources.crop)}/{isClient ? maxRes : 1000}</span>
            <span style={{fontSize: '9px', color: '#4ade80', marginLeft: '3px'}}>+{production.crop.toFixed(1)}/s</span>
          </div>
          <div className="population">👥 {population}/{maxPopulation}</div>
        </div>
      </header>

      <div className="game-container">
        <div className="sidebar">
          <h3>🏰 Gyvenvietė</h3>
          <div className="village-info">
            <div className="village-level">{level}</div>
            <div className="village-name">Pradinis kaimas</div>
            <div style={{marginTop: '8px', color: '#888', fontSize: '10px'}}>XP: {xp}/{xpNeeded}</div>
          </div>
          
          <h3>⚔️ Karinės</h3>
          <button className="btn btn-train" onClick={() => trainUnit('legionary')}>Legionierius ⚔️</button>
          <button className="btn btn-train" onClick={() => trainUnit('eques')}>Raitelis 🐎</button>
          <button className="btn btn-train" onClick={() => trainUnit('archer')}>Lankininkas 🏹</button>
          <button className="btn btn-train" onClick={() => trainUnit('hero')}>Herojus 👑</button>
          
          <h3 style={{marginTop: '15px'}}>💾 Žaidimas</h3>
          <button className="btn" onClick={saveGame}>💾 Išsaugoti</button>
          <button className="btn" onClick={loadGame}>📂 Įkelti</button>
          <button className="btn" onClick={resetGame} style={{marginTop: '5px', background: '#8b0000'}}>🗑️ Naujas žaidimas</button>
          
          <h3 style={{marginTop: '15px'}}>⚡ Greitis</h3>
          <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
            {[1, 2, 5, 10, 50, 100].map(s => (
              <button key={s} className="btn" style={{fontSize: '10px', padding: '5px 8px', background: gameSpeed === s ? '#4ade80' : ''}} onClick={() => setGameSpeed(s)}>{s}x</button>
            ))}
          </div>
          
          <h3 style={{marginTop: '15px'}}>📋 Ataskaitos</h3>
          <div id="reports">{reports.map((r, i) => <div key={i}>{r}</div>)}</div>
        </div>

        <div className="main-area">
          {eventActive && <div className="event-banner active">🎉 Savaitgalio renginys: dvigubi resursai!</div>}
          
          <div className="tabs">
            {['buildings', 'map', 'units', 'battle'].map(tab => (
              <div key={tab} className={`tab ${activeTab2 === tab ? 'active' : ''}`} onClick={() => setActiveTab2(tab)}>
                {tab === 'buildings' && '🏗️ Statybos'}
                {tab === 'map' && '🗺️ Žemėlapis'}
                {tab === 'units' && '⚔️ Kariai'}
                {tab === 'battle' && '⚔️ Mūšiai'}
              </div>
            ))}
          </div>
          
          {activeTab2 === 'buildings' && <div className="buildings-grid">{renderBuildings()}</div>}
          
          {activeTab2 === 'units' && <div className="units-list">{renderUnits()}</div>}
          
          {activeTab2 === 'battle' && (
            <div>
              <button className="btn btn-train" onClick={() => setShowAttackModal(true)}>💥 Pulti kaimą</button>
              <h4 style={{color: '#c9a227', margin: '15px 0 10px'}}>Mūšio ataskaitos</h4>
              <div id="battle-reports">
                {battleReports.length === 0 && <div>Dar nėra mūšių</div>}
                {battleReports.map((r, i) => (
                  <div key={i} className="quest" style={{borderLeft: r.win ? '4px solid #00ff00' : '4px solid #ff4444'}}>
                    <div className="quest-title">{r.win ? '✅ Laimėta' : '❌ Pralaimėta'}</div>
                    <div style={{fontSize: '10px', color: '#888'}}>Jūsų puolimas: {r.player} | Gynyba: {r.enemy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab2 === 'map' && (
            <div className="world-map">
              {Array.from({length: 225}).map((_, i) => {
                const x = i % 15;
                const y = Math.floor(i / 15);
                const rand = Math.random();
                let className = 'map-cell';
                if (x === 7 && y === 7) className += ' own';
                else if (rand < 0.08) className += ' forest';
                else if (rand < 0.12) className += ' mountain';
                else if (rand < 0.15) className += ' village';
                else if (rand < 0.2) className += ' enemy';
                return <div key={i} className={className} data-level={x === 7 && y === 7 ? 'Jūs' : (rand < 0.15 ? Math.floor(Math.random() * 10) + 1 : '')} onClick={() => showNotification(x === 7 && y === 7 ? ' Čia jūsų kaimas!' : ` Paskutinis: ${Math.floor(Math.random() * 15) + 1} lygio`)} />;
              })}
            </div>
          )}
        </div>

        <div className="stats-panel">
          <h3>📜 Užduotys</h3>
          <div className="quest"><div className="quest-title">Pastatyk kluoną 1 lygio</div><div className="quest-progress"><div className="quest-bar" style={{width: quests.quest1 ? '100%' : '0%'}}></div></div><div className="quest-reward">+50 XP, +100 🌾</div></div>
          <div className="quest"><div className="quest-title">Užaugink 5 legionierius</div><div className="quest-progress"><div className="quest-bar" style={{width: quests.quest2 ? '100%' : '0%'}}></div></div><div className="quest-reward">+100 XP, +200 🌾</div></div>
          <div className="quest"><div className="quest-title">Pasiek 3 lygį</div><div className="quest-progress"><div className="quest-bar" style={{width: quests.quest3 ? '100%' : '0%'}}></div></div><div className="quest-reward">+200 XP</div></div>
          
          <h3 style={{marginTop: '15px'}}>🏆 Reitingai</h3>
          <div style={{fontSize: '11px'}}>
            <div className="achievement"><span>1. Imperatorius</span><span>Lv.50</span></div>
            <div className="achievement"><span>2. Karalius</span><span>Lv.35</span></div>
            <div className="achievement"><span>3. Baronas</span><span>Lv.28</span></div>
            <div className="achievement"><span>4. Jūs</span><span>Lv.{level}</span></div>
          </div>
          
          <h3 style={{marginTop: '15px'}}>🎯 Pasiekimai</h3>
          <div className="achievements">
            <div className={`achievement ${achievements.firstUnit ? 'unlocked' : 'locked'}`}><span className="achievement-icon">⚔️</span> Pirmas karys</div>
            <div className={`achievement ${achievements.builder ? 'unlocked' : 'locked'}`}><span className="achievement-icon">🏰</span> Statytojas</div>
            <div className={`achievement ${achievements.ruler ? 'unlocked' : 'locked'}`}><span className="achievement-icon">👑</span> Valdovas</div>
          </div>
        </div>
      </div>

      {/* Modalai */}
      <div className={`modal ${showAttackModal ? 'active' : ''}`}>
        <div className="modal-content">
          <h3>💥 Pulti kaimą</h3>
          <div style={{marginBottom: '10px'}}><label style={{fontSize: '12px'}}>Legionieriai:</label><input type="number" id="attack-legionary" defaultValue="0" style={{width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #444', color: 'white', borderRadius: '4px', marginTop: '4px'}} /></div>
          <div style={{marginBottom: '10px'}}><label style={{fontSize: '12px'}}>Raiteliai:</label><input type="number" id="attack-eques" defaultValue="0" style={{width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #444', color: 'white', borderRadius: '4px', marginTop: '4px'}} /></div>
          <div style={{marginBottom: '15px'}}><label style={{fontSize: '12px'}}>Lankininkai:</label><input type="number" id="attack-archer" defaultValue="0" style={{width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #444', color: 'white', borderRadius: '4px', marginTop: '4px'}} /></div>
          <div className="modal-buttons">
            <button className="btn" onClick={() => setShowAttackModal(false)}>Atšaukti</button>
            <button className="btn btn-train" onClick={doAttack}>Pulti!</button>
          </div>
        </div>
      </div>

      <div className={`daily-reward ${showDailyReward ? 'active' : ''}`}>
        <h2>🎁 Dienos Premija!</h2>
        <div className="rewards">+500 visų resursų!</div>
        <button className="btn" onClick={() => { setResources(prev => ({ wood: prev.wood + 500, clay: prev.clay + 500, iron: prev.iron + 500, crop: prev.crop + 500 })); setShowDailyReward(false); showNotification(' Dienos premija gauta! +500 visko'); }} style={{maxWidth: '150px', margin: '0 auto'}}>Paimti</button>
      </div>

      <div className={`modal ${selectedBuilding ? 'active' : ''}`}>
        <div className="modal-content" style={{maxWidth: '400px'}}>
          {selectedBuilding && (
            <>
              <h3>{selectedBuilding.icon} {selectedBuilding.name}</h3>
              <div style={{textAlign: 'center', marginBottom: '15px', color: '#c9a227'}}>Lygis {selectedBuilding.level} / {selectedBuilding.maxLevel}</div>
              <div style={{fontSize: '12px', marginBottom: '10px', color: '#aaa'}}>{selectedBuilding.desc}</div>
              {selectedBuilding.production && (
                <div style={{marginBottom: '10px', padding: '10px', background: '#1a2a1a', borderRadius: '5px'}}>
                  <div style={{color: '#4ade80', fontWeight: 'bold'}}>📈 Gamyba</div>
                  <div>{selectedBuilding.production}</div>
                  <div style={{marginTop: '5px', fontSize: '11px', color: '#888'}}>Per sekundę: +{selectedBuilding.perSecond}</div>
                  <div style={{fontSize: '11px', color: '#888'}}>Per valandą: +{selectedBuilding.perHour.toLocaleString()}</div>
                  <div style={{fontSize: '11px', color: '#888'}}>Per dieną: +{selectedBuilding.perDay.toLocaleString()}</div>
                </div>
              )}
              <div style={{marginBottom: '10px', padding: '10px', background: '#2a1a1a', borderRadius: '5px'}}>
                <div style={{color: '#f87171', fontWeight: 'bold'}}>💰 Kaina</div>
                <div style={{fontSize: '12px'}}>
                  {selectedBuilding.currentCost.w > 0 && <span>🪵{selectedBuilding.currentCost.w} </span>}
                  {selectedBuilding.currentCost.c > 0 && <span>🧱{selectedBuilding.currentCost.c} </span>}
                  {selectedBuilding.currentCost.i > 0 && <span>⚙️{selectedBuilding.currentCost.i} </span>}
                  {selectedBuilding.currentCost.cp > 0 && <span>🌾{selectedBuilding.currentCost.cp}</span>}
                </div>
              </div>
              {selectedBuilding.nextCost && (
                <div style={{marginBottom: '15px', padding: '10px', background: '#2a2a1a', borderRadius: '5px'}}>
                  <div style={{color: '#fbbf24', fontWeight: 'bold'}}>📦 Kitas lygis</div>
                  <div style={{fontSize: '12px'}}>
                    {selectedBuilding.nextCost.w > 0 && <span>🪵{selectedBuilding.nextCost.w} </span>}
                    {selectedBuilding.nextCost.c > 0 && <span>🧱{selectedBuilding.nextCost.c} </span>}
                    {selectedBuilding.nextCost.i > 0 && <span>⚙️{selectedBuilding.nextCost.i} </span>}
                    {selectedBuilding.nextCost.cp > 0 && <span>🌾{selectedBuilding.nextCost.cp}</span>}
                  </div>
                </div>
              )}
              <button className="btn" onClick={() => setSelectedBuilding(null)} style={{width: '100%'}}>Uždaryti</button>
            </>
          )}
        </div>
      </div>

      {notification && <div className="notification">{notification}</div>}
    </>
  );
}
