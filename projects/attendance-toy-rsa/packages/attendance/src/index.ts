import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDNQA5P2EOSRGAS4DTZKVTZRVWEDWTFRG7NZDUOBLU3X3PCUOAHF7NSY",
  }
} as const

export type AulaState = {tag: "Registration", values: void} | {tag: "Challenging", values: void} | {tag: "Closed", values: void};


export interface PubKey {
  e: u32;
  n: u32;
}


export interface AulaData {
  name: string;
  state: AulaState;
  students: Array<string>;
  teacher: string;
}

export type DataKey = {tag: "AulaCounter", values: void} | {tag: "Aula", values: readonly [u64]} | {tag: "PubKey", values: readonly [u64, string]} | {tag: "Challenge", values: readonly [u64, string]} | {tag: "ValidSub", values: readonly [u64, string]} | {tag: "Nft", values: readonly [u64, string]} | {tag: "NftCounter", values: readonly [u64]};

export const Errors = {
  1: {message:"AulaNotFound"},
  2: {message:"NotTeacher"},
  3: {message:"WrongState"},
  4: {message:"AlreadyRegistered"},
  5: {message:"NotRegistered"},
  6: {message:"InvalidRsaParams"},
  7: {message:"NoChallengeIssued"},
  8: {message:"InvalidSignature"},
  9: {message:"InvalidMValue"}
}

export interface Client {
  /**
   * Construct and simulate a create_aula transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Qualquer endereço pode criar uma aula — vira dono dela.
   */
  create_aula: ({caller, name}: {caller: string, name: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Aluno envia sua chave pública (n, e). Só em Registration.
   */
  register: ({caller, aula_id, n, e}: {caller: string, aula_id: u64, n: u32, e: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a issue_challenges transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Professora lança desafios em batch e muda pra Challenging.
   */
  issue_challenges: ({caller, aula_id, ms}: {caller: string, aula_id: u64, ms: Array<readonly [string, u32]>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit_signature transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Aluno submete s; contrato verifica s^e mod n == m. Reverte se inválido.
   */
  submit_signature: ({caller, aula_id, s}: {caller: string, aula_id: u64, s: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a close_aula transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Professora fecha a aula: minta NFT pros ValidSub=true em batch.
   */
  close_aula: ({caller, aula_id}: {caller: string, aula_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_aula transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_aula: ({aula_id}: {aula_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<AulaData>>>

  /**
   * Construct and simulate a get_pubkey transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pubkey: ({aula_id, student}: {aula_id: u64, student: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<PubKey>>>

  /**
   * Construct and simulate a get_challenge transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_challenge: ({aula_id, student}: {aula_id: u64, student: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<u32>>>

  /**
   * Construct and simulate a get_nft transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_nft: ({aula_id, student}: {aula_id: u64, student: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<u64>>>

  /**
   * Construct and simulate a has_valid_sub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_valid_sub: ({aula_id, student}: {aula_id: u64, student: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a aula_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  aula_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "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" ]),
      options
    )
  }
  public readonly fromJSON = {
    create_aula: this.txFromJSON<u64>,
        register: this.txFromJSON<Result<void>>,
        issue_challenges: this.txFromJSON<Result<void>>,
        submit_signature: this.txFromJSON<Result<void>>,
        close_aula: this.txFromJSON<Result<u64>>,
        get_aula: this.txFromJSON<Option<AulaData>>,
        get_pubkey: this.txFromJSON<Option<PubKey>>,
        get_challenge: this.txFromJSON<Option<u32>>,
        get_nft: this.txFromJSON<Option<u64>>,
        has_valid_sub: this.txFromJSON<boolean>,
        aula_count: this.txFromJSON<u64>
  }
}