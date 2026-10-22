/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 *
 * LM Studio Multi-Instance Pool Manager, Load Balancer & Circuit Breaker
 */

import { EventEmitter } from "node:events";
import { LmStudioClient } from "./lmstudio-client.js";
import type { ServerConfig } from "./config.js";
import type {
  InstanceConfig,
  InstanceHealth,
  InstanceMetrics,
  InstanceRole,
  InstanceRuntimeState,
  PoolStatusReport,
} from "./types.js";
import { REMOTE_FALLBACK_DIRECTIVE } from "./types.js";

export class AllInstancesUnavailableError extends Error {
  public readonly report: PoolStatusReport;
  public readonly fallbackDirective: string;

  constructor(report: PoolStatusReport, message?: string) {
    const defaultMsg =
      message ||
      `All ${report.totalCount} local LM Studio instance(s) are currently unavailable or offline.`;
    super(defaultMsg);
    this.name = "AllInstancesUnavailableError";
    this.report = report;
    this.fallbackDirective = REMOTE_FALLBACK_DIRECTIVE;
  }
}

export interface ManagedInstance extends InstanceRuntimeState {
  client: LmStudioClient;
}

export class PoolManager extends EventEmitter {
  private readonly config: ServerConfig;
  private readonly instances = new Map<string, ManagedInstance>();
  private healthIntervalTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(config: ServerConfig) {
    super();
    this.config = config;

    for (const instConfig of config.instances) {
      this.registerInstance(instConfig);
    }
  }

  private registerInstance(instConfig: InstanceConfig): ManagedInstance {
    const client = new LmStudioClient({
      baseUrl: instConfig.url,
      fallbackChatModel: this.config.fallbackChatModel,
      fallbackEmbedModel: this.config.fallbackEmbedModel,
      timeoutMs: this.config.timeoutMs,
      daemon: this.config.daemon,
      daemonPort: this.config.daemonPort,
      autoProxy: false,
      instances: [],
      healthCheckIntervalMs: this.config.healthCheckIntervalMs,
      maxConsecutiveFailures: this.config.maxConsecutiveFailures,
    });

    const metrics: InstanceMetrics = {
      totalRequests: 0,
      failedRequests: 0,
      inFlightRequests: 0,
      latencyMs: 0,
      loadedModels: [],
    };

    const managed: ManagedInstance = {
      config: instConfig,
      health: "UNKNOWN",
      metrics,
      consecutiveFailures: 0,
      client,
    };

    this.instances.set(instConfig.id, managed);
    return managed;
  }

  public addOrUpdateInstance(instConfig: InstanceConfig): void {
    const existing = this.instances.get(instConfig.id);
    if (existing) {
      existing.config = instConfig;
      // Re-instantiate client if URL changed
      if (existing.client.getBaseUrl() !== instConfig.url) {
        existing.client = new LmStudioClient({
          baseUrl: instConfig.url,
          fallbackChatModel: this.config.fallbackChatModel,
          fallbackEmbedModel: this.config.fallbackEmbedModel,
          timeoutMs: this.config.timeoutMs,
          daemon: this.config.daemon,
          daemonPort: this.config.daemonPort,
          autoProxy: false,
          instances: [],
          healthCheckIntervalMs: this.config.healthCheckIntervalMs,
          maxConsecutiveFailures: this.config.maxConsecutiveFailures,
        });
        existing.health = "UNKNOWN";
        existing.consecutiveFailures = 0;
      }
    } else {
      this.registerInstance(instConfig);
    }
    this.emitChange();
  }

  public removeInstance(id: string): boolean {
    const deleted = this.instances.delete(id);
    if (deleted) {
      this.emitChange();
    }
    return deleted;
  }

  public getInstances(): ManagedInstance[] {
    return Array.from(this.instances.values());
  }

  public getInstance(id: string): ManagedInstance | undefined {
    return this.instances.get(id);
  }

  public getPoolReport(): PoolStatusReport {
    const instances = Array.from(this.instances.values());
    const reportList = instances.map((inst) => ({
      config: inst.config,
      health: inst.health,
      metrics: { ...inst.metrics },
      consecutiveFailures: inst.consecutiveFailures,
      activeModelNames: inst.metrics.loadedModels,
    }));

    const activeCount = instances.filter((i) => i.health === "ONLINE").length;
    const totalCount = instances.length;
    const allOffline = totalCount > 0 && activeCount === 0;

    return {
      instances: reportList,
      activeCount,
      totalCount,
      allOffline,
    };
  }

  /**
   * Selects candidate instances sorted by Least-Connections & Priority for a role
   */
  public selectCandidates(role: InstanceRole): ManagedInstance[] {
    const matching = Array.from(this.instances.values()).filter((inst) => {
      const roles = inst.config.roles;
      return roles.includes("all") || roles.includes(role);
    });

    if (matching.length === 0) return [];

    // Prioritize ONLINE > UNKNOWN / DEGRADED > OFFLINE
    return matching.sort((a, b) => {
      const score = (status: InstanceHealth): number => {
        if (status === "ONLINE") return 3;
        if (status === "DEGRADED" || status === "UNKNOWN") return 2;
        return 1; // OFFLINE
      };

      const diff = score(b.health) - score(a.health);
      if (diff !== 0) return diff;

      // Least-connections
      if (a.metrics.inFlightRequests !== b.metrics.inFlightRequests) {
        return a.metrics.inFlightRequests - b.metrics.inFlightRequests;
      }

      // Priority (higher number = higher priority)
      const prioA = a.config.priority ?? 1;
      const prioB = b.config.priority ?? 1;
      if (prioA !== prioB) return prioB - prioA;

      // Lower latency
      return a.metrics.latencyMs - b.metrics.latencyMs;
    });
  }

