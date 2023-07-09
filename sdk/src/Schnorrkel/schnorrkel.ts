import secp256k1 from 'secp256k1'

import { Key, Nonces, PublicNonces, Signature, NoncePairs } from './types'

import { _generateL, _aCoefficient, _generatePublicNonces, _multiSigSign, _hashPrivateKey, _sumSigs, _verify, _generatePk, _sign } from './core'
import { InternalNonces, InternalPublicNonces } from './core/types'
import { Challenge, FinalPublicNonce, SignatureOutput } from './types/signature'

class Schnorrkel {
  protected nonces: Nonces = {}

  private _setNonce(privateKey: Buffer): string {
    const { publicNonceData, privateNonceData, hash } = _generatePublicNonces(privateKey)

    const mappedPublicNonce: PublicNonces = {
      kPublic: new Key(Buffer.from(publicNonceData.kPublic)),
      kTwoPublic: new Key(Buffer.from(publicNonceData.kTwoPublic)),
    }

    const mappedPrivateNonce: Pick<NoncePairs, 'k' | 'kTwo'> = {
      k: new Key(Buffer.from(privateNonceData.k)),
      kTwo: new Key(Buffer.from(privateNonceData.kTwo))
    }

    this.nonces[hash] = { ...mappedPrivateNonce, ...mappedPublicNonce }
    return hash
  }

  static getCombinedPublicKey(publicKeys: Array<Key>): Key {
    if (publicKeys.length < 2) {
      throw Error('At least 2 public keys should be provided')
    }

    const bufferPublicKeys = publicKeys.map(publicKey => publicKey.buffer)
    const L = _generateL(bufferPublicKeys)

    const modifiedKeys = bufferPublicKeys.map(publicKey => {
      return secp256k1.publicKeyTweakMul(publicKey, _aCoefficient(publicKey, L))
    })

    return new Key(Buffer.from(secp256k1.publicKeyCombine(modifiedKeys)))
  }

  static getCombinedAddress(publicKeys: Array<Key>): string {
    if (publicKeys.length < 2) throw Error('At least 2 public keys should be provided')

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const px = _generatePk(combinedPublicKey.buffer)
    return px
  }

  generatePublicNonces(privateKey: Key): PublicNonces {
    const hash = this._setNonce(privateKey.buffer)
    const nonce = this.nonces[hash]

    return {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    }
  }

  getPublicNonces(privateKey: Key): PublicNonces {
    const hash = _hashPrivateKey(privateKey.buffer)
    const nonce = this.nonces[hash]

    return {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    }
  }

  hasNonces(privateKey: Key): boolean {
    const hash = _hashPrivateKey(privateKey.buffer)
    return hash in this.nonces
  }

  private clearNonces(privateKey: Key): void {
    const x = privateKey.buffer
    const hash = _hashPrivateKey(x)

    delete this.nonces[hash]
  }

  multiSigSign(privateKey: Key, msg: string, publicKeys: Key[], publicNonces: PublicNonces[], hashFn: Function|null = null): SignatureOutput {
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const mappedPublicNonce: InternalPublicNonces[] = publicNonces.map(publicNonce => {
      return {
        kPublic: publicNonce.kPublic.buffer,
        kTwoPublic: publicNonce.kTwoPublic.buffer,
      }
    })

    const mappedNonces: InternalNonces = Object.fromEntries(Object.entries(this.nonces).map(([hash, nonce]) => {
      return [
        hash,
        {
          k: nonce.k.buffer,
          kTwo: nonce.kTwo.buffer,
          kPublic: nonce.kPublic.buffer,
          kTwoPublic: nonce.kTwoPublic.buffer,
        }
      ]
    }))

    const musigData = _multiSigSign(mappedNonces, combinedPublicKey.buffer, privateKey.buffer, msg, publicKeys.map(key => key.buffer), mappedPublicNonce, hashFn)

    // absolutely crucial to delete the nonces once a signature has been crafted with them.
    // nonce reusae will lead to private key leakage!
    this.clearNonces(privateKey)

    return {
      signature: new Signature(Buffer.from(musigData.signature)),
      finalPublicNonce: new FinalPublicNonce(Buffer.from(musigData.finalPublicNonce)),
      challenge: new Challenge(Buffer.from(musigData.challenge)),
    }
  }

  static sign(privateKey: Key, msg: string, hashFn: Function|null = null): SignatureOutput {
    const output = _sign(privateKey.buffer, msg, hashFn)

    return {
      signature: new Signature(Buffer.from(output.signature)),
      finalPublicNonce: new FinalPublicNonce(Buffer.from(output.finalPublicNonce)),
      challenge: new Challenge(Buffer.from(output.challenge)),
    }
  }

  static sumSigs(signatures: Signature[]): Signature {
    const mappedSignatures = signatures.map(signature => signature.buffer)
    const sum = _sumSigs(mappedSignatures)
    return new Signature(Buffer.from(sum))
  }

  static verify(
    signature: Signature,
    msg: string,
    finalPublicNonce: FinalPublicNonce,
    publicKey: Key,
    hashFn: Function|null = null
  ): boolean {
    return _verify(signature.buffer, msg, finalPublicNonce.buffer, publicKey.buffer, hashFn)
  }
}

export default Schnorrkel