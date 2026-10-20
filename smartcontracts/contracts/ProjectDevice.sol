// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IioID {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

interface IioIDRegistry {
    function ioID() external view returns (address);
    function deviceTokenId(address device) external view returns (uint256);
}

interface IUli_oclProject {
    function ownerOf(uint256 _projectId) external view returns (address);
    function isValidProject(uint256 _projectId) external view returns (bool);
}

contract ProjectDevice is Initializable {
    event Approve(uint256 projectId, address indexed device);
    event Unapprove(uint256 projectId, address indexed device);

    IioIDRegistry public ioIDRegistry;
    IUli_oclProject public uli_oclProject;

    mapping(uint256 => mapping(address => bool)) devices;

    function initialize(address _ioIDRegistry, address _uli_oclProject) external initializer {
        ioIDRegistry = IioIDRegistry(_ioIDRegistry);
        uli_oclProject = IUli_oclProject(_uli_oclProject);
    }

    function approve(uint256 _projectId, address[] calldata _devices) external {
        require(uli_oclProject.isValidProject(_projectId), "invalid project");
        require(uli_oclProject.ownerOf(_projectId) == msg.sender, "not project owner");

        for (uint i = 0; i < _devices.length; i++) {
            address _device = _devices[i];
            require(!devices[_projectId][_device], "already approved");

            uint256 _tokenId = ioIDRegistry.deviceTokenId(_device);
            IioID ioID = IioID(ioIDRegistry.ioID());
            require(ioID.ownerOf(_tokenId) != address(0), "invalid device");

            devices[_projectId][_device] = true;
            emit Approve(_projectId, _device);
        }
    }

    function unapprove(uint256 _projectId, address[] calldata _devices) external {
        require(uli_oclProject.isValidProject(_projectId), "invalid project");
        require(uli_oclProject.ownerOf(_projectId) == msg.sender, "not project owner");

        for (uint i = 0; i < _devices.length; i++) {
            address _device = _devices[i];
            require(devices[_projectId][_device], "not approve");

            devices[_projectId][_device] = false;
            emit Unapprove(_projectId, _device);
        }
    }

    function approved(uint256 _projectId, address _device) external view returns (bool) {
        return devices[_projectId][_device];
    }
}
