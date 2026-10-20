import { ethers, upgrades } from 'hardhat';

async function main() {
  let projectAddr: string = ''
  let projectRegistrationFee: string = '0.0'

  if (process.env.PROJECT_ADDRESS) {
    projectAddr = process.env.PROJECT_ADDRESS
  } else {
    const MockProject = await ethers.deployContract('MockProject', []);
    await MockProject.waitForDeployment();
    console.log(`MockProject deployed to ${MockProject.target}`);

    projectAddr = MockProject.target.toString()
  }

  const LivenessVerifier = await ethers.deployContract('LivenessVerifier', []);
  await LivenessVerifier.waitForDeployment();
  console.log(`LivenessVerifier deployed to ${LivenessVerifier.target}`);

  const MovementVerifier = await ethers.deployContract('MovementVerifier', []);
  await MovementVerifier.waitForDeployment();
  console.log(`MovementVerifier deployed to ${MovementVerifier.target}`);

  const MovementBatchVerifier = await ethers.deployContract('MovementBatchVerifier', []);
  await MovementBatchVerifier.waitForDeployment();
  console.log(`MovementBatchVerifier deployed to ${MovementBatchVerifier.target}`);

  if (process.env.DAPP_PROCESSOR) {
  } else {
    const MockDapp = await ethers.deployContract('MockDapp', []);
    await MockDapp.waitForDeployment();
    console.log(`MockDapp deployed to ${MockDapp.target}`);

    const MockDappLiveness = await ethers.deployContract('MockDappLiveness', [LivenessVerifier.target]);
    await MockDappLiveness.waitForDeployment();
    console.log(`MockDappLiveness deployed to ${MockDappLiveness.target}`);

    const MockDappMovementBatch = await ethers.deployContract('MockDappMovementBatch', [MovementBatchVerifier.target]);
    await MockDappMovementBatch.waitForDeployment();
    console.log(`MockDappMovementBatch deployed to ${MockDappMovementBatch.target}`);
  }
  if (process.env.PROJECT_REGISTRATION_FEE) {
    projectRegistrationFee = process.env.PROJECT_REGISTRATION_FEE
  }

  const [deployer] = await ethers.getSigners();

  const Uli_oclProject = await ethers.getContractFactory('Uli_oclProject');
  const project = await upgrades.deployProxy(Uli_oclProject, [projectAddr], {
    initializer: 'initialize',
  });
  await project.waitForDeployment();
  console.log(`Uli_oclProject deployed to ${project.target}`);

  const ProjectRegistrar = await ethers.getContractFactory('ProjectRegistrar');
  const projectRegistrar = await upgrades.deployProxy(ProjectRegistrar, [project.target], {
    initializer: 'initialize',
  });
  await projectRegistrar.waitForDeployment();
  console.log(`ProjectRegistrar deployed to ${projectRegistrar.target}`);
  let tx = await project.setBinder(projectRegistrar.target);
  await tx.wait();
  console.log(`Uli_oclProject binder set to ProjectRegistrar ${projectRegistrar.target}`);
  tx = await projectRegistrar.setRegistrationFee(ethers.parseEther(projectRegistrationFee));
  await tx.wait();
  console.log(`ProjectRegistrar registration fee set to ${projectRegistrationFee}`);

  const Uli_oclProver = await ethers.getContractFactory('Uli_oclProver');
  const prover = await upgrades.deployProxy(Uli_oclProver, [], {
    initializer: 'initialize',
  });
  await prover.waitForDeployment();
  console.log(`Uli_oclProver deployed to ${prover.target}`);

  const Uli_oclVMType = await ethers.getContractFactory('Uli_oclVMType');
  const vmtype = await upgrades.deployProxy(Uli_oclVMType, ['Uli_ocl VmType', 'WVTN'], {
    initializer: 'initialize',
  });
  await vmtype.waitForDeployment();
  console.log(`Uli_oclVMType deployed to ${vmtype.target}`);

  const Uli_oclDebits = await ethers.getContractFactory('Uli_oclDebits');
  const debits = await upgrades.deployProxy(Uli_oclDebits, [], {
    initializer: 'initialize',
  });
  await debits.waitForDeployment();
  console.log(`Uli_oclDebits deployed to ${debits.target}`);

  const Uli_oclProjectReward = await ethers.getContractFactory('Uli_oclProjectReward');
  const projectReward = await upgrades.deployProxy(Uli_oclProjectReward, [project.target], {
    initializer: 'initialize',
  });
  await projectReward.waitForDeployment();
  console.log(`Uli_oclProjectReward deployed to ${projectReward.target}`);

  const Uli_oclTaskManager = await ethers.getContractFactory('Uli_oclTaskManager');
  const taskManager = await upgrades.deployProxy(Uli_oclTaskManager, [debits.target, projectReward.target, prover.target], {
    initializer: 'initialize',
  });
  await taskManager.waitForDeployment();
  console.log(`Uli_oclTaskManager deployed to ${taskManager.target}`);

  const Uli_oclRouter = await ethers.getContractFactory('Uli_oclRouter');
  const router = await upgrades.deployProxy(Uli_oclRouter, [taskManager.target, prover.target, project.target], {
    initializer: 'initialize',
  });
  await router.waitForDeployment();
  console.log(`Uli_oclRouter deployed to ${router.target}`);

  const Uli_oclRewardDistributor = await ethers.getContractFactory('Uli_oclRewardDistributor');
  const distributor = await upgrades.deployProxy(Uli_oclRewardDistributor, [], {
    initializer: 'initialize',
  });
  await distributor.waitForDeployment();
  console.log(`Uli_oclRewardDistributor deployed to ${distributor.target}`);

  const Uli_oclMinter = await ethers.getContractFactory('Uli_oclMinter');
  const minter = await upgrades.deployProxy(Uli_oclMinter, [taskManager.target, distributor.target], {
    initializer: 'initialize',
  });
  await minter.waitForDeployment();
  console.log(`Uli_oclMinter deployed to ${minter.target}`);

  const MockIoID = await ethers.deployContract('MockIoID', []);
  await MockIoID.waitForDeployment();
  console.log(`MockIoID deployed to ${MockIoID.target}`);

  tx = await distributor.setOperator(minter.target);
  await tx.wait();
  console.log(`Uli_oclRewardDistributor add operator to ${minter.target}`);

  tx = await taskManager.addOperator(minter.target);
  await tx.wait();
  console.log(`Uli_oclTaskManager add operator to ${minter.target}`);

  tx = await taskManager.addOperator(router.target);
  await tx.wait();
  console.log(`Uli_oclTaskManager add operator to ${router.target}`);

  tx = await distributor.setOperator(minter.target);
  await tx.wait();
  console.log(`Uli_oclRewardDistributor set operator to ${minter.target}`);

  tx = await debits.setOperator(taskManager.target);
  await tx.wait();
  console.log(`Uli_oclDebits set operator to ${taskManager.target}`);

  tx = await minter.setReward(0);
  await tx.wait();
  console.log(`Uli_oclMinter set reward to 0`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
