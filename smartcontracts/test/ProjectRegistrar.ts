import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Project Registrar', function () {
  let project;
  let projectRegistrar;
  let uli_oclProject;
  beforeEach(async function () {
    project = await ethers.deployContract('MockProject');
    uli_oclProject = await ethers.deployContract('Uli_oclProject');
    await uli_oclProject.initialize(project.target);
    projectRegistrar = await ethers.deployContract('ProjectRegistrar');
    await projectRegistrar.initialize(uli_oclProject.getAddress());
    await projectRegistrar.setRegistrationFee(12345);
  });
  it('register', async function () {
    const [owner, projectOwner] = await ethers.getSigners();
    await uli_oclProject.setBinder(projectRegistrar.getAddress());
    expect(await uli_oclProject.count()).to.equal(0);

    await project.connect(projectOwner).register();

    await projectRegistrar.connect(projectOwner).register(1, { value: 12345 });
    expect(await uli_oclProject.count()).to.equal(1);
    expect(await uli_oclProject.ownerOf(1)).to.equal(projectOwner.address);
  });
});
