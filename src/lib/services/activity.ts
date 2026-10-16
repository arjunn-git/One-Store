import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "./auth";
import type { ActivityEvent, ActivityEventType } from "@/lib/types/database";

declare global {
  // eslint-disable-next-line no-var
  var __one_store_activity_stream__: ActivityEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __one_store_active_sessions__: Map<string, ActiveSessionRecord> | undefined;
}

export interface ActiveSessionRecord {
  sessionId: string;
  authUserId?: string;
  market: "IN" | "GB";
  lastActiveAt: number;
}

const ACTIVITY_FILE = path.join(process.cwd(), ".system_activity_stream.json");

function loadPersistedActivities(): ActivityEvent[] {
  try {
    if (fs.existsSync(ACTIVITY_FILE)) {
      const data = fs.readFileSync(ACTIVITY_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function persistActivities(events: ActivityEvent[]) {
  try {
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(events.slice(0, 200)), "utf-8");
  } catch {}
}

function getActivityStream(): ActivityEvent[] {
  if (!globalThis.__one_store_activity_stream__) {
    globalThis.__one_store_activity_stream__ = loadPersistedActivities();
  }
  return globalThis.__one_store_activity_stream__;
}

function getActiveSessionsMap(): Map<string, ActiveSessionRecord> {
  if (!globalThis.__one_store_active_sessions__) {
    globalThis.__one_store_active_sessions__ = new Map<string, ActiveSessionRecord>();
  }
  return globalThis.__one_store_active_sessions__;
}

export async function recordSessionHeartbeat(params: {
  sessionId: string;
  market?: "IN" | "GB";
  authUserId?: string;
}): Promise<void> {
  const { sessionId, market = "IN", authUserId } = params;
  if (!sessionId) return;

  const sessions = getActiveSessionsMap();
  sessions.set(sessionId, {
    sessionId,
    market,
    authUserId,
    lastActiveAt: Date.now(),
  });

  // Prune sessions older than 30 minutes in memory
  const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
  for (const [id, rec] of sessions.entries()) {
    if (rec.lastActiveAt < thirtyMinsAgo) {
      sessions.delete(id);
    }
  }

  // Also persist to Supabase active_sessions if live configured
  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      await admin.from("active_sessions").upsert(
        {
          session_id: sessionId,
          market,
          auth_user_id: authUserId || null,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );
    } catch {
      // Non-blocking
    }
  }
}

export async function getActiveShoppersCount(): Promise<number> {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const cutoff = new Date(fifteenMinutesAgo).toISOString();
      const { data, count, error } = await admin
        .from("active_sessions")
        .select("session_id", { count: "exact", head: false })
        .gte("last_active_at", cutoff);

      if (!error && typeof count === "number") {
        return count;
      }
      if (Array.isArray(data)) {
        return data.length;
      }
    } catch {
      // Fallback to memory
    }
  }

  // Memory calculation for real active sessions
  const sessions = getActiveSessionsMap();
  let activeCount = 0;
  for (const rec of sessions.values()) {
    if (rec.lastActiveAt >= fifteenMinutesAgo) {
      activeCount++;
    }
  }
  return activeCount;
}

export async function recordActivity(event: {
  type: ActivityEventType;
  action: string;
  actor?: string;
  authUserId?: string;
  anonymousSessionId?: string;
  market?: "IN" | "GB";
  currency?: "INR" | "GBP";
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<ActivityEvent> {
  const stream = getActivityStream();

  const newEvent: ActivityEvent = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: event.type,
    action: event.action,
    actor: event.actor || "Guest Shopper",
    authUserId: event.authUserId,
    anonymousSessionId: event.anonymousSessionId,
    market: event.market || "IN",
    currency: event.currency || (event.market === "GB" ? "GBP" : "INR"),
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details || {},
    ipAddress: event.ipAddress,
    timestamp: new Date().toISOString(),
  };

  // If a session ID is present, update session telemetry
  if (event.anonymousSessionId) {
    recordSessionHeartbeat({
      sessionId: event.anonymousSessionId,
      market: newEvent.market,
      authUserId: newEvent.authUserId,
    }).catch(() => {});
  }

  // Prepend to in-memory activity ring (max 200 items)
  stream.unshift(newEvent);
  if (stream.length > 200) {
    stream.length = 200;
  }
  persistActivities(stream);

  // Also persist to Supabase activity_events & audit_logs in background if configured
  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      await Promise.allSettled([
        admin.from("activity_events").insert({
          id: newEvent.id,
          type: newEvent.type,
          action: newEvent.action,
          actor: newEvent.actor,
          auth_user_id: newEvent.authUserId || null,
          anonymous_session_id: newEvent.anonymousSessionId || null,
          market: newEvent.market,
          currency: newEvent.currency,
          resource_type: newEvent.resourceType,
          resource_id: newEvent.resourceId || null,
          details: newEvent.details || {},
          ip_address: newEvent.ipAddress || null,
          created_at: newEvent.timestamp,
        }),
        admin.from("audit_logs").insert({
          action: `${newEvent.type}:${newEvent.action}`,
          resource_type: newEvent.resourceType,
          resource_id: newEvent.resourceId || null,
          details: {
            ...newEvent.details,
            actor: newEvent.actor,
            market: newEvent.market,
            currency: newEvent.currency,
            activity_id: newEvent.id,
          },
          ip_address: newEvent.ipAddress || null,
          created_at: newEvent.timestamp,
        }),
      ]);
    } catch {
      // Supabase logging error suppressed to avoid blocking operational requests
    }
  }

  return newEvent;
}

export async function getRecentActivities(options?: {
  limit?: number;
  since?: string;
  type?: string;
  market?: "IN" | "GB";
}): Promise<ActivityEvent[]> {
  const limit = Math.min(options?.limit || 50, 100);
  const dbEvents: ActivityEvent[] = [];

  // 1. Try querying Supabase activity_events table if configured
  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      let query = admin
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (options?.type && options.type !== "ALL") {
        query = query.eq("type", options.type);
      }
      if (options?.market) {
        query = query.eq("market", options.market);
      }
      if (options?.since) {
        query = query.gt("created_at", options.since);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        data.forEach((row) => {
          dbEvents.push({
            id: row.id,
            type: row.type as ActivityEventType,
            action: row.action,
            actor: row.actor,
            authUserId: row.auth_user_id || undefined,
            anonymousSessionId: row.anonymous_session_id || undefined,
            market: row.market,
            currency: row.currency,
            resourceType: row.resource_type,
            resourceId: row.resource_id || undefined,
            details: row.details || {},
            ipAddress: row.ip_address || undefined,
            timestamp: row.created_at,
          });
        });
      }
    } catch {
      // Fall through to file/memory buffer
    }
  }

  // 2. Query file-backed in-memory ring buffer
  const stream = getActivityStream();

  // Combine and deduplicate
  const seenIds = new Set<string>();
  const combined: ActivityEvent[] = [];
  for (const e of [...dbEvents, ...stream]) {
    if (!seenIds.has(e.id)) {
      seenIds.add(e.id);
      combined.push(e);
    }
  }

  let filtered = combined;

  if (options?.type && options.type !== "ALL") {
    filtered = filtered.filter((e) => e.type === options.type);
  }

  if (options?.market) {
    filtered = filtered.filter((e) => e.market === options.market);
  }

  if (options?.since) {
    const sinceTime = new Date(options.since).getTime();
    if (!isNaN(sinceTime)) {
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
    }
  }

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return filtered.slice(0, limit);
}
