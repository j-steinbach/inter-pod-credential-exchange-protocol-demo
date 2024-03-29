const {
  Bls12381G2KeyPair,
  BbsBlsSignature2020,
  BbsBlsSignatureProof2020,
  deriveProof,
} = require("@mattrglobal/jsonld-signatures-bbs");
const {
  extendContextLoader,
  sign,
  verify,
  purposes,
} = require("jsonld-signatures");

const keyPairOptions = require("../../data/keyPair.json");
const exampleControllerDoc = require("../../data/controllerDocument.json");
const bbsContext = require("../../data/bbs.json");
const revealDocument = require("../../data/deriveProofFrame.json");
const citizenVocab = require("../../data/citizenVocab.json");
const credentialContext = require("../../data/credentialsContext.json");
const suiteContext = require("../../data/suiteContext.json");

const documents = {
  "did:example:489398593#test": keyPairOptions,
  "did:example:489398593": exampleControllerDoc,
  "https://w3id.org/security/bbs/v1": bbsContext,
  "https://w3id.org/citizenship/v1": citizenVocab,
  "https://www.w3.org/2018/credentials/v1": credentialContext,
  "https://w3id.org/security/suites/jws-2020/v1": suiteContext,
};

const customDocLoader = (url) => {
  const context = documents[url];

  if (context) {
    return {
      contextUrl: null, // this is for a context via a link header
      document: context, // this is the actual document that was loaded
      documentUrl: url, // this is the actual context URL after redirects
    };
  }

  console.log(
    `Attempted to remote load context : '${url}', please cache instead`,
  );
  throw new Error(
    `Attempted to remote load context : '${url}', please cache instead`,
  );
};

//Extended document load that uses local contexts
const documentLoader = extendContextLoader(customDocLoader);

const signDocument = async (inputDocument) => {
  //Import the example key pair
  const keyPair = await new Bls12381G2KeyPair(keyPairOptions);

  console.log("Input document");
  console.log(JSON.stringify(inputDocument, null, 2));

  //Sign the input document
  const signedDocument = await sign(inputDocument, {
    suite: new BbsBlsSignature2020({ key: keyPair }),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader,
  });

  console.log("Input document with proof");
  console.log(JSON.stringify(signedDocument, null, 2));

  //Verify the proof
  const verificationResult = await verify(signedDocument, {
    suite: new BbsBlsSignature2020(),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader,
  });

  console.log("Verification result");
  console.log(JSON.stringify(verificationResult, null, 2));

  return { signedDocument, verificationResult };
};

const deriveDocument = async (signedDocument) => {
  console.log("Signed document");
  console.log(JSON.stringify(signedDocument, null, 2));

  //Derive a proof
  const derivedProof = await deriveProof(signedDocument, revealDocument, {
    suite: new BbsBlsSignatureProof2020(),
    documentLoader,
  });

  console.log("Derived proof");
  console.log(JSON.stringify(derivedProof, null, 2));

  //Verify the derived proof
  const verified = await verify(derivedProof, {
    suite: new BbsBlsSignatureProof2020(),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader,
  });

  console.log("Verification result");
  console.log(JSON.stringify(verified, null, 2));

  return { document: derivedProof, verification: verified };
};

const verifyDocument = async (derivedProof) => {
  console.log("Derived proof");
  console.log(JSON.stringify(derivedProof, null, 2));

  //Verify the derived proof
  const verified = await verify(derivedProof, {
    suite: new BbsBlsSignatureProof2020(),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader,
  });

  console.log("Verification result");
  console.log(JSON.stringify(verified, null, 2));

  return { document: derivedProof, verification: verified };
};

module.exports = { signDocument, deriveDocument, verifyDocument };
