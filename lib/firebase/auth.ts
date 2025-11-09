import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { UserProfile } from "@/types";

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Firestore
  await createUserProfile(user.uid, {
    uid: user.uid,
    email: email,
    displayName: displayName,
    photoURL: undefined,
    createdAt: new Date(),
    preferences: {
      theme: "system",
      notifications: true,
      pillarsEnabled: [
        "health",
        "finance",
        "career",
        "relationships",
        "mental",
        "learning",
        "recreation",
        "contribution",
      ],
      aiAssistant: {
        enabled: true,
        autoSuggest: true,
      },
    },
    googleConnections: {
      calendar: { connected: false },
      gmail: { connected: false },
      drive: { connected: false },
      contacts: { connected: false },
    },
  });

  return user;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Check if user profile exists, create if not
  const userProfile = await getUserProfile(user.uid);
  if (!userProfile) {
    await createUserProfile(user.uid, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      preferences: {
        theme: "system",
        notifications: true,
        pillarsEnabled: [
          "health",
          "finance",
          "career",
          "relationships",
          "mental",
          "learning",
          "recreation",
          "contribution",
        ],
        aiAssistant: {
          enabled: true,
          autoSuggest: true,
        },
      },
      googleConnections: {
        calendar: { connected: false },
        gmail: { connected: false },
        drive: { connected: false },
        contacts: { connected: false },
      },
    });
  }

  return user;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Create user profile in Firestore
 */
export async function createUserProfile(
  userId: string,
  profile: Omit<UserProfile, "createdAt"> & { createdAt: Date }
): Promise<void> {
  try {
    await setDoc(doc(db, "users", userId), {
      ...profile,
      createdAt: profile.createdAt,
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, updates, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
