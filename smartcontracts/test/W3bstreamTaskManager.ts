// test/Uli_oclTaskManager.test.ts

import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, HDNodeWallet } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Uli_oclTaskManager", function () {
    let uli_oclDebits: Contract;
    let uli_oclReward: Contract;
    let uli_oclProver: Contract;
    let uli_oclTaskManager: Contract;
    let owner: SignerWithAddress;
    let operator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let token: Contract;
    let project: Contract;
    let uli_oclProject: Contract;
    let binder: SignerWithAddress;
    let projectOwner: SignerWithAddress;
    let projectId: number;
    let taskOwner: SignerWithAddress;
    let taskOwnerWallet: HDNodeWallet
    let sequencer: SignerWithAddress;
    let prover: SignerWithAddress;

    beforeEach(async function () {
        [owner, taskOwner, operator, user1, user2, binder, projectOwner, sequencer, prover] = await ethers.getSigners();
        const accounts = config.networks.hardhat.accounts;
        taskOwnerWallet = ethers.HDNodeWallet.fromMnemonic(
            ethers.Mnemonic.fromPhrase(accounts.mnemonic),
            "m/44'/60'/0'/0/1",
        );

        // Deploy debits contract
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        token = await ERC20Mock.deploy(
            "Mock Token",
            "MTK",
            owner.address,
            ethers.parseEther("10000")
        );
        await token.waitForDeployment();
        const Uli_oclDebits = await ethers.getContractFactory("Uli_oclDebits");
        uli_oclDebits = await upgrades.deployProxy(Uli_oclDebits, [], {
            initializer: "initialize",
        });
        await uli_oclDebits.waitForDeployment();

        // Deploy project reward contract
        project = await ethers.deployContract('MockProject');
        uli_oclProject = await ethers.deployContract('Uli_oclProject');
        await project.connect(projectOwner).register();
        await uli_oclProject.initialize(project.target);
        await uli_oclProject.setBinder(binder.address);
        projectId = 1;
        await uli_oclProject.connect(binder).bind(projectId);
        await uli_oclProject.connect(projectOwner).resume(projectId);
        uli_oclReward = await ethers.deployContract('Uli_oclProjectReward');
        await uli_oclReward.initialize(uli_oclProject.target);

        // Deploy prover contract
        const Uli_oclProver = await ethers.getContractFactory("Uli_oclProver");
        uli_oclProver = await Uli_oclProver.deploy();
        await uli_oclProver.initialize();

        // Deploy task manager contract
        const Uli_oclTaskManager = await ethers.getContractFactory("Uli_oclTaskManager");
        uli_oclTaskManager = await Uli_oclTaskManager.deploy();
        await uli_oclTaskManager.initialize(
            uli_oclDebits.target,
            uli_oclReward.target,
            uli_oclProver.target
        );
        await uli_oclDebits.connect(owner).setOperator(uli_oclTaskManager.target);
    });

    describe("Initialization", function () {
        it("should initialize with correct addresses", async function () {
            expect(await uli_oclTaskManager.debits()).to.equal(uli_oclDebits.target);
            expect(await uli_oclTaskManager.projectReward()).to.equal(uli_oclReward.target);
            expect(await uli_oclTaskManager.proverStore()).to.equal(uli_oclProver.target);
        });
    });

    describe("Operator Management", function () {
        it("should allow owner to add operator", async function () {
            await expect(uli_oclTaskManager.connect(owner).addOperator(user1.address))
                .to.emit(uli_oclTaskManager, "OperatorAdded")
                .withArgs(user1.address);
            expect(await uli_oclTaskManager.operators(user1.address)).to.be.true;
        });

        it("should not allow non-owner to add operator", async function () {
            await expect(uli_oclTaskManager.connect(user1).addOperator(user2.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should allow owner to remove operator", async function () {
            await uli_oclTaskManager.connect(owner).addOperator(user1.address);
            await expect(uli_oclTaskManager.connect(owner).removeOperator(user1.address))
                .to.emit(uli_oclTaskManager, "OperatorRemoved")
                .withArgs(user1.address);
            expect(await uli_oclTaskManager.operators(user1.address)).to.be.false;
        });

        it("should not allow non-owner to remove operator", async function () {
            await uli_oclTaskManager.connect(owner).addOperator(user1.address);
            await expect(uli_oclTaskManager.connect(user1).removeOperator(user1.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    // TODO recover the test after ECDSA fix
    // describe("Task Assignment", function () {
    //     let taskId: string;
    //     let taskHash: string;
    //     let taskSignature: string;
    //     let rewardAmount: BigNumber;

    //     beforeEach(async function () {
    //         // Set up task assignment
    //         taskId = ethers.encodeBytes32String("task1");
    //         rewardAmount = ethers.parseEther("1000");

    //         // Transfer tokens to taskOwner and deposit into debits contract
    //         await token.connect(owner).transfer(taskOwner.address, rewardAmount);
    //         await token.connect(taskOwner).approve(uli_oclDebits.target, rewardAmount);
    //         await uli_oclDebits.connect(taskOwner).deposit(token.target, rewardAmount);

    //         // Set reward token and amount
    //         await uli_oclReward.connect(projectOwner).setRewardToken(projectId, token.target);
    //         await uli_oclReward.connect(taskOwner).setReward(projectId, rewardAmount);

    //         // Prover registers and sets rebate ratio
    //         await uli_oclProver.connect(prover).register();
    //         await uli_oclProver.connect(prover).setRebateRatio(1000); // 10%

    //         // Generate task hash and signature
    //         taskHash = ethers.solidityPackedKeccak256(
    //             ["uint256", "bytes32", "address"],
    //             [projectId, taskId, taskOwner.address]
    //         );
    //         taskSignature = taskOwnerWallet.signingKey.sign(ethers.getBytes(taskHash)).serialized;

    //         // Owner adds operator
    //         await uli_oclTaskManager.connect(owner).addOperator(operator.address);
    //     });

    //     it("should allow operator to assign a task", async function () {
    //         const deadline = (await ethers.provider.getBlockNumber()) + 100;

    //         const assignment = {
    //             projectId: projectId,
    //             taskId: taskId,
    //             hash: taskHash,
    //             signature: taskSignature,
    //             prover: prover.address,
    //         };


    //         await expect(
    //             uli_oclTaskManager.connect(operator)["assign((uint256,bytes32,bytes32,bytes,address),address,uint256)"](assignment, sequencer.address, deadline)
    //         )
    //             .to.emit(uli_oclTaskManager, "TaskAssigned")
    //             .withArgs(projectId, taskId, prover.address, deadline);

    //         // Verify record
    //         const record = await uli_oclTaskManager.records(projectId, taskId);
    //         expect(record.prover).to.equal(prover.address);
    //         expect(record.sequencer).to.equal(sequencer.address);
    //         expect(record.deadline).to.equal(deadline);
    //         expect(record.owner).to.equal(taskOwner.address);
    //         expect(record.settled).to.be.false;
    //     });

    //     it("should not allow non-operator to assign a task", async function () {
    //         const deadline = (await ethers.provider.getBlockNumber()) + 100;

    //         const assignment = {
    //             projectId: projectId,
    //             taskId: taskId,
    //             hash: taskHash,
    //             signature: taskSignature,
    //             prover: prover.address,
    //         };

    //         await expect(
    //             uli_oclTaskManager.connect(user1)["assign((uint256,bytes32,bytes32,bytes,address),address,uint256)"](assignment, sequencer.address, deadline)
    //         )
    //             .to.be.revertedWith("not task manager operator");
    //     });
    // });

    // describe("Task Settlement", function () {
    //     let taskId: string;
    //     let taskHash: string;
    //     let taskSignature: string;
    //     let rewardAmount: BigNumber;

    //     beforeEach(async function () {
    //         // Set up task assignment
    //         taskId = ethers.encodeBytes32String("task1");
    //         rewardAmount = ethers.parseEther("1000");

    //         // Transfer tokens to taskOwner and deposit into debits contract
    //         await token.connect(owner).transfer(taskOwner.address, rewardAmount);
    //         await token.connect(taskOwner).approve(uli_oclDebits.target, rewardAmount);
    //         await uli_oclDebits.connect(taskOwner).deposit(token.target, rewardAmount);

    //         // Set reward token and amount
    //         await uli_oclReward.connect(projectOwner).setRewardToken(projectId, token.target);
    //         await uli_oclReward.connect(taskOwner).setReward(projectId, rewardAmount);

    //         // Prover registers and sets rebate ratio
    //         await uli_oclProver.connect(prover).register();
    //         await uli_oclProver.connect(prover).setRebateRatio(1000); // 10%

    //         // Generate task hash and signature
    //         taskHash = ethers.solidityPackedKeccak256(
    //             ["uint256", "bytes32", "address"],
    //             [projectId, taskId, taskOwner.address]
    //         );
    //         taskSignature = taskOwnerWallet.signingKey.sign(ethers.getBytes(taskHash)).serialized;

    //         // Owner adds operator
    //         await uli_oclTaskManager.connect(owner).addOperator(operator.address);

    //         // Assign the task
    //         const deadline = (await ethers.provider.getBlockNumber()) + 100;
    //         const assignment = {
    //             projectId: projectId,
    //             taskId: taskId,
    //             hash: taskHash,
    //             signature: taskSignature,
    //             prover: prover.address,
    //         };

    //         await uli_oclTaskManager.connect(operator)["assign((uint256,bytes32,bytes32,bytes,address),address,uint256)"](assignment, sequencer.address, deadline);
    //     });

    //     it("should allow operator to settle a task", async function () {
    //         await expect(
    //             uli_oclTaskManager.connect(operator).settle(projectId, taskId, prover.address)
    //         )
    //             .to.emit(uli_oclTaskManager, "TaskSettled")
    //             .withArgs(projectId, taskId, prover.address);

    //         // Verify record is marked as settled
    //         const record = await uli_oclTaskManager.records(projectId, taskId);
    //         expect(record.settled).to.be.true;
    //     });

    //     it("should not allow non-operator to settle a task", async function () {
    //         await expect(
    //             uli_oclTaskManager.connect(user1).settle(projectId, taskId, prover.address)
    //         )
    //             .to.be.revertedWith("not task manager operator");
    //     });

    //     it("should not allow settling with invalid prover", async function () {
    //         await expect(
    //             uli_oclTaskManager.connect(operator).settle(projectId, taskId, user1.address)
    //         )
    //             .to.be.revertedWith("invalid prover");
    //     });
    // });

    // describe("Task Recall", function () {
    //     let taskId: string;
    //     let taskHash: string;
    //     let taskSignature: string;
    //     let rewardAmount: BigNumber;

    //     beforeEach(async function () {
    //         // Set up task assignment
    //         taskId = ethers.encodeBytes32String("task1");
    //         rewardAmount = ethers.parseEther("1000");

    //         // Transfer tokens to taskOwner and deposit into debits contract
    //         await token.connect(owner).transfer(taskOwner.address, rewardAmount);
    //         await token.connect(taskOwner).approve(uli_oclDebits.target, rewardAmount);
    //         await uli_oclDebits.connect(taskOwner).deposit(token.target, rewardAmount);

    //         // Set reward token and amount
    //         await uli_oclReward.connect(projectOwner).setRewardToken(projectId, token.target);
    //         await uli_oclReward.connect(taskOwner).setReward(projectId, rewardAmount);

    //         // Prover registers and sets rebate ratio
    //         await uli_oclProver.connect(prover).register();
    //         await uli_oclProver.connect(prover).setRebateRatio(1000); // 10%

    //         // Generate task hash and signature
    //         taskHash = ethers.solidityPackedKeccak256(
    //             ["uint256", "bytes32", "address"],
    //             [projectId, taskId, taskOwner.address]
    //         );
    //         taskSignature = taskOwnerWallet.signingKey.sign(ethers.getBytes(taskHash)).serialized;

    //         // Owner adds operator
    //         await uli_oclTaskManager.connect(owner).addOperator(operator.address);

    //         // Assign the task
    //         const deadline = (await ethers.provider.getBlockNumber()) + 100;
    //         const assignment = {
    //             projectId: projectId,
    //             taskId: taskId,
    //             hash: taskHash,
    //             signature: taskSignature,
    //             prover: prover.address,
    //         };

    //         await uli_oclTaskManager.connect(operator)["assign((uint256,bytes32,bytes32,bytes,address),address,uint256)"](assignment, sequencer.address, deadline);
    //     });

    //     it("should allow task owner to recall task after deadline", async function () {
    //         // Advance block number beyond deadline
    //         await ethers.provider.send("hardhat_mine", ["0x65"]); // Mine 101 blocks

    //         await expect(
    //             uli_oclTaskManager.connect(taskOwner).recall(projectId, taskId)
    //         )
    //             .to.emit(uli_oclDebits, "Redeemed")
    //             .withArgs(
    //                 token.target,
    //                 taskOwner.address,
    //                 rewardAmount
    //             );

    //         // Verify record is updated
    //         const record = await uli_oclTaskManager.records(projectId, taskId);
    //         expect(record.prover).to.equal(ethers.ZeroAddress);
    //         expect(record.deadline).to.equal(0);
    //     });

    //     it("should not allow task owner to recall task before deadline", async function () {
    //         await expect(
    //             uli_oclTaskManager.connect(taskOwner).recall(projectId, taskId)
    //         )
    //             .to.be.revertedWith("task assignement not expired");
    //     });

    //     it("should not allow non-owner to recall task", async function () {
    //         // Advance block number beyond deadline
    //         await ethers.provider.send("hardhat_mine", ["0x65"]); // Mine 101 blocks

    //         await expect(
    //             uli_oclTaskManager.connect(user1).recall(projectId, taskId)
    //         )
    //             .to.be.revertedWith("not owner");
    //     });
    // });
});
