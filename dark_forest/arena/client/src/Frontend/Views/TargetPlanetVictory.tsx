import { address } from '@darkforest_eth/serde';
import { TooltipName } from '@darkforest_eth/types';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import TutorialManager, { TutorialState } from '../../Backend/GameLogic/TutorialManager';
import { ContractsAPIEvent } from '../../_types/darkforest/api/ContractsAPITypes';
import { Gold, Green, Red } from '../Components/Text';
import { LobbyButton } from '../Pages/Lobby/LobbyMapEditor';
import { TooltipTrigger } from '../Panes/Tooltip';
import { useGameover, useUIManager } from '../Utils/AppHooks';

export function TargetPlanetVictory() {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const canClaimVictory = uiManager.checkVictoryCondition();
  const gameover = useGameover();
  const player = uiManager.getAccount()
  if(!player) return <></>;
  const requiredPlanets = uiManager.contractConstants.TARGETS_REQUIRED_FOR_VICTORY;
  const requiredEnergy = uiManager.contractConstants.CLAIM_VICTORY_ENERGY_PERCENT;
  const [claiming, setClaiming] = useState(false);

  async function handleClaimVictory() {
    setClaiming(true);
    try {
      const tx = await gameManager.claimVictory();
      const res = await tx.confirmedPromise;
      // Manual emit just to be sure
      uiManager.getGameManager().getContractAPI().emit(ContractsAPIEvent.PlayerUpdate, player);
      uiManager.getGameManager().getContractAPI().emit(ContractsAPIEvent.Gameover);
    }
    catch(error) {
      setClaiming(false);
    }
  }

  if (gameover) {
    return <></>;
  }
  return (
    <>
      <GameoverContainer>
        {/* <TooltipTrigger
          extraContent={
            <>
              In this game, you need to capture <Red>{requiredPlanets}</Red> target planet
              {requiredPlanets !== 1 && 's'} and fill each with{' '}
              <Green>{requiredEnergy}% energy</Green>. Then you can claim victory and win the game!
            </>
          }
          name={TooltipName.Empty}
          style={{ gap: '5px' }}
        > */}
          <span style={{ marginInline: '5px' }}>
            <>
              Welcome to DARK Forest. In this game, SPUTNIK needs to capture <Red>{requiredPlanets}</Red> target planet
              {requiredPlanets !== 1 && 's'} and fill {requiredPlanets == 1 && 'it'}{requiredPlanets !== 1 && 'each'} with{' '}
              <Green>{requiredEnergy}% energy</Green>.
            </>
            <br />
            <br />
            (Currently captured: {gameManager.getTargetsHeld().length}/{requiredPlanets})
          </span>

          {/* {canClaimVictory && (
            <LobbyButton
              primary
              disabled={claiming}
              onClick={() => {
                const tutorialManager = TutorialManager.getInstance(this);
                tutorialManager.acceptInput(TutorialState.HowToGetScore);
                handleClaimVictory();
              }}
            >
              {claiming ? 'Claiming...' : 'Claim Victory'!}
            </LobbyButton>
          )} */}
        {/* </TooltipTrigger> */}
      </GameoverContainer>
      {/* <TimeContainer>Game length: {prettyTime(gameDuration)}</TimeContainer> */}
    </>
  );
}

const GameoverContainer = styled.div`
  text-align: center;
  max-width: 90%;
  margin: 0 auto;
  word-wrap: break-word;
  white-space: normal;
  padding: 10px 5px;
  
  @media (max-width: 576px) {
    max-width: 98%;
    font-size: 0.85em;
    line-height: 1.3;
  }
`;
const TimeContainer = styled.div`
  font-size: 1em;
  text-align: center;
`;
