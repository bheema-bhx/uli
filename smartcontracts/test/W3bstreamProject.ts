import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Uli_ocl Project', function () {
  let project;
  let uli_oclProject;
  beforeEach(async function () {
    project = await ethers.deployContract('MockProject');
    uli_oclProject = await ethers.deployContract('Uli_oclProject');
  });
  it('bind project', async function () {
    const [owner, binder, projectOwner] = await ethers.getSigners();

    await project.connect(projectOwner).register();

    await uli_oclProject.initialize(project.target);
    await uli_oclProject.setBinder(binder.address);
    const projectId = 1;

    await uli_oclProject.connect(binder).bind(projectId);
    // TODO: read project id from event
    expect(await uli_oclProject.ownerOf(projectId)).to.equal(projectOwner.address);
    it('update config successfully', async function () {
      const uri = 'http://test';
      const hash = '0x0000000011111111222222223333333344444444555555556666666677777777';
      await uli_oclProject.connect(projectOwner).updateConfig(projectId, uri, hash);
      const cfg = await uli_oclProject.config(projectId);
      expect(cfg[0]).to.equal(uri);
      expect(cfg[1]).to.equal(hash);
    });
  });
});
