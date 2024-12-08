import { SupraAccount, SupraClient, HexString } from "supra-l1-sdk";

(async () => {
  // Initialize Supra Client with testnet
  let supraClient = await SupraClient.init("https://rpc-testnet.supra.com/");

  // Create sender account (replace with your private key)
  let senderAccount = new SupraAccount(
    Buffer.from(
      "e0a3d14bcd39f4f2f92c0f786f8acc2fcfc4dfea5a792a54286b7bc8d7aacede", // Replace this with your private key
      "hex"
    )
  );
  
  // Print sender's address
  console.log("Sender Address:", senderAccount.address());

  // Create receiver address (replace with the address you want to send to)
  let receiverAddress = new HexString(
    "0x260095b6c774f764d0e0772d9b87d5c6ccfff8578e89437b3367cced892ca486" // Replace this with receiver's address
  );
  
  // Check sender's balance before transfer
  console.log(
    "Sender Balance Before:",
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );

  // Send 1000 SUPRA coins
  try {
    let txResult = await supraClient.transferSupraCoin(
      senderAccount,
      receiverAddress,
      BigInt(20000000),
      {
        enableTransactionWaitAndSimulationArgs: {
          enableWaitForTransaction: true,
          enableTransactionSimulation: true,
        },
      }
    );
    
    console.log("Transaction Hash:", txResult.txHash);
    console.log("Transaction Success!");
    
    // Check sender's balance after transfer
    console.log(
      "Sender Balance After:",
      await supraClient.getAccountSupraCoinBalance(senderAccount.address())
    );
  } catch (error) {
    console.error("Transaction failed:", error);
  }
})();