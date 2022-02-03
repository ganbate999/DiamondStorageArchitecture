//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/// @title String Utils
/// @author abhi3700, hosokawa-zen
library Strings {

    /// @notice Get string`s length
    function length(string memory _base) internal pure returns (uint256) {
        bytes memory _baseBytes = bytes(_base);
        return _baseBytes.length;
    }

    /// @notice Concat string
    function append(string memory _base, string memory second) internal pure returns (string memory) {
        return string(abi.encodePacked(_base, second));
    }

    /// @notice Get string`s substring
    /// @param _offset Substring`s start offset
    /// @param _length Substring`s length
    function slice(string memory _base, uint256 _offset, uint256 _length) internal pure returns (string memory) {
        bytes memory _baseBytes = bytes(_base);

        assert(uint256(_offset + _length) <= _baseBytes.length);

        string memory _tmp = new string(uint256(_length));
        bytes memory _tmpBytes = bytes(_tmp);

        uint256 j = 0;
        for (uint256 i = uint256(_offset); i < uint256(_offset + _length); i++) {
            _tmpBytes[j++] = _baseBytes[i];
        }

        return string(_tmpBytes);
    }

    /// @notice Get string`s uppercase
    function upper(string memory _base) internal pure returns (string memory) {
        bytes memory _baseBytes = bytes(_base);
        for (uint256 i = 0; i < _baseBytes.length; i++) {
            if (_baseBytes[i] >= 0x61 && _baseBytes[i] <= 0x7A) {
                _baseBytes[i] = bytes1(uint8(_baseBytes[i]) - 32);
            }
        }
        return string(_baseBytes);
    }
}
