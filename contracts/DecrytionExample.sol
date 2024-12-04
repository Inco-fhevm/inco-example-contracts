// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract DecryptionExample is GatewayCaller {
    // Store multiple encrypted random numbers
    euint8 public randomEncryptedNumber;
    euint8 public randomEncryptedNumber1;

    uint8 public randomNumber;
    uint8 public randomNumber1;

    function generateRandomNumber() external {
        randomEncryptedNumber = TFHE.randEuint8();
        randomEncryptedNumber1 = TFHE.randEuint8();

        TFHE.allow(randomEncryptedNumber, address(this));
        TFHE.allow(randomEncryptedNumber1, address(this));

        // Request decryption of the final vote tallies
        uint256[] memory cts = new uint256[](2);
        cts[0] = Gateway.toUint256(randomEncryptedNumber);
        cts[1] = Gateway.toUint256(randomEncryptedNumber1);

        Gateway.requestDecryption(cts, this.decryptionCallback.selector, 0, block.timestamp + 100, false);
    }

    function decryptionCallback(
        uint256 /*requestID*/,
        uint8 decryptedRandomNumber1,
        uint8 decryptedRandomNumber2
    ) public onlyGateway returns (bool) {
        // Update plaintext tallies with decrypted values
        randomNumber = decryptedRandomNumber1;
        randomNumber1 = decryptedRandomNumber2;
        return true;
    }
}
