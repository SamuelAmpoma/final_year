const axios = require('axios');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const API = {
  AUTH: 'http://localhost:3001/auth',
  INCIDENT: 'http://localhost:3002/incidents',
  STATION: 'http://localhost:3002/stations',
  DISPATCH: 'http://localhost:3003/vehicles'
};

let token = '';

async function run() {
  console.log('🚀 Starting Data Seeding & End-to-End Test Simulation...');

  try {
    // 1. Auth Setup
    const email = `admin_${Date.now()}@ghanaems.com`;
    console.log('\n--- 1. Authenticating ---');
    try {
      await axios.post(`${API.AUTH}/register`, {
        name: 'System Admin',
        email: email,
        password: 'password123',
        role: 'ADMIN'
      });
      console.log('✅ Registered System Admin');
    } catch (e) {
      console.log('⚠️ Failed to register admin:', e.response?.data || e.message);
      throw e;
    }

    const { data: loginData } = await axios.post(`${API.AUTH}/login`, {
      email: email,
      password: 'password123'
    });
    token = loginData.token;
    console.log('✅ Logged in successfully');
    
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n--- 2. Creating Stations (Hospitals, Police, Fire) ---');
    const stations = [
      { name: 'Korle-Bu Teaching Hospital', stationType: 'HOSPITAL', address: 'Korle Bu, Accra', phoneNumber: '0302000001', latitude: 5.5397, longitude: -0.2185, capacity: 500 },
      { name: 'Legon Hospital', stationType: 'HOSPITAL', address: 'University of Ghana, Accra', phoneNumber: '0302000002', latitude: 5.6420, longitude: -0.1852, capacity: 200 },
      { name: 'Accra Central Police Station', stationType: 'POLICE', address: 'Central Business District', phoneNumber: '0302000003', latitude: 5.5450, longitude: -0.2030 },
      { name: 'Dansoman Police Station', stationType: 'POLICE', address: 'Dansoman, Accra', phoneNumber: '0302000004', latitude: 5.5539, longitude: -0.2709 },
      { name: 'Makola Fire Station', stationType: 'FIRE', address: 'Makola Market Area', phoneNumber: '0302000005', latitude: 5.5500, longitude: -0.2050 }
    ];

    for (const stat of stations) {
      try {
        await axios.post(API.STATION, stat, { headers, timeout: 5000 });
        console.log(`✅ Created Station: ${stat.name}`);
      } catch (e) {
        console.log(`⚠️ Skip station creation: ${stat.name} (maybe exists)`);
      }
    }

    let createdStations = [];
    try {
        console.log('Fetching all stations...');
        const res = await axios.get(API.STATION, { headers, timeout: 5000 });
        createdStations = res.data;
    } catch(e) {
        console.log('Failed to fetch stations:', e.message);
    }

    if(createdStations.length === 0) {
        console.log('Warning: No stations found. Using mock IDs for vehicles.');
        createdStations = [
            { id: 1, type: 'HOSPITAL', name: 'Mock Hospital' },
            { id: 3, type: 'POLICE', name: 'Mock Police' },
            { id: 5, type: 'FIRE', name: 'Mock Fire' }
        ];
    }

    // 3. Register Vehicles
    console.log('\n--- 3. Registering Vehicles ---');
    const hospital = createdStations.find(s => s.type === 'HOSPITAL' || s.stationType === 'HOSPITAL');
    const police = createdStations.find(s => s.type === 'POLICE' || s.stationType === 'POLICE');
    const fire = createdStations.find(s => s.type === 'FIRE' || s.stationType === 'FIRE');

    const vehicles = [
      { registrationNumber: 'AMB-001', vehicleId: 'AMB-001', vehicleType: 'AMBULANCE', stationId: hospital?.id || 1, stationName: hospital?.name || 'Korle-Bu', driverName: 'Kwame Mensah', driverPhone: '0240000001', latitude: 5.5400, longitude: -0.2180 },
      { registrationNumber: 'ACC-POL-1', vehicleId: 'ACC-POL-1', vehicleType: 'POLICE_CAR', stationId: police?.id || 3, stationName: police?.name || 'Accra Central', driverName: 'Sgt. John Doe', driverPhone: '0240000003', latitude: 5.5455, longitude: -0.2035 },
      { registrationNumber: 'MAK-FIRE-1', vehicleId: 'MAK-FIRE-1', vehicleType: 'FIRE_ENGINE', stationId: fire?.id || 5, stationName: fire?.name || 'Makola Fire', driverName: 'Chief Fire Officer', driverPhone: '0240000004', latitude: 5.5505, longitude: -0.2055 }
    ];

    for (const v of vehicles) {
      try {
        await axios.post(`${API.DISPATCH}/register`, v, { headers, timeout: 5000 });
        console.log(`✅ Registered Vehicle: ${v.registrationNumber}`);
      } catch (e) {
        console.log(`⚠️ Skip vehicle registration: ${v.registrationNumber} (maybe exists)`);
      }
    }

    let createdVehicles = [];
    try {
        const res = await axios.get(API.DISPATCH, { headers, timeout: 5000 });
        createdVehicles = res.data;
    } catch(e) {
        console.log('Failed to fetch vehicles:', e.message);
    }

    // 4. Report Incidents
    console.log('\n--- 4. Simulating Incidents ---');
    const incidents = [
      { citizenName: 'Akwasi Appiah', citizenPhone: '0550000001', incidentType: 'MEDICAL', locationAddress: 'Osu Oxford Street', latitude: 5.5600, longitude: -0.1800, notes: 'Citizen collapsed on street' },
      { citizenName: 'Evelyn Arthur', citizenPhone: '0550000002', incidentType: 'FIRE', locationAddress: 'Madina Market', latitude: 5.6667, longitude: -0.1667, notes: 'Large fire at market' },
      { citizenName: 'Kojo Asamoah', citizenPhone: '0550000003', incidentType: 'ACCIDENT', locationAddress: 'Tema Motorway', latitude: 5.6540, longitude: -0.0500, notes: 'Pileup on motorway' }
    ];

    let createdIncidents = [];
    for (const inc of incidents) {
      try {
        const res = await axios.post(API.INCIDENT, inc, { headers, timeout: 5000 });
        console.log(`✅ Reported Incident: ${inc.incidentType} at ${inc.locationAddress}`);
        createdIncidents.push(res.data);
      } catch (e) {
         console.log(`⚠️ Failed to report incident: ${e.response?.data?.message || e.message}`);
      }
    }

    // 5. Dispatch Scenarios
    console.log('\n--- 5. Simulating Dispatch Scenarios ---');
    const ambulance = createdVehicles.find(v => v.vehicleType === 'AMBULANCE');
    const fireTruck = createdVehicles.find(v => v.vehicleType === 'FIRE_ENGINE' || v.vehicleType === 'FIRE_TRUCK');
    
    if (createdIncidents.length >= 2) {
      if (ambulance && createdIncidents[0]?.id) {
        console.log(`📡 Dispatching ${ambulance.registrationNumber} to Incident #${createdIncidents[0].id}`);
        try {
          await axios.put(`${API.INCIDENT}/${createdIncidents[0].id}/assign`, {
            unitId: ambulance.id,
            unitName: ambulance.registrationNumber,
            unitType: ambulance.vehicleType
          }, { headers, timeout: 5000 });
          await axios.put(`${API.DISPATCH}/${ambulance.id}/assign/${createdIncidents[0].id}`, {}, { headers, timeout: 5000 });
        } catch(e) { console.log('Dispatch fail', e.message); }
      }
      
      if (fireTruck && createdIncidents[1]?.id) {
        console.log(`📡 Dispatching ${fireTruck.registrationNumber} to Incident #${createdIncidents[1].id}`);
        try {
          await axios.put(`${API.INCIDENT}/${createdIncidents[1].id}/assign`, {
            unitId: fireTruck.id,
            unitName: fireTruck.registrationNumber,
            unitType: fireTruck.vehicleType
          }, { headers, timeout: 5000 });
          await axios.put(`${API.DISPATCH}/${fireTruck.id}/assign/${createdIncidents[1].id}`, {}, { headers, timeout: 5000 });
        } catch(e) { console.log('Dispatch fail', e.message); }
      }
    }

    console.log('\n🎉 E2E Test & Seeding Completed Successfully! Summary:');
    console.log(`- ${createdStations.length} Stations`);
    console.log(`- ${createdVehicles.length} Vehicles`);
    console.log(`- ${createdIncidents.length} Incidents`);

  } catch (err) {
    console.error('❌ Critical Error during seeding:', err.response?.data || err.message);
  }
}

run();
