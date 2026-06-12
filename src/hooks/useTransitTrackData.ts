import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface TollGate {
  id: string;
  name: string;
  state: string;
  status: string;
  coords: number[];
}

interface TrafficSignal {
  id: string;
  intersection: string;
  status: string;
}

export function useTransitTrackData() {
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [historicalJourneys, setHistoricalJourneys] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);

  const [tollGates, setTollGates] = useState<TollGate[]>([
    { id: 'TG-01', name: 'Noida Toll Plaza NH-24', state: 'Uttar Pradesh', status: 'OPEN', coords: [77.3910, 28.5355] },
    { id: 'TG-02', name: 'Rewa Bypass Plaza NH-30', state: 'Madhya Pradesh', status: 'OPEN', coords: [81.2998, 24.5362] },
    { id: 'TG-03', name: 'Mumbai-Pune Expressway Toll', state: 'Maharashtra', status: 'OPEN', coords: [73.8567, 18.5204] },
    { id: 'TG-04', name: 'Delhi Border Plaza DND Flyway', state: 'Delhi NCR', status: 'CLOSED', coords: [77.2090, 28.6139] },
  ]);

  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([
    { id: 'TS-01', intersection: 'Sector 62 Crossing Noida', status: 'AUTO-GREEN' },
    { id: 'TS-02', intersection: 'Civil Lines Crossing Rewa', status: 'AUTO-GREEN' },
    { id: 'TS-03', intersection: 'Connaught Place Ring Road', status: 'ALL-RED LOCK' },
  ]);

  const [anprLogs, setAnprLogs] = useState<string[]>([
    '[ANPR LOG] MH-12-PQ-8890 | AUDI Q7 | SPEED: 82km/h | MATCH: SAFE',
    '[ANPR LOG] UP-16-BD-1212 | SCORPIO N | SPEED: 110km/h | MATCH: VEHICLE WATCHLIST',
  ]);

  // Live Firebase subscriptions
  useEffect(() => {
    const qJourneys = query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency']));
    const unsubJourneys = onSnapshot(qJourneys, (snap) =>
      setActiveJourneys(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const qHistory = query(collection(db, 'journeys'), where('status', 'in', ['completed', 'resolved']));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setHistoricalJourneys(sorted);
    });

    const unsubAlerts = onSnapshot(
      query(collection(db, 'alerts'), where('status', 'in', ['active', 'responding']), where('isTransitSOS', '==', true)),
      (snap) => setActiveAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubProts = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'protector')),
      (snap) => setActiveProtectors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubFirs = onSnapshot(collection(db, 'zero_firs'), (snap) =>
      setActiveFirs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubJourneys(); unsubHistory(); unsubAlerts(); unsubProts(); unsubFirs(); };
  }, []);

  // ANPR Simulator (only when INFRA tab is active — caller passes isActive)
  const startAnprSimulator = () => {
    const vehicles = [
      { plate: 'DL-3C-AY-4567', model: 'TOYOTA FORTUNER', speed: '76km/h', match: 'SAFE' },
      { plate: 'MP-17-CC-9988', model: 'HYUNDAI CRETA', speed: '94km/h', match: 'SAFE' },
      { plate: 'UP-16-TS-0077', model: 'TATA NEXON', speed: '128km/h', match: 'SPEED VIOLATION' },
      { plate: 'MH-02-EE-3245', model: 'MARUTI SWIFT', speed: '55km/h', match: 'SAFE' },
      { plate: 'HR-26-DJ-8800', model: 'MAHINDRA THAR', speed: '105km/h', match: 'ABNORMAL DRIFT' },
    ];
    return setInterval(() => {
      const v = vehicles[Math.floor(Math.random() * vehicles.length)];
      setAnprLogs(prev => [
        `[ANPR LOG] ${v.plate} | ${v.model} | SPEED: ${v.speed} | MATCH: ${v.match}`,
        ...prev.slice(0, 8)
      ]);
    }, 4000);
  };

  return {
    activeJourneys, historicalJourneys, activeAlerts, activeProtectors, activeFirs,
    tollGates, setTollGates, trafficSignals, setTrafficSignals, anprLogs, startAnprSimulator
  };
}
