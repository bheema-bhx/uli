import { ethers, upgrades } from 'hardhat';

async function main() {
  // if (process.env.ULI_OCL_TASK_MANAGER) {
  //   const Uli_oclTaskManager = await ethers.getContractFactory('Uli_oclTaskManager');
  //   await upgrades.forceImport(process.env.ULI_OCL_TASK_MANAGER, Uli_oclTaskManager);
  //   await upgrades.upgradeProxy(process.env.ULI_OCL_TASK_MANAGER, Uli_oclTaskManager, {});
  //   console.log(`Upgrade Uli_oclTaskManager ${process.env.ULI_OCL_TASK_MANAGER} successfull!`);
  // }

  if (process.env.ULI_OCL_TASK_MANAGER) {
    const Uli_oclTaskManager = await ethers.getContractFactory('Uli_oclTaskManager');
    await upgrades.upgradeProxy(process.env.ULI_OCL_TASK_MANAGER, Uli_oclTaskManager, {});
    console.log(`Upgrade Uli_oclTaskManager ${process.env.ULI_OCL_TASK_MANAGER} successfull!`);
  }

  if (process.env.ULI_OCL_PROJECT) {
    const Uli_oclProject = await ethers.getContractFactory('Uli_oclProject');
    await upgrades.upgradeProxy(process.env.ULI_OCL_PROJECT, Uli_oclProject, {});
    console.log(`Upgrade Uli_oclProject ${process.env.ULI_OCL_PROJECT} successfull!`);
  }

  if (process.env.ULI_OCL_ROUTER) {
    const Uli_oclRouter = await ethers.getContractFactory('Uli_oclRouter');
    await upgrades.upgradeProxy(process.env.ULI_OCL_ROUTER, Uli_oclRouter, {});
    console.log(`Upgrade Uli_oclRouter ${process.env.ULI_OCL_ROUTER} successfull!`);
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
