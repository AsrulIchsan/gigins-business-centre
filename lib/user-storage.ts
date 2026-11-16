import fs from "fs";
import path from "path";
import os from "os";
import bcrypt from "bcryptjs";
import { BusinessRole, Permission, DEFAULT_PERMISSIONS } from "./auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserBusinessAssignment {
  slug: string;
  name: string;
  type: "PHARMACY" | "RETAIL_TOYS";
  role: BusinessRole;
  permissions: Permission[];
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Plaintext password for Owner management in Role & Access Control
  hashedPassword: string; // Bcrypt hash for secure authentication
  role: "OWNER" | "ADMIN" | "APOTEKER" | "TTK" | "KASIR" | "MANAJER";
  isActive: boolean;
  assignedBusinesses: UserBusinessAssignment[];
  lastLogin?: string;
}

// Storage paths: CWD (committed seed) and TMP (writable in Vercel Serverless)
const CWD_DATA_DIR = path.join(process.cwd(), "data");
const CWD_USERS_FILE = path.join(CWD_DATA_DIR, "users.json");
const TMP_DATA_DIR = path.join(os.tmpdir(), "gigins_data");
const TMP_USERS_FILE = path.join(TMP_DATA_DIR, "users.json");

// In-Memory Global Store to preserve runtime modifications across function calls in serverless
const globalUserStore = globalThis as unknown as {
  __gigins_users?: StoredUser[];
};

function ensureDirSafe(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {
    // Ignore read-only filesystem errors silently
  }
}

// ─── Official Baseline Accounts (Matching Role & Access Control) ─────────────

const INITIAL_OFFICIAL_USERS: StoredUser[] = [
  {
    id: "usr-owner-gigin",
    name: "Gigin",
    email: "admin@apotiktamansari.com",
    phone: "0812-9988-7766",
    password: "admin123",
    hashedPassword: bcrypt.hashSync("admin123", 10),
    role: "OWNER",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
    ],
    lastLogin: "Sesi Aktif",
  },
  {
    id: "usr-01",
    name: "apt. Nurul Aulia, S.Farm",
    email: "nurul.aulia@apotiktamansari.com",
    phone: "0812-3456-7801",
    password: "nurul123",
    hashedPassword: bcrypt.hashSync("nurul123", 10),
    role: "MANAJER",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "MANAGER",
        permissions: DEFAULT_PERMISSIONS.MANAGER,
      },
    ],
    lastLogin: "Hari ini, 07:15",
  },
  {
    id: "usr-02",
    name: "Siti Rahma, A.Md.Farm",
    email: "kasir@apotiktamansari.com",
    phone: "0813-8821-9902",
    password: "kasir123",
    hashedPassword: bcrypt.hashSync("kasir123", 10),
    role: "KASIR",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
    lastLogin: "Hari ini, 07:00",
  },
  {
    id: "usr-03",
    name: "Budi Santoso",
    email: "budi@pasarlelea.com",
    phone: "0856-7788-1234",
    password: "budi123",
    hashedPassword: bcrypt.hashSync("budi123", 10),
    role: "MANAJER",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "MANAGER",
        permissions: DEFAULT_PERMISSIONS.MANAGER,
      },
    ],
    lastLogin: "Kemarin, 14:22",
  },
  {
    id: "usr-04",
    name: "Ahmad Fauzi",
    email: "ahmad@pasarlelea.com",
    phone: "0819-3344-5566",
    password: "ahmad123",
    hashedPassword: bcrypt.hashSync("ahmad123", 10),
    role: "KASIR",
    isActive: false, // DIBLOKIR / NONAKTIF
    assignedBusinesses: [
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
    lastLogin: "7 hari lalu (Nonaktif)",
  },
  {
    id: "usr-05",
    name: "Dewi Lestari",
    email: "dewi.multicabang@gigins.com",
    phone: "0811-2233-4455",
    password: "dewi123",
    hashedPassword: bcrypt.hashSync("dewi123", 10),
    role: "KASIR",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
    lastLogin: "Kemarin, 08:30",
  },
];

// ─── Storage Operations ──────────────────────────────────────────────────────

