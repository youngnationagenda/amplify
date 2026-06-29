// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private number;

    function store(uint256 _number) public {
        number = _number;
    }

    function retrieve() public view returns (uint256){
        return number;
    }
}
