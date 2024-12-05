// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity >=0.8.13 <0.9.0;

import "fhevm/lib/TFHE.sol";

contract ConfidentialDID {
    bytes32 private DOMAIN_SEPARATOR;
    address public trustedAgent;
    mapping(address => euint64) internal creditScores;
    mapping(address => ebool) internal isUserEligible;

    constructor(address _trustedAgent) {
        trustedAgent = _trustedAgent;
    }

    // Only a third party trusted agent should store user credit scores
    modifier onlyAgent() {
        require(msg.sender == trustedAgent);
        _;
    }

    function store(address user, einput encryptedCreditScore, bytes calldata inputProof) external /*onlyAgent */ {
        creditScores[user] = TFHE.asEuint64(encryptedCreditScore, inputProof);
        TFHE.allow(creditScores[user], address(this));
        TFHE.allow(creditScores[user], trustedAgent);
        TFHE.allow(creditScores[user], user);

        ebool isAbove700Encrypted = TFHE.gt(creditScores[user], TFHE.asEuint64(750));
        isUserEligible[user] = isAbove700Encrypted;
        TFHE.allow(isUserEligible[user], address(this));
        TFHE.allow(isUserEligible[user], trustedAgent);
        TFHE.allow(isUserEligible[user], user);
    }

    // External parties and smart contracts can verify that a user address has a score above 700 without knowing the actual score
    function isUserScoreAbove750(address user) external view returns (ebool) {
        return isUserEligible[user];
    }

    function viewOwnScore(address _userAddress) public view returns (euint64) {
        return creditScores[_userAddress];
    }
}
