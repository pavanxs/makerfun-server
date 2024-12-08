import {
    HexString,
    SupraAccount,
    SupraClient,
} from "supra-l1-sdk";

/**
 * Transfers SUPRA coins from a sender wallet to a receiver address
 * @param senderPrivateKey The private key of the sender's wallet (hex string)
 * @param receiverAddress The receiver's wallet address
 * @param amount Amount to transfer (in smallest unit)
 * @returns Transaction result data
 */
export async function sendSUPRA(
    senderPrivateKey: string,
    receiverAddress: string,
    amount: bigint
) {
    try {

        const senderPrivateKey = process.env.SECRET_KEY as string;
        // Initialize Supra Client with testnet
        const supraClient = await SupraClient.init(
            "https://rpc-testnet.supra.com/"
        );

        // Create sender account from private key
        const senderAccount = new SupraAccount(
            Buffer.from(senderPrivateKey, "hex")
        );

        // Convert receiver address to proper format
        const receiverAddr = new HexString(receiverAddress);

        // Check if sender account exists and has sufficient balance
        const senderExists = await supraClient.isAccountExists(senderAccount.address());
        if (!senderExists) {
            throw new Error("Sender account does not exist");
        }

        const senderBalance = await supraClient.getAccountSupraCoinBalance(senderAccount.address());
        if (senderBalance < amount) {
            throw new Error("Insufficient balance in sender account");
        }

        // Perform the transfer
        const txResult = await supraClient.transferSupraCoin(
            senderAccount,
            receiverAddr,
            amount,
            {
                enableTransactionWaitAndSimulationArgs: {
                    enableWaitForTransaction: true,
                    enableTransactionSimulation: true,
                },
            }
        );

        return {
            success: true,
            transactionHash: txResult.txHash,
            sender: senderAccount.address().toString(),
            receiver: receiverAddr.toString(),
            amount: amount.toString()
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

// Example usage with proper async execution:
async function main() {
    try {
        const result = await sendSUPRA(
            "2b9654793a999d1d487dabbd1b8f194156e15281fa1952af121cc97b27578d89",
            "0xb8922417130785087f9c7926e76542531b703693fdc74c9386b65cf4427f4e80",
            BigInt(1000000)
        );
        console.log(result);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Execute the main function
main().catch(console.error);