  /**
   * Executes an operation with automatic failover across available instances.
   */
  public async executeWithFailover<T>(
    role: InstanceRole,
    operation: (client: LmStudioClient, instance: ManagedInstance) => Promise<T>
  ): Promise<T> {
    const candidates = this.selectCandidates(role);

    // If no candidate exists or all are strictly OFFLINE
    const hasViableCandidate = candidates.some((c) => c.health !== "OFFLINE");
    if (!hasViableCandidate && candidates.length > 0) {
      // Before completely giving up, trigger a fast health re-probe on the first candidate
      const candidate = candidates[0];
      if (candidate) {
        const health = await candidate.client.checkHealth();
        if (health.status === "ONLINE") {
          candidate.health = "ONLINE";
          candidate.consecutiveFailures = 0;
          candidate.metrics.loadedModels = health.modelNames;
          candidate.metrics.latencyMs = health.latencyMs;
        }
      }
    }

    const availableCandidates = this.selectCandidates(role).filter((c) => c.health !== "OFFLINE");
    const executionQueue = availableCandidates.length > 0 ? availableCandidates : candidates;

    if (executionQueue.length === 0) {
      throw new AllInstancesUnavailableError(
        this.getPoolReport(),
        `No LM Studio instance configured for role '${role}'.`
      );
    }

    const errors: Array<{ instanceId: string; url: string; error: string }> = [];

    for (const instance of executionQueue) {
      instance.metrics.inFlightRequests++;
      const startTime = Date.now();

      try {
        const result = await operation(instance.client, instance);

        // Success: record latency, reset failures, set ONLINE
        const latency = Date.now() - startTime;
        instance.metrics.latencyMs = latency;
        instance.metrics.totalRequests++;
        instance.consecutiveFailures = 0;
        instance.health = "ONLINE";

        return result;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        instance.metrics.failedRequests++;
        instance.consecutiveFailures++;

        if (instance.consecutiveFailures >= this.config.maxConsecutiveFailures) {
          instance.health = "OFFLINE";
        } else {
          instance.health = "DEGRADED";
        }

        errors.push({
          instanceId: instance.config.id,
          url: instance.config.url,
          error: errMsg,
        });

        console.error(
          `[lmstudio-pool] Instance '${instance.config.id}' (${instance.config.url}) failed: ${errMsg}. Trying next instance...`
        );
      } finally {
        instance.metrics.inFlightRequests = Math.max(0, instance.metrics.inFlightRequests - 1);
        this.emitChange();
      }
    }

    // If all candidates in queue failed:
    const errorDetails = errors.map((e) => `• ${e.instanceId} (${e.url}): ${e.error}`).join("\n");
    throw new AllInstancesUnavailableError(
      this.getPoolReport(),
      `All ${executionQueue.length} LM Studio instances failed for role '${role}':\n${errorDetails}`
    );
  }

  /**
   * Health-check a single instance and update its state
   */
  public async checkInstanceHealth(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    try {
      const health = await instance.client.checkHealth();
      instance.metrics.lastCheckedAt = Date.now();
      instance.metrics.latencyMs = health.latencyMs;

      if (health.status === "ONLINE") {
        instance.health = "ONLINE";
        instance.consecutiveFailures = 0;
        instance.metrics.loadedModels = health.modelNames;
      } else {
        instance.consecutiveFailures++;
        if (instance.consecutiveFailures >= this.config.maxConsecutiveFailures) {
          instance.health = "OFFLINE";
        } else {
          instance.health = "DEGRADED";
        }
      }
    } catch {
      instance.metrics.lastCheckedAt = Date.now();
      instance.consecutiveFailures++;
      instance.health = "OFFLINE";
    }
  }

  /**
   * Check all instances sequentially or in parallel
   */
  public async forceCheckAll(): Promise<PoolStatusReport> {
    const tasks = Array.from(this.instances.keys()).map((id) => this.checkInstanceHealth(id));
    await Promise.allSettled(tasks);
    this.emitChange();
    return this.getPoolReport();
  }

  public startHealthCheck(): void {
    if (this.healthIntervalTimer || this.isDestroyed) return;

    // Run first check right away in background
    void this.forceCheckAll();

    this.healthIntervalTimer = setInterval(() => {
      void this.forceCheckAll();
    }, this.config.healthCheckIntervalMs);

    if (this.healthIntervalTimer.unref) {
      this.healthIntervalTimer.unref();
    }
  }

  public stopHealthCheck(): void {
    if (this.healthIntervalTimer) {
      clearInterval(this.healthIntervalTimer);
      this.healthIntervalTimer = null;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopHealthCheck();
    this.instances.clear();
    this.removeAllListeners();
  }

  private emitChange(): void {
    if (!this.isDestroyed) {
      this.emit("stateChanged", this.getPoolReport());
    }
  }
}

