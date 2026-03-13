import { NextResponse } from 'next/server';

// Pradinis žaidimo būsenos šablonas
export function getInitialGameState() {
  return {
    resources: { wood: 500, clay: 500, iron: 500, crop: 500 },
    population: 10,
    maxPopulation: 100,
    level: 1,
    xp: 0,
    xpNeeded: 100,
    buildings: {
      main: 1, farm: 1, lumber: 1, clay: 1, iron: 1, warehouse: 1,
      barracks: 0, stable: 0, wall: 0, academy: 0, temple: 0, market: 0
    },
    units: { legionary: 0, eques: 0, archer: 0, hero: 0 },
    quests: { quest1: false, quest2: false, quest3: false },
    achievements: { firstUnit: false, builder: false, ruler: false },
    battleReports: [],
    tradeHistory: [],
    reports: ['• Sveikas atvykęs į Imperiją!'],
    buildingQueue: {}
  };
}

// POST - Išsaugoti žaidimą
export async function POST(request) {
  try {
    const gameState = await request.json();
    // Čia galėtumėt išsaugoti į duomenų bazę
    return NextResponse.json({ success: true, message: 'Žaidimas išsaugotas' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET - Gauti pradinę būseną arba serverio laiką
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'init') {
    return NextResponse.json(getInitialGameState());
  }
  
  if (action === 'time') {
    return NextResponse.json({ 
      serverTime: new Date().toISOString(),
      timestamp: Date.now()
    });
  }
  
  return NextResponse.json({ message: 'Imperija API' });
}
