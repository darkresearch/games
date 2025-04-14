// Credit to https://github.com/dmamills/elo-rank
// License: MIT

import { K_FACTOR } from "./constants";

function getExpectedProb(p1Rating: number, p2Rating: number): number {
  return 1 / (1 + Math.pow(10, (p2Rating - p1Rating) / 400));
}
function updateRating(expected: number, actual: number, current: number): number {
  return Math.round(current + (K_FACTOR * (actual - expected)));
}

export function updateElo(p1Rating: number, p2Rating: number, p1Win: bool): Array<number> {  
    const expectedProbP1Win = getExpectedProb(p1Rating, p2Rating);
    const expectedProbP2Win = getExpectedProb(p1Rating, p2Rating);

    let p1NewRating: number, p2NewRating: number;
    if (p1Win) {
      p1NewRating = updateRating(expectedProbP1Win, 1, p1Rating);
      p2NewRating = updateRating(expectedProbP2Win, 0, p2Rating);
    } else {
      p1NewRating = updateRating(expectedProbP1Win, 0, p1Rating);
      p2NewRating = updateRating(expectedProbP2Win, 1, p2Rating);
    }

    return [p1NewRating, p2NewRating];
  }