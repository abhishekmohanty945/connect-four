import MerkleTree from "merkletreejs";
import { keccak256 } from "ethers/lib/utils";

export class MerkleTreeWrapper {
  private tree: MerkleTree | null;

  constructor(elements: Buffer[]) {
    this.tree =
      elements.length > 0
        ? new MerkleTree(elements, keccak256, { sort: true })
        : null;
  }

  get root(): string {
    return this.tree ? this.tree.getHexRoot() : "";
  }

  generateProof(element: Buffer): string[] {
    return this.tree ? this.tree.getHexProof(element) : [];
  }

  addLeaves(elements: Buffer[]): void {
    if (this.tree) {
      this.tree.addLeaves(elements);
    } else {
      this.tree = new MerkleTree(elements, keccak256, { sort: true });
    }
  }

  clear(): void {
    this.tree = null;
  }
}
