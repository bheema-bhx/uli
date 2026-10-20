import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Uli_oclProver", function () {
    let uli_oclProver: Contract;
    let owner: SignerWithAddress;
    let prover1: SignerWithAddress;
    let prover2: SignerWithAddress;
    let beneficiary: SignerWithAddress;

    beforeEach(async function () {
        // Get signers
        [owner, prover1, prover2, beneficiary] = await ethers.getSigners();

        // Deploy contract
        const Uli_oclProver = await ethers.getContractFactory("Uli_oclProver");
        uli_oclProver = await Uli_oclProver.deploy();
        await uli_oclProver.initialize();
    });

    describe("Initialization", function () {
        it("should set the correct owner", async function () {
            expect(await uli_oclProver.owner()).to.equal(owner.address);
        });
    });

    describe("Registration", function () {
        it("should allow a prover to register", async function () {
            await expect(uli_oclProver.connect(prover1).register())
                .to.emit(uli_oclProver, "BeneficiarySet")
                .withArgs(prover1.address, prover1.address);

            expect(await uli_oclProver.beneficiary(prover1.address)).to.equal(prover1.address);
        });

        it("should not allow double registration", async function () {
            await uli_oclProver.connect(prover1).register();
            await expect(uli_oclProver.connect(prover1).register())
                .to.be.revertedWith("already registered");
        });
    });

    describe("VM Types", function () {
        beforeEach(async function () {
            await uli_oclProver.connect(prover1).register();
        });

        it("should allow adding VM types", async function () {
            const vmType = 1;
            await expect(uli_oclProver.connect(prover1).addVMType(vmType))
                .to.emit(uli_oclProver, "VMTypeAdded")
                .withArgs(prover1.address, vmType);

            expect(await uli_oclProver.isVMTypeSupported(prover1.address, vmType)).to.be.true;
        });

        it("should allow deleting VM types", async function () {
            const vmType = 1;
            await uli_oclProver.connect(prover1).addVMType(vmType);
            await expect(uli_oclProver.connect(prover1).delVMType(vmType))
                .to.emit(uli_oclProver, "VMTypeDeleted")
                .withArgs(prover1.address, vmType);

            expect(await uli_oclProver.isVMTypeSupported(prover1.address, vmType)).to.be.false;
        });
    });

    describe("Rebate Ratio", function () {
        it("should allow setting rebate ratio", async function () {
            const ratio = 500; // 5%
            await expect(uli_oclProver.connect(prover1).setRebateRatio(ratio))
                .to.emit(uli_oclProver, "RebateRatioSet")
                .withArgs(prover1.address, ratio);

            expect(await uli_oclProver.rebateRatio(prover1.address)).to.equal(ratio);
        });
    });

    describe("Beneficiary Management", function () {
        beforeEach(async function () {
            await uli_oclProver.connect(prover1).register();
        });

        it("should allow changing beneficiary", async function () {
            await expect(uli_oclProver.connect(prover1).changeBeneficiary(beneficiary.address))
                .to.emit(uli_oclProver, "BeneficiarySet")
                .withArgs(prover1.address, beneficiary.address);

            expect(await uli_oclProver.beneficiary(prover1.address)).to.equal(beneficiary.address);
        });

        it("should not allow setting zero address as beneficiary", async function () {
            await expect(uli_oclProver.connect(prover1).changeBeneficiary(ethers.ZeroAddress))
                .to.be.revertedWith("zero address");
        });
    });

    describe("Pause/Resume", function () {
        beforeEach(async function () {
            await uli_oclProver.connect(prover1).register();
        });

        it("should allow pausing", async function () {
            await expect(uli_oclProver.connect(prover1).pause())
                .to.emit(uli_oclProver, "ProverPaused")
                .withArgs(prover1.address);

            expect(await uli_oclProver.isPaused(prover1.address)).to.be.true;
        });

        it("should not allow double pausing", async function () {
            await uli_oclProver.connect(prover1).pause();
            await expect(uli_oclProver.connect(prover1).pause())
                .to.be.revertedWith("already paused");
        });

        it("should allow resuming", async function () {
            await uli_oclProver.connect(prover1).pause();
            await expect(uli_oclProver.connect(prover1).resume())
                .to.emit(uli_oclProver, "ProverResumed")
                .withArgs(prover1.address);

            expect(await uli_oclProver.isPaused(prover1.address)).to.be.false;
        });

        it("should not allow resuming when not paused", async function () {
            await expect(uli_oclProver.connect(prover1).resume())
                .to.be.revertedWith("already actived");
        });
    });

    describe("Multiple Provers", function () {
        it("should handle multiple provers independently", async function () {
            // Register both provers
            await uli_oclProver.connect(prover1).register();
            await uli_oclProver.connect(prover2).register();

            // Set different VM types
            await uli_oclProver.connect(prover1).addVMType(1);
            await uli_oclProver.connect(prover2).addVMType(2);

            // Set different rebate ratios
            await uli_oclProver.connect(prover1).setRebateRatio(500);
            await uli_oclProver.connect(prover2).setRebateRatio(1000);

            // Verify independent state
            expect(await uli_oclProver.isVMTypeSupported(prover1.address, 1)).to.be.true;
            expect(await uli_oclProver.isVMTypeSupported(prover1.address, 2)).to.be.false;
            expect(await uli_oclProver.isVMTypeSupported(prover2.address, 1)).to.be.false;
            expect(await uli_oclProver.isVMTypeSupported(prover2.address, 2)).to.be.true;
            expect(await uli_oclProver.rebateRatio(prover1.address)).to.equal(500);
            expect(await uli_oclProver.rebateRatio(prover2.address)).to.equal(1000);
        });
    });
});