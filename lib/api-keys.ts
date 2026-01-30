import { prisma } from './prisma'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

// Fail threshold: disable key temporarily after failures
const MAX_FAIL_COUNT = 3 // Reduced from 5
const DISABLE_DURATION_MS = 60 * 60 * 1000 // 1 hour for permanent disable
const TEMP_DISABLE_MS = 5 * 60 * 1000 // 5 minutes temporary disable on rate limit

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  // Derive a 32-byte key from the provided key using SHA-256
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypts an API key using AES-256-GCM
 * Returns a base64 string containing: salt + iv + authTag + encryptedData
 */
export function encryptKey(plainKey: string): string {
  const encryptionKey = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv)

  let encrypted = cipher.update(plainKey, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Combine: salt + iv + authTag + encrypted data
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ])

  return combined.toString('base64')
}

/**
 * Decrypts an API key that was encrypted with encryptKey()
 */
export function decryptKey(encryptedData: string): string {
  const encryptionKey = getEncryptionKey()
  const combined = Buffer.from(encryptedData, 'base64')

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

  // Salt is included for future use (e.g., key derivation) but not used in current implementation
  void salt

  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Returns the first active API key that is not currently disabled.
 * Returns null if no active keys are available.
 */
export async function getActiveKey(): Promise<string | null> {
  const now = new Date()

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      is_active: true,
      OR: [
        { disabled_until: null },
        { disabled_until: { lt: now } }
      ]
    },
    orderBy: {
      last_used: 'asc' // Prefer least recently used key for load balancing
    }
  })

  if (!apiKey) {
    return null
  }

  // Update last_used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { last_used: now }
  })

  return decryptKey(apiKey.key_encrypted)
}

/**
 * Returns the first active API key record (including the encrypted key and id).
 * Used when you need to track which key was used for marking success/failure.
 */
export async function getActiveKeyWithId(): Promise<{ id: string; key: string } | null> {
  const now = new Date()

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      is_active: true,
      OR: [
        { disabled_until: null },
        { disabled_until: { lt: now } }
      ]
    },
    orderBy: {
      last_used: 'asc'
    }
  })

  if (!apiKey) {
    return null
  }

  // Update last_used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { last_used: now }
  })

  return {
    id: apiKey.id,
    key: decryptKey(apiKey.key_encrypted)
  }
}

/**
 * Marks an API key as failed.
 * If isRateLimit is true, temporarily disables the key for 5 minutes.
 * If fail_count exceeds threshold, disables for 1 hour.
 *
 * @param keyId - The ID of the key to mark as failed
 * @param isRateLimit - If true, temporarily disable immediately to allow failover
 */
export async function markKeyFailed(keyId: string, isRateLimit: boolean = false): Promise<void> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: keyId }
  })

  if (!apiKey) {
    return
  }

  const newFailCount = apiKey.fail_count + 1
  const shouldPermanentlyDisable = newFailCount > MAX_FAIL_COUNT

  let disabledUntil: Date | null = apiKey.disabled_until

  if (shouldPermanentlyDisable) {
    // Disable for 1 hour after too many failures
    disabledUntil = new Date(Date.now() + DISABLE_DURATION_MS)
  } else if (isRateLimit) {
    // Temporarily disable for 5 minutes on rate limit to force failover
    disabledUntil = new Date(Date.now() + TEMP_DISABLE_MS)
  }

  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      fail_count: newFailCount,
      disabled_until: disabledUntil
    }
  })
}

/**
 * Marks an API key as successful.
 * Resets fail_count to 0 and clears disabled_until.
 */
export async function markKeySuccess(keyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      fail_count: 0,
      disabled_until: null
    }
  })
}

/**
 * Adds a new API key to the database.
 * The key is encrypted before storage.
 */
export async function addApiKey(plainKey: string, provider: string = 'openrouter'): Promise<string> {
  const encryptedKey = encryptKey(plainKey)

  const apiKey = await prisma.apiKey.create({
    data: {
      key_encrypted: encryptedKey,
      provider,
      is_active: true,
      fail_count: 0
    }
  })

  return apiKey.id
}

/**
 * Deactivates an API key (soft delete).
 */
export async function deactivateKey(keyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { is_active: false }
  })
}

/**
 * Reactivates a previously deactivated or disabled API key.
 * Resets fail_count and clears disabled_until.
 */
export async function reactivateKey(keyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      is_active: true,
      fail_count: 0,
      disabled_until: null
    }
  })
}
