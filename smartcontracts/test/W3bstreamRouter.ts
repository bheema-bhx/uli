// import { expect } from 'chai';
// import { ethers } from 'hardhat';

// describe('Uli_ocl Router', function () {
//   let uli_oclRouter;
//   let fleetManagement;
//   let uli_oclCredit;
//   let project;
//   let uli_oclProject;
//   let uli_oclProver;
//   let mockProcessor;
//   let mockStakingHub;

//   beforeEach(async function () {
//     uli_oclRouter = await ethers.deployContract('Uli_oclRouter');
//     fleetManagement = await ethers.deployContract('FleetManagement');
//     uli_oclCredit = await ethers.deployContract('Uli_oclCredit');
//     project = await ethers.deployContract('MockProject');
//     uli_oclProject = await ethers.deployContract('Uli_oclProject');
//     uli_oclProver = await ethers.deployContract('Uli_oclProver');
//     mockProcessor = await ethers.deployContract('MockProcessor');
//     mockStakingHub = await ethers.deployContract('MockStakingHub', [100]);
//     await uli_oclRouter.initialize(fleetManagement.getAddress(), uli_oclProject.getAddress());
//     await fleetManagement.initialize(100);
//     await uli_oclProject.initialize(project.target);
//     await uli_oclProver.initialize('Uli_ocl Prover', 'W3BProver');
//     await uli_oclCredit.initialize('Uli_oclCredit', 'W3BC');
//   });

//   it('route', async function () {
//     const [owner, binder, coordinator, projectOwner, prover] = await ethers.getSigners();
//     await uli_oclCredit.setMinter(fleetManagement.getAddress());
//     await uli_oclProver.setMinter(fleetManagement.getAddress());
//     await fleetManagement.setCoordinator(coordinator.address);
//     await fleetManagement.setStakingHub(mockStakingHub.getAddress());
//     await fleetManagement.setProverStore(uli_oclProver.getAddress());
//     await fleetManagement.setCreditCenter(uli_oclCredit.getAddress());
//     await fleetManagement.setRegistrationFee(12345);
//     await fleetManagement.connect(prover).register({ value: 12345 });
//     await mockStakingHub.setAmount(100);
//     await uli_oclProject.setBinder(binder.address);

//     await project.connect(projectOwner).register();

//     const projectId = 1;
//     await uli_oclProject.connect(binder).bind(projectId);

//     const proverId = 1;
//     const clientId = '_testClientId';
//     await uli_oclProver.connect(prover).resume(proverId);
//     await uli_oclProject.connect(projectOwner).resume(projectId);
//     await uli_oclRouter.connect(projectOwner).bindDapp(projectId, mockProcessor.getAddress());
//     await uli_oclRouter.connect(coordinator).route(projectId, proverId, clientId, '0x0000');

//     const iface = new ethers.Interface(`[
//       {
//         "inputs": [{
//           "internalType": "string",
//           "name": "",
//           "type": "string"
//         }],
//         "name": "Error",
//         "type": "error"
//       },
//       {
//         "inputs": [],
//         "name": "CustomError",
//         "type": "error"
//       }
//     ]`);

//     const revertData = iface.encodeErrorResult('Error', ['Normal Error']);
//     await mockProcessor.setErrorType(1);
//     await expect(uli_oclRouter.connect(coordinator).route(projectId, proverId, clientId, '0x0000'))
//       .to.emit(uli_oclRouter, 'DataProcessed')
//       .withArgs(projectId, proverId, coordinator.address, false, revertData);

//     const customErrorData = iface.encodeErrorResult('CustomError', []);
//     await mockProcessor.setErrorType(2);
//     await expect(uli_oclRouter.connect(coordinator).route(projectId, proverId, clientId, '0x0000'))
//       .to.emit(uli_oclRouter, 'DataProcessed')
//       .withArgs(projectId, proverId, coordinator.address, false, customErrorData);
//   });
// });
