import { LoopManager } from "./redis/loop";

async function main() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    
    try {
        const loopManager = new LoopManager(redisUrl);
        await loopManager.start();
        console.log("AI Agent service started successfully");
    } catch (error) {
        console.error("Failed to start AI Agent service:", error);
        process.exit(1);
    }
}

main(); 