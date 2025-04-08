import Redis from "ioredis";
import { AgentService } from "../agent/agent";

export class LoopManager {
    private redis: Redis;
    private agent: AgentService;
    private static readonly LOOP_INTERVAL = 5000; // 5 seconds

    constructor(redisUrl: string) {
        this.redis = new Redis(redisUrl);
        this.agent = new AgentService();
        this.setupErrorHandling();
    }

    private setupErrorHandling() {
        this.redis.on("error", (error) => {
            console.error("Redis error:", error);
        });
    }

    async start() {
        console.log("Starting loop manager...");
        
        // Set up recurring timer using Redis
        const timer = setInterval(async () => {
            try {
                const response = await this.agent.processNextMessage();
                console.log("Agent response:", response);
            } catch (error) {
                console.error("Error in loop:", error);
            }
        }, LoopManager.LOOP_INTERVAL);

        // Handle graceful shutdown
        process.on("SIGTERM", () => {
            clearInterval(timer);
            this.redis.disconnect();
        });
    }
} 