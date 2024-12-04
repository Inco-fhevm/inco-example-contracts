// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC1155/utils/ERC1155Utils.sol)

pragma solidity ^0.8.24;

import {ConfidentialIERC1155Receiver} from "../ConfidentialIERC1155Receiver.sol";
import {IERC1155Errors} from "../draft-IERC6093.sol";
import "fhevm/lib/TFHE.sol";

/**
 * @dev Library that provide common ERC-1155 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-1155[ERC-1155].
 *
 * _Available since v5.1._
 */
library ConfidentialERC1155Utils {
    /**
     * @dev Performs an acceptance check for the provided `operator` by calling {IERC1155-onERC1155Received}
     * on the `to` address. The `operator` is generally the address that initiated the token transfer (i.e. `msg.sender`).
     *
     * The acceptance call is not executed and treated as a no-op if the target address doesn't contain code (i.e. an EOA).
     * Otherwise, the recipient must implement {IERC1155Receiver-onERC1155Received} and return the acceptance magic value to accept
     * the transfer.
     */
    function checkOnERC1155Received(
        address operator,
        address from,
        address to,
        uint256 id,
        euint64 value,
        bytes memory data
    ) internal {
        if (to.code.length > 0) {
            try ConfidentialIERC1155Receiver(to).onERC1155Received(operator, from, id, value, data) returns (bytes4 response) {
                if (response != ConfidentialIERC1155Receiver.onERC1155Received.selector) {
                    // Tokens rejected
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    // non-IERC1155Receiver implementer
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                } else {
                    assembly ("memory-safe") {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    /**
     * @dev Performs a batch acceptance check for the provided `operator` by calling {IERC1155-onERC1155BatchReceived}
     * on the `to` address. The `operator` is generally the address that initiated the token transfer (i.e. `msg.sender`).
     *
     * The acceptance call is not executed and treated as a no-op if the target address doesn't contain code (i.e. an EOA).
     * Otherwise, the recipient must implement {IERC1155Receiver-onERC1155Received} and return the acceptance magic value to accept
     * the transfer.
     */
    function checkOnERC1155BatchReceived(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        euint64[] memory values,
        bytes memory data
    ) internal {
        if (to.code.length > 0) {
            try ConfidentialIERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, values, data) returns (
                bytes4 response
            ) {
                if (response != ConfidentialIERC1155Receiver.onERC1155BatchReceived.selector) {
                    // Tokens rejected
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    // non-IERC1155Receiver implementer
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                } else {
                    assembly ("memory-safe") {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }
}
