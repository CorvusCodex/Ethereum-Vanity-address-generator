// Import required Node.js modules
const { Worker, isMainThread, parentPort } = require('worker_threads'); // For multi-threading
const os = require('os'); // For accessing system information like CPU count
const ethers = require('ethers'); // Ethereum wallet generation library
const readline = require('readline'); // For reading user input from command line

// Function to display credits and donation information
function credit() {
  console.log("===========================================================");
  console.log("Ethereum Vanity address generator");
  console.log("Created by: Corvus Codex");
  console.log("Github: https://github.com/CorvusCodex/");
  console.log("Licence : MIT License");
  console.log("===========================================================");
  console.log("Support my work:");
  console.log("BTC: bc1q7wth254atug2p4v9j3krk9kauc0ehys2u8tgg3");
  console.log("ETH & BNB: 0x68B6D33Ad1A3e0aFaDA60d6ADf8594601BE492F0");
  console.log("Buy me a coffee: https://www.buymeacoffee.com/CorvusCodex");
  console.log("===========================================================");
};

// Main thread execution
if (isMainThread) {
  let totalCount = 0; // Counter for total addresses generated across all threads
  
  // Create interface for reading user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Prompt user for desired phrase and start generation process
  rl.question('Enter the phrase you want to use: ', (phrase) => {
    const numThreads = os.cpus().length; // Get number of CPU cores for parallel processing
    let finishedThreads = 0; // Track completed worker threads

    // Spawn worker threads equal to number of CPU cores
    for (let i = 0; i < numThreads; i++) {
      const worker = new Worker(__filename); // Create new worker with this file
      worker.postMessage(phrase); // Send desired phrase to worker

      // Handle messages from workers
      worker.on('message', (data) => {
        if (data.address) { // If worker found a matching address
          console.clear(); // Clear console for clean output
          credit(); // Show credits
          console.log(`Your vanity address is: ${data.address}`); // Display found address
          console.log(`Your private key is: ${data.privateKey}`); // Display private key
          console.log("If you are satisfied: ");
          console.log("Send a tip to: 0x68B6D33Ad1A3e0aFaDA60d6ADf8594601BE492F0");
          console.log("Buy me a coffee: https://www.buymeacoffee.com/CorvusCodex");
          console.log("Huge Thanks!");
          console.log("===========================================================");
          process.exit(0); // Exit with success
        } 
        else if (data.count) { // Progress update from worker
          totalCount += data.count; // Add worker's count to total
          if (totalCount % 10000 === 0) { // Every 10000 addresses, update display
            console.clear();
            credit();
            console.log(`Searching... Generated ${totalCount} addresses so far...`);
            console.log("===========================================================");
          }
        } 
        else { // Worker finished without finding address
          finishedThreads++;
          if (finishedThreads === numThreads) { // If all workers finished
            console.log(`Sorry, no address found containing the phrase "${phrase}"`);
            process.exit(1); // Exit with failure
          }
        }
      });
    }
  });
} 
// Worker thread execution
else {
  // Listen for phrase from main thread
  parentPort.on('message', (phrase) => {
    let address; // Variable to store generated address
    let count = 0; // Counter for addresses generated in this worker

    // Infinite loop to generate addresses until match is found
    while (true) {
      const wallet = ethers.Wallet.createRandom(); // Generate random Ethereum wallet
      address = wallet.address; // Get public address
      count++; // Increment counter

      if (count % 10000 === 0) { // Every 10000 addresses, send progress update
        parentPort.postMessage({ count });
      }

      if (address.includes(phrase)) { // If address contains desired phrase
        // Send found address and private key to main thread
        parentPort.postMessage({ 
          address, 
          privateKey: wallet.privateKey 
        });
        return; // Exit worker
      }
    }
  });
}
