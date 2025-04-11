// Type declarations for external modules without native TypeScript definitions

declare module 'fastq' {
  export interface queue {
    push: (task: any, callback: (err: Error | null, result: any) => void) => void;
    length: () => number;
    concurrency: number;
    drain: (() => void) | null;
    empty: (() => void) | null;
    idle: () => boolean;
    pause: () => void;
    resume: () => void;
    kill: () => void;
    saturated: (() => void) | null;
  }

  export default function fastq(
    context: any,
    worker: (task: any, cb: (error: Error | null, result: any) => void) => void,
    concurrency: number
  ): queue;
}

declare module 'snarkjs' {
  export interface Groth16 {
    fullProve: (input: any, wasmFile: string, zkeyFile: string) => Promise<{
      proof: any;
      publicSignals: string[];
    }>;
  }

  export const groth16: Groth16;
} 