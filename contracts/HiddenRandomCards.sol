// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "fhevm/lib/TFHE.sol";

contract HiddenRandomCards {
    // Store multiple encrypted random numbers
    euint8 public randomEncryptedNumber;
    euint8 public randomEncryptedNumber1;
    euint8 public randomEncryptedNumber2;

    function generateRandomNumber() external {
        randomEncryptedNumber = TFHE.randEuint8();
        randomEncryptedNumber1 = TFHE.randEuint8();
        randomEncryptedNumber2 = TFHE.randEuint8();

        TFHE.allow(randomEncryptedNumber, address(this));
        TFHE.allow(randomEncryptedNumber1, address(this));
        TFHE.allow(randomEncryptedNumber2, address(this));

        TFHE.allow(randomEncryptedNumber, msg.sender);
        TFHE.allow(randomEncryptedNumber1, msg.sender);
        TFHE.allow(randomEncryptedNumber2, msg.sender);
    }

    // Function to view encrypted random numbers
    function viewEncryptedRandomNumber() public view returns (euint8, euint8, euint8) {
        return (randomEncryptedNumber, randomEncryptedNumber1, randomEncryptedNumber2);
    }
}
