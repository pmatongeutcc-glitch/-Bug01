import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, updateDoc, 
  deleteDoc, onSnapshot, getDocFromServer, getDocs, writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Car, Booking, LineNotifyMessage, FleetSettings } from '../types';
import { INITIAL_CARS } from '../data/initialData';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp({
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId
});

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore Connection directly
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is in offline mode or waiting for connection.');
      return false;
    }
    // Any other error (like doc not found) still indicates successful contact with server
    return true;
  }
}

/**
 * Real-time Cars subscription with auto-seeding if collection is fresh
 */
export function subscribeCars(callback: (cars: Car[]) => void, onError?: (err: Error) => void) {
  const carsCol = collection(db, 'cars');
  return onSnapshot(carsCol, async (snapshot) => {
    if (snapshot.empty) {
      // Auto-seed initial cars to Firestore if empty
      try {
        const batch = writeBatch(db);
        INITIAL_CARS.forEach(car => {
          const carRef = doc(db, 'cars', car.id);
          batch.set(carRef, car);
        });
        await batch.commit();
        callback(INITIAL_CARS);
      } catch (err) {
        console.error('Error seeding cars to Firestore:', err);
        callback(INITIAL_CARS);
      }
    } else {
      const carsList: Car[] = [];
      snapshot.forEach(docSnap => {
        carsList.push(docSnap.data() as Car);
      });
      // Sort by vehicleId
      carsList.sort((a, b) => a.vehicleId.localeCompare(b.vehicleId));
      callback(carsList);
    }
  }, (err) => {
    console.error('Cars subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Real-time Bookings subscription
 */
export function subscribeBookings(callback: (bookings: Booking[]) => void, onError?: (err: Error) => void) {
  const bookingsCol = collection(db, 'bookings');
  return onSnapshot(bookingsCol, (snapshot) => {
    const list: Booking[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as Booking);
    });
    // Sort descending by creation date or id
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(list);
  }, (err) => {
    console.error('Bookings subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Real-time LINE messages subscription
 */
export function subscribeLineMessages(callback: (msgs: LineNotifyMessage[]) => void, onError?: (err: Error) => void) {
  const msgsCol = collection(db, 'lineMessages');
  return onSnapshot(msgsCol, (snapshot) => {
    const list: LineNotifyMessage[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as LineNotifyMessage);
    });
    // Sort descending
    list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    callback(list);
  }, (err) => {
    console.error('LineMessages subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Real-time fleet settings subscription (e.g., reasonableLimitHours, adminPin, operatingHours)
 */
export function subscribeSettings(callback: (settings: FleetSettings) => void) {
  const settingsDoc = doc(db, 'settings', 'fleet');
  return onSnapshot(settingsDoc, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as FleetSettings);
    }
  }, (err) => {
    console.error('Settings subscription error:', err);
  });
}

/**
 * Atomic Firestore Write Operations
 */
export async function saveBookingToCloud(booking: Booking): Promise<void> {
  const bookingRef = doc(db, 'bookings', booking.id);
  await setDoc(bookingRef, booking);
}

export async function updateBookingInCloud(bookingId: string, updates: Partial<Booking>): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  await updateDoc(bookingRef, updates);
}

export async function deleteBookingFromCloud(bookingId: string): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  await deleteDoc(bookingRef);
}

/**
 * Force manual fetch from Firestore cloud
 */
export async function fetchFreshDataFromCloud(): Promise<{ cars: Car[]; bookings: Booking[]; lineMessages: LineNotifyMessage[] }> {
  const carsSnap = await getDocs(collection(db, 'cars'));
  const cars: Car[] = [];
  carsSnap.forEach(d => cars.push(d.data() as Car));
  cars.sort((a, b) => a.vehicleId.localeCompare(b.vehicleId));

  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  const bookings: Booking[] = [];
  bookingsSnap.forEach(d => bookings.push(d.data() as Booking));
  bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const msgsSnap = await getDocs(collection(db, 'lineMessages'));
  const lineMessages: LineNotifyMessage[] = [];
  msgsSnap.forEach(d => lineMessages.push(d.data() as LineNotifyMessage));
  lineMessages.sort((a, b) => (b.id || '').localeCompare(a.id || ''));

  return { cars, bookings, lineMessages };
}

export async function saveCarToCloud(car: Car): Promise<void> {
  const carRef = doc(db, 'cars', car.id);
  await setDoc(carRef, car);
}

export async function updateCarInCloud(carId: string, updates: Partial<Car>): Promise<void> {
  const carRef = doc(db, 'cars', carId);
  await updateDoc(carRef, updates);
}

export async function deleteCarFromCloud(carId: string): Promise<void> {
  const carRef = doc(db, 'cars', carId);
  await deleteDoc(carRef);
}

export async function resetCarsInCloud(defaultCars: Car[]): Promise<void> {
  const carsCol = collection(db, 'cars');
  const snap = await getDocs(carsCol);
  const batch = writeBatch(db);
  snap.forEach(d => {
    batch.delete(d.ref);
  });
  defaultCars.forEach(car => {
    const ref = doc(db, 'cars', car.id);
    batch.set(ref, car);
  });
  await batch.commit();
}

export async function saveLineMessageToCloud(message: LineNotifyMessage): Promise<void> {
  const msgRef = doc(db, 'lineMessages', message.id);
  await setDoc(msgRef, message);
}

export async function saveSettingsToCloud(settings: Partial<FleetSettings>): Promise<void> {
  const settingsDoc = doc(db, 'settings', 'fleet');
  await setDoc(settingsDoc, settings, { merge: true });
}

export async function clearAllBookingsFromCloud(): Promise<void> {
  const bookingsCol = collection(db, 'bookings');
  const snap = await getDocs(bookingsCol);
  const batch = writeBatch(db);
  snap.forEach(d => {
    batch.delete(d.ref);
  });
  await batch.commit();

  const msgCol = collection(db, 'lineMessages');
  const msgSnap = await getDocs(msgCol);
  const msgBatch = writeBatch(db);
  msgSnap.forEach(d => {
    msgBatch.delete(d.ref);
  });
  await msgBatch.commit();
}
