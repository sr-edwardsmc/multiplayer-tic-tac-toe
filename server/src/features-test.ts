import crypto, { Hash } from "crypto";

function generateHash(data: string[], callback: (hash: string[]) => void) {
  let counter: number = 0;
  let results: string[] = [];

  let internalHashingFunc = () => {
    if (counter == data.length) {
      callback(results);
    }

    let md5: Hash = crypto.createHash("md5");
    md5.update(data[counter]);

    results.push(md5.digest("hex"));
    counter++;

    process.nextTick(internalHashingFunc);
  };

  internalHashingFunc();
}

generateHash(["Edward", "Monsalve", "Estella", "Juan David"], console.log);

setTimeout(() => {
  setTimeout(() => console.log("This should be printed before the hashing"));
});
