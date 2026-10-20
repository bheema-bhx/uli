import { ethers, upgrades } from 'hardhat';

async function main() {
  if (!process.env.IOID_REGISTRY) {
    console.log(`Please provide ioID Registry address`);
    return;
  }
  if (!process.env.ULI_OCL_PROJECT) {
    console.log(`Please provide uli_ocl project address`);
    return;
  }

  const ProjectDevice = await ethers.getContractFactory('ProjectDevice');
  const pd = await upgrades.deployProxy(ProjectDevice, [process.env.IOID_REGISTRY, process.env.ULI_OCL_PROJECT], {
    initializer: 'initialize',
  });
  await pd.waitForDeployment();
  console.log(`ProjectDevice deployed to ${pd.target}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