export function readStoredUsers(): StoredUser[] {
  // 1. If in-memory cache is populated, return it immediately
  if (globalUserStore.__gigins_users && globalUserStore.__gigins_users.length > 0) {
    return globalUserStore.__gigins_users;
  }

  // 2. Try reading from writable TMP directory first (has latest runtime modifications)
  try {
    if (fs.existsSync(TMP_USERS_FILE)) {
      const raw = fs.readFileSync(TMP_USERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalUserStore.__gigins_users = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[UserStorage] Warning reading from TMP users file:", err);
  }

  // 3. Try reading from project bundle (data/users.json)
  try {
    if (fs.existsSync(CWD_USERS_FILE)) {
      const raw = fs.readFileSync(CWD_USERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalUserStore.__gigins_users = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[UserStorage] Warning reading from CWD users file:", err);
  }

  // 4. Default to official baseline users
  globalUserStore.__gigins_users = INITIAL_OFFICIAL_USERS;

  // Persist to TMP in background so future reads are fast
  try {
    ensureDirSafe(TMP_DATA_DIR);
    fs.writeFileSync(TMP_USERS_FILE, JSON.stringify(INITIAL_OFFICIAL_USERS, null, 2), "utf-8");
  } catch {}

  return INITIAL_OFFICIAL_USERS;
}

export function writeStoredUsers(users: StoredUser[]): void {
  // Always update in-memory cache first
  globalUserStore.__gigins_users = users;

  // Try writing to writable TMP directory
  try {
    ensureDirSafe(TMP_DATA_DIR);
    fs.writeFileSync(TMP_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.warn("[UserStorage] Failed writing to TMP users file:", err);
  }

  // Try writing to CWD if writable (e.g. local environment)
  try {
    ensureDirSafe(CWD_DATA_DIR);
    fs.writeFileSync(CWD_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch {
    // EROFS on Vercel is expected; TMP and in-memory cache handle runtime state
  }
}

/**
 * Find user by email or username alias (e.g. "admin", "owner", "kasir")
 */
export function findUserByIdentifier(rawIdentifier: string): StoredUser | null {
  const users = readStoredUsers();
  const id = rawIdentifier.trim().toLowerCase();

  // 1. Direct email match
  let found = users.find((u) => u.email.toLowerCase() === id);
  if (found) return found;

  // 2. Common official aliases
  if (id === "admin" || id === "owner" || id === "gigin" || id === "owner@gigin.com" || id === "owner@apotiktamansari.com") {
    found = users.find((u) => u.role === "OWNER" || u.email === "admin@apotiktamansari.com");
    if (found) return found;
  }

  if (id === "kasir" || id === "kasir.apotik" || id === "kasir-apotik" || id === "kasir.apotik@gigin.com") {
    found = users.find((u) => u.email === "kasir@apotiktamansari.com");
    if (found) return found;
  }

  if (id === "kasir.mainan" || id === "budi") {
    found = users.find((u) => u.email === "budi@pasarlelea.com");
    if (found) return found;
  }

  if (id === "apoteker" || id === "nurul") {
    found = users.find((u) => u.email === "nurul.aulia@apotiktamansari.com");
    if (found) return found;
  }

  return null;
}

/**
 * Upsert user from Role & Access Control
 */
export function upsertStoredUser(user: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  assignedBusinesses?: UserBusinessAssignment[];
}): StoredUser {
  const users = readStoredUsers();
  const existingIndex = users.findIndex(
    (u) => (user.id && u.id === user.id) || u.email.toLowerCase() === user.email.toLowerCase()
  );

  const plainPassword = user.password && user.password.trim() ? user.password.trim() : "admin123";
  const hashedPassword = bcrypt.hashSync(plainPassword, 10);

  let updatedUser: StoredUser;

  if (existingIndex >= 0) {
    const existing = users[existingIndex];
    const passwordChanged = user.password && user.password.trim() && user.password.trim() !== existing.password;

    updatedUser = {
      ...existing,
      name: user.name || existing.name,
      email: user.email.toLowerCase() || existing.email,
      phone: user.phone || existing.phone,
      password: user.password && user.password.trim() ? user.password.trim() : existing.password,
      hashedPassword: passwordChanged ? hashedPassword : existing.hashedPassword,
      role: (user.role as any) || existing.role,
      isActive: user.isActive !== undefined ? user.isActive : existing.isActive,
      assignedBusinesses: user.assignedBusinesses || existing.assignedBusinesses,
    };
    users[existingIndex] = updatedUser;
  } else {
    updatedUser = {
      id: user.id || `usr-${Date.now()}`,
      name: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone || "—",
      password: plainPassword,
      hashedPassword,
      role: (user.role as any) || "KASIR",
      isActive: user.isActive !== undefined ? user.isActive : true,
      assignedBusinesses: user.assignedBusinesses || [
        {
          slug: "apotik-tamansari",
          name: "Apotik Tamansari",
          type: "PHARMACY",
          role: "KASIR",
          permissions: ["can_stock_opname"],
        },
      ],
      lastLogin: "Belum pernah login",
    };
    users.unshift(updatedUser);
  }

  writeStoredUsers(users);
  return updatedUser;
}

/**
 * Toggle active status
 */
export function toggleStoredUserStatus(userId: string): StoredUser | null {
  const users = readStoredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  users[idx].isActive = !users[idx].isActive;
  writeStoredUsers(users);
  return users[idx];
}

/**
 * Delete user
 */
export function deleteStoredUser(userId: string): boolean {
  let users = readStoredUsers();
  const initialLen = users.length;
  users = users.filter((u) => u.id !== userId);
  if (users.length !== initialLen) {
    writeStoredUsers(users);
    return true;
  }
  return false;
}
