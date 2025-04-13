// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract DFArenaFaucet {
    uint256 public waitTime = 24 hours;
    address public _owner;
    uint256 public amount = 0.05 ether;

    mapping(address => uint256) public nextAccessTime;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AmountChanged(uint256 oldAmount, uint256 newAmount);
    event WaitTimeChanged(uint256 oldTime, uint256 newTime);

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    constructor() {
        _owner = msg.sender;
    }

    /*******************************Admin Controls *************************************/

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function changeDrip(uint256 newAmount) public onlyOwner {
        require(newAmount != 0, "New drip is zero");
        uint256 oldAmount = amount;
        amount = newAmount;
        emit AmountChanged(oldAmount, newAmount);
    }

    function changeWaitTime(uint256 waitTimeSeconds) public onlyOwner {
        require(waitTimeSeconds != 0, "New wait time cannot be zero");
        uint256 oldTime = waitTime;
        waitTime = waitTimeSeconds;
        emit WaitTimeChanged(oldTime, waitTimeSeconds);
    }

    /*******************************Functionality *************************************/

    function canWithdraw(address _address) public view returns (bool) {
        /* Admin can always withdraw. Can withdraw if have not received drip or allowed to access again */
        return (_address == _owner || nextAccessTime[_address] == 0 || block.timestamp >= nextAccessTime[_address]);
    }

    function drip(address _address) public onlyOwner {
        require(canWithdraw(_address), "you can't withdraw yet");
        require(amount < address(this).balance, "faucet out of funds");
        bool success = payable(_address).send(amount);
        require(success, "eth transfer failed");
        nextAccessTime[_address] = block.timestamp + waitTime;
    }

    function withdraw(address _address) public onlyOwner {
        bool success = payable(_address).send(getBalance());
        require(success, "withdraw failed");
    }

    /***********************************Getters*************************************** */

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getOwner() public view returns (address) {
        return _owner;
    }

    function getWaitTime() public view returns (uint256) {
        return waitTime;
    }

    function getDripAmount() public view returns (uint256) {
        return amount;
    }

    function getNextAccessTime(address _recipient) public view returns (uint256) {
        return nextAccessTime[_recipient];
    }

    function getTimeUntilDrip(address _recipient) public view returns (uint256) {
        require(nextAccessTime[_recipient] != 0);
        return nextAccessTime[_recipient] - block.timestamp;
    }

    receive() external payable {}
}