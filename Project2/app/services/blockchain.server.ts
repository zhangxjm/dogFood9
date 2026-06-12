import CryptoJS from "crypto-js";

export interface BlockchainTx {
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  data: string;
}

export interface CertificateInfo {
  certificateNo: string;
  contentHash: string;
  blockchainTxHash: string;
  blockNumber: number;
  timestamp: Date;
}

function generateTxHash(data: string): string {
  const randomSalt = Math.random().toString(36).substring(2, 15);
  return "0x" + CryptoJS.SHA256(data + randomSalt + Date.now().toString()).toString(CryptoJS.enc.Hex);
}

function generateBlockNumber(): number {
  return Math.floor(1000000 + Math.random() * 9000000);
}

function generateCertificateNo(): string {
  const prefix = "CR";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${date}${random}`;
}

export function calculateContentHash(content: string): string {
  return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex);
}

export function calculateDigitalSignature(content: string, privateKey: string = "copyright-system"): string {
  return CryptoJS.HmacSHA256(content, privateKey).toString(CryptoJS.enc.Hex);
}

export async function anchorToBlockchain(data: string): Promise<BlockchainTx> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  
  const txHash = generateTxHash(data);
  const blockNumber = generateBlockNumber();
  
  return {
    txHash,
    blockNumber,
    timestamp: new Date(),
    data
  };
}

export async function createCopyrightCertificate(
  contentHash: string,
  title: string,
  author: string
): Promise<CertificateInfo> {
  const certData = `${contentHash}:${title}:${author}:${Date.now()}`;
  const tx = await anchorToBlockchain(certData);
  
  return {
    certificateNo: generateCertificateNo(),
    contentHash,
    blockchainTxHash: tx.txHash,
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp
  };
}

export async function anchorEvidence(
  evidenceData: string
): Promise<{ txHash: string; blockNumber: number; timestamp: Date }> {
  const tx = await anchorToBlockchain(`EVIDENCE:${evidenceData}`);
  return {
    txHash: tx.txHash,
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp
  };
}
