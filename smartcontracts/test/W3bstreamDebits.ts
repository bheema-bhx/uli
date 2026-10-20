import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Uli_oclDebits", function () {
    let uli_oclDebits: Contract;
    let owner: SignerWithAddress;
    let operator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let recipients: SignerWithAddress[];
    let token: Contract;
    let tokenAddress: string;
    let uli_oclDebitsAddress: string;

    beforeEach(async function () {
        [owner, operator, user1, user2, ...recipients] = await ethers.getSigners();

        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        token = await ERC20Mock.deploy(
            "Mock Token",
            "MTK",
            owner.address,
            ethers.parseEther("10000")
        );
        await token.waitForDeployment();
        tokenAddress = token.target;

        const Uli_oclDebits = await ethers.getContractFactory("Uli_oclDebits");
        uli_oclDebits = await upgrades.deployProxy(Uli_oclDebits, [], {
            initializer: "initialize",
        });
        await uli_oclDebits.waitForDeployment();
        uli_oclDebitsAddress = uli_oclDebits.target;
    });

    describe("Deposit", function () {
        it("should allow users to deposit tokens", async function () {
            const depositAmount = ethers.parseEther("1000");

            await token.transfer(user1.address, depositAmount);
            await token.connect(user1).approve(uli_oclDebitsAddress, depositAmount);

            await expect(uli_oclDebits.connect(user1).deposit(tokenAddress, depositAmount))
                .to.emit(uli_oclDebits, "Deposited")
                .withArgs(tokenAddress, user1.address, depositAmount);

            expect(await uli_oclDebits.balanceOf(tokenAddress, user1.address)).to.equal(depositAmount);
        });
    });

    describe("Withhold", function () {
        beforeEach(async function () {
            await uli_oclDebits.connect(owner).setOperator(operator.address);

            const depositAmount = ethers.parseEther("1000");
            await token.transfer(user1.address, depositAmount);
            await token.connect(user1).approve(uli_oclDebitsAddress, depositAmount);
            await uli_oclDebits.connect(user1).deposit(tokenAddress, depositAmount);
        });

        it("should allow operator to withhold tokens", async function () {
            const withholdAmount = ethers.parseEther("500");
            await expect(
                uli_oclDebits.connect(operator).withhold(tokenAddress, user1.address, withholdAmount)
            )
                .to.emit(uli_oclDebits, "Withheld")
                .withArgs(tokenAddress, user1.address, withholdAmount);

            expect(await uli_oclDebits.balanceOf(tokenAddress, user1.address)).to.equal(
                ethers.parseEther("500")
            );
        });
    });

    describe("Redeem", function () {
        beforeEach(async function () {
            await uli_oclDebits.connect(owner).setOperator(operator.address);

            const depositAmount = ethers.parseEther("1000");
            await token.transfer(user1.address, depositAmount);
            await token.connect(user1).approve(uli_oclDebitsAddress, depositAmount);
            await uli_oclDebits.connect(user1).deposit(tokenAddress, depositAmount);

            const withholdAmount = ethers.parseEther("1000");
            await uli_oclDebits.connect(operator).withhold(tokenAddress, user1.address, withholdAmount);
        });

        it("should allow operator to redeem tokens", async function () {
            const redeemAmount = ethers.parseEther("500");
            await expect(
                uli_oclDebits.connect(operator).redeem(tokenAddress, user1.address, redeemAmount)
            )
                .to.emit(uli_oclDebits, "Redeemed")
                .withArgs(tokenAddress, user1.address, redeemAmount);

            expect(await uli_oclDebits.balanceOf(tokenAddress, user1.address)).to.equal(
                ethers.parseEther("500")
            );
        });
    });

    describe("Withdraw", function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther("1000");
            await token.transfer(user1.address, depositAmount);
            await token.connect(user1).approve(uli_oclDebitsAddress, depositAmount);
            await uli_oclDebits.connect(user1).deposit(tokenAddress, depositAmount);
        });

        it("should allow user to withdraw", async function () {
            const withdrawAmount = ethers.parseEther("500");

            await expect(uli_oclDebits.connect(user1).withdraw(tokenAddress, withdrawAmount))
                .to.emit(uli_oclDebits, "Withdrawn")
                .withArgs(tokenAddress, user1.address, withdrawAmount);

            expect(await token.balanceOf(user1.address)).to.equal(withdrawAmount);
        });
    });
});
