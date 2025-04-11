"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnconfirmedNotReadyTx = exports.isUnconfirmedReadyTx = exports.isUnconfirmedClaimVictoryTx = exports.isUnconfirmedCapturePlanetTx = exports.isUnconfirmedInvadePlanetTx = exports.isUnconfirmedGetShipsTx = exports.isUnconfirmedWithdrawSilverTx = exports.isUnconfirmedDeactivateArtifactTx = exports.isUnconfirmedActivateArtifactTx = exports.isUnconfirmedProspectPlanetTx = exports.isUnconfirmedWithdrawArtifactTx = exports.isUnconfirmedDepositArtifactTx = exports.isUnconfirmedFindArtifactTx = exports.isUnconfirmedTransferTx = exports.isUnconfirmedBuyHatTx = exports.isUnconfirmedUpgradeTx = exports.isUnconfirmedReleaseTx = exports.isUnconfirmedMoveTx = exports.isUnconfirmedInitTx = exports.isUnconfirmedRevealTx = exports.isUnconfirmedNotReady = exports.isUnconfirmedReady = exports.isUnconfirmedClaimVictory = exports.isUnconfirmedInvadePlanet = exports.isUnconfirmedCapturePlanet = exports.isUnconfirmedGetShips = exports.isUnconfirmedWithdrawSilver = exports.isUnconfirmedDeactivateArtifact = exports.isUnconfirmedActivateArtifact = exports.isUnconfirmedProspectPlanet = exports.isUnconfirmedWithdrawArtifact = exports.isUnconfirmedDepositArtifact = exports.isUnconfirmedFindArtifact = exports.isUnconfirmedTransfer = exports.isUnconfirmedBuyHat = exports.isUnconfirmedUpgrade = exports.isUnconfirmedRelease = exports.isUnconfirmedMove = exports.isUnconfirmedInit = exports.isUnconfirmedReveal = void 0;
// @todo:
// - these `isUnconfirmedX` should be named something that matches the naming convention of the
//   `TxIntent` subtypes - `isXIntent`
// - these `isUnconfirmedX` should check something more than the method name
function isUnconfirmedReveal(txIntent) {
    return txIntent.methodName === 'revealLocation';
}
exports.isUnconfirmedReveal = isUnconfirmedReveal;
function isUnconfirmedInit(txIntent) {
    return txIntent.methodName === 'initializePlayer';
}
exports.isUnconfirmedInit = isUnconfirmedInit;
function isUnconfirmedMove(txIntent) {
    return txIntent.methodName === 'move';
}
exports.isUnconfirmedMove = isUnconfirmedMove;
function isUnconfirmedRelease(txIntent) {
    return isUnconfirmedMove(txIntent) && txIntent.abandoning;
}
exports.isUnconfirmedRelease = isUnconfirmedRelease;
function isUnconfirmedUpgrade(txIntent) {
    return txIntent.methodName === 'upgradePlanet';
}
exports.isUnconfirmedUpgrade = isUnconfirmedUpgrade;
function isUnconfirmedBuyHat(txIntent) {
    return txIntent.methodName === 'buyHat';
}
exports.isUnconfirmedBuyHat = isUnconfirmedBuyHat;
function isUnconfirmedTransfer(txIntent) {
    return txIntent.methodName === 'transferPlanet';
}
exports.isUnconfirmedTransfer = isUnconfirmedTransfer;
function isUnconfirmedFindArtifact(txIntent) {
    return txIntent.methodName === 'findArtifact';
}
exports.isUnconfirmedFindArtifact = isUnconfirmedFindArtifact;
function isUnconfirmedDepositArtifact(txIntent) {
    return txIntent.methodName === 'depositArtifact';
}
exports.isUnconfirmedDepositArtifact = isUnconfirmedDepositArtifact;
function isUnconfirmedWithdrawArtifact(txIntent) {
    return txIntent.methodName === 'withdrawArtifact';
}
exports.isUnconfirmedWithdrawArtifact = isUnconfirmedWithdrawArtifact;
function isUnconfirmedProspectPlanet(txIntent) {
    return txIntent.methodName === 'prospectPlanet';
}
exports.isUnconfirmedProspectPlanet = isUnconfirmedProspectPlanet;
function isUnconfirmedActivateArtifact(txIntent) {
    return txIntent.methodName === 'activateArtifact';
}
exports.isUnconfirmedActivateArtifact = isUnconfirmedActivateArtifact;
function isUnconfirmedDeactivateArtifact(txIntent) {
    return txIntent.methodName === 'deactivateArtifact';
}
exports.isUnconfirmedDeactivateArtifact = isUnconfirmedDeactivateArtifact;
function isUnconfirmedWithdrawSilver(txIntent) {
    return txIntent.methodName === 'withdrawSilver';
}
exports.isUnconfirmedWithdrawSilver = isUnconfirmedWithdrawSilver;
function isUnconfirmedGetShips(txIntent) {
    return txIntent.methodName === 'giveSpaceShips';
}
exports.isUnconfirmedGetShips = isUnconfirmedGetShips;
function isUnconfirmedCapturePlanet(txIntent) {
    return txIntent.methodName === 'capturePlanet';
}
exports.isUnconfirmedCapturePlanet = isUnconfirmedCapturePlanet;
function isUnconfirmedInvadePlanet(txIntent) {
    return txIntent.methodName === 'invadePlanet';
}
exports.isUnconfirmedInvadePlanet = isUnconfirmedInvadePlanet;
function isUnconfirmedClaimVictory(txIntent) {
    return txIntent.methodName === 'claimVictory';
}
exports.isUnconfirmedClaimVictory = isUnconfirmedClaimVictory;
function isUnconfirmedReady(txIntent) {
    return txIntent.methodName === 'ready';
}
exports.isUnconfirmedReady = isUnconfirmedReady;
function isUnconfirmedNotReady(txIntent) {
    return txIntent.methodName === 'notReady';
}
exports.isUnconfirmedNotReady = isUnconfirmedNotReady;
function isUnconfirmedRevealTx(tx) {
    return isUnconfirmedReveal(tx.intent);
}
exports.isUnconfirmedRevealTx = isUnconfirmedRevealTx;
function isUnconfirmedInitTx(tx) {
    return isUnconfirmedInit(tx.intent);
}
exports.isUnconfirmedInitTx = isUnconfirmedInitTx;
function isUnconfirmedMoveTx(tx) {
    return isUnconfirmedMove(tx.intent);
}
exports.isUnconfirmedMoveTx = isUnconfirmedMoveTx;
function isUnconfirmedReleaseTx(tx) {
    return isUnconfirmedRelease(tx.intent);
}
exports.isUnconfirmedReleaseTx = isUnconfirmedReleaseTx;
function isUnconfirmedUpgradeTx(tx) {
    return isUnconfirmedUpgrade(tx.intent);
}
exports.isUnconfirmedUpgradeTx = isUnconfirmedUpgradeTx;
function isUnconfirmedBuyHatTx(tx) {
    return isUnconfirmedBuyHat(tx.intent);
}
exports.isUnconfirmedBuyHatTx = isUnconfirmedBuyHatTx;
function isUnconfirmedTransferTx(tx) {
    return isUnconfirmedTransfer(tx.intent);
}
exports.isUnconfirmedTransferTx = isUnconfirmedTransferTx;
function isUnconfirmedFindArtifactTx(tx) {
    return isUnconfirmedFindArtifact(tx.intent);
}
exports.isUnconfirmedFindArtifactTx = isUnconfirmedFindArtifactTx;
function isUnconfirmedDepositArtifactTx(tx) {
    return isUnconfirmedDepositArtifact(tx.intent);
}
exports.isUnconfirmedDepositArtifactTx = isUnconfirmedDepositArtifactTx;
function isUnconfirmedWithdrawArtifactTx(tx) {
    return isUnconfirmedWithdrawArtifact(tx.intent);
}
exports.isUnconfirmedWithdrawArtifactTx = isUnconfirmedWithdrawArtifactTx;
function isUnconfirmedProspectPlanetTx(tx) {
    return isUnconfirmedProspectPlanet(tx.intent);
}
exports.isUnconfirmedProspectPlanetTx = isUnconfirmedProspectPlanetTx;
function isUnconfirmedActivateArtifactTx(tx) {
    return isUnconfirmedActivateArtifact(tx.intent);
}
exports.isUnconfirmedActivateArtifactTx = isUnconfirmedActivateArtifactTx;
function isUnconfirmedDeactivateArtifactTx(tx) {
    return isUnconfirmedDeactivateArtifact(tx.intent);
}
exports.isUnconfirmedDeactivateArtifactTx = isUnconfirmedDeactivateArtifactTx;
function isUnconfirmedWithdrawSilverTx(tx) {
    return isUnconfirmedWithdrawSilver(tx.intent);
}
exports.isUnconfirmedWithdrawSilverTx = isUnconfirmedWithdrawSilverTx;
function isUnconfirmedGetShipsTx(tx) {
    return isUnconfirmedGetShips(tx.intent);
}
exports.isUnconfirmedGetShipsTx = isUnconfirmedGetShipsTx;
function isUnconfirmedInvadePlanetTx(tx) {
    return isUnconfirmedInvadePlanet(tx.intent);
}
exports.isUnconfirmedInvadePlanetTx = isUnconfirmedInvadePlanetTx;
function isUnconfirmedCapturePlanetTx(tx) {
    return isUnconfirmedCapturePlanet(tx.intent);
}
exports.isUnconfirmedCapturePlanetTx = isUnconfirmedCapturePlanetTx;
function isUnconfirmedClaimVictoryTx(tx) {
    return isUnconfirmedClaimVictory(tx.intent);
}
exports.isUnconfirmedClaimVictoryTx = isUnconfirmedClaimVictoryTx;
function isUnconfirmedReadyTx(tx) {
    return isUnconfirmedReady(tx.intent);
}
exports.isUnconfirmedReadyTx = isUnconfirmedReadyTx;
function isUnconfirmedNotReadyTx(tx) {
    return isUnconfirmedNotReady(tx.intent);
}
exports.isUnconfirmedNotReadyTx = isUnconfirmedNotReadyTx;
//# sourceMappingURL=transactions.js.map