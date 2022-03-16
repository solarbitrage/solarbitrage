import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { OnChain } from "../target/types/on_chain";

describe("on-chain", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.OnChain as Program<OnChain>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
