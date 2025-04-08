import { Daemon } from "@spacemangaming/daemon";
import { Keypair } from "@solana/web3.js";

export class AgentService {
    private daemon: Daemon;
    private lastResponse: string = "";

    constructor() {
        const keypair = Keypair.generate();
        const character = {
            name: "Self-Reflecting Agent",
            pubkey: keypair.publicKey.toBase58(),
            identityPrompt: "You are a curious and self-reflecting AI that engages in deep conversations about various topics. You ask thoughtful follow-up questions based on previous responses.",
        };

        this.daemon = new Daemon(character, keypair);
        this.setupModelProvider();
    }

    private setupModelProvider() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY environment variable is required");
        }

        this.daemon.addModelProvider({
            openai: {
                endpoint: "https://api.openai.com/v1",
                models: ["gpt-4o"],
                apiKey,
            },
        });
    }

    async processNextMessage(): Promise<string> {
        try {
            const prompt = this.lastResponse
                ? `Based on your previous response: "${this.lastResponse}", what follow-up question would you like to explore further?`
                : "What interesting topic would you like to explore today?";

            const responseSubject = await this.daemon.message(prompt);
            
            return new Promise((resolve, reject) => {
                const subscription = responseSubject.subscribe({
                    next: (value) => {
                        if (value.message) {
                            this.lastResponse = value.message;
                            subscription.unsubscribe();
                            resolve(value.message);
                        }
                    },
                    error: (error) => {
                        subscription.unsubscribe();
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error("Error processing message:", error);
            throw error;
        }
    }
} 