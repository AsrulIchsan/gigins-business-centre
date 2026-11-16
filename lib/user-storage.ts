import fs from "fs";
import path from "path";
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

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
  ensureDataDir();
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_OFFICIAL_USERS, null, 2), "utf-8");
      return INITIAL_OFFICIAL_USERS;
    }
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_OFFICIAL_USERS;
  } catch (err) {
    console.error("[UserStorage] Failed to read users file:", err);
    return INITIAL_OFFICIAL_USERS;
  }
}

export function writeStoredUsers(users: StoredUser[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("[UserStorage] Failed to write users file:", err);
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
